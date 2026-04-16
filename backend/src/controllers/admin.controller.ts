import { Request, Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import { sendApprovalMail } from "../config/mailer";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export const approveUser = async (req: Request, res: Response) => {
  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ message: "userId and type required" });
    }

    let userData: { id: string; name: string; email: string; role: string };

    // ================= GET DETAILS =================
    if (type === "RA") {
      const result = await pool.query(
        `SELECT first_name, surname, email FROM ra_details WHERE id=$1`,
        [userId]
      );

      if (result.rows.length === 0)
        return res.status(404).json({ message: "RA not found" });

      const ra = result.rows[0];

      userData = {
        id: crypto.randomUUID(),
        name: `${ra.first_name} ${ra.surname}`,
        email: ra.email.trim().toLowerCase(),
        role: "RESEARCH_ANALYST",
      };
    } else if (type === "BROKER") {
      const result = await pool.query(
        `SELECT legal_name, email FROM broker_details WHERE id=$1`,
        [userId]
      );

      if (result.rows.length === 0)
        return res.status(404).json({ message: "Broker not found" });

      const broker = result.rows[0];

      userData = {
        id: crypto.randomUUID(),
        name: broker.legal_name,
        email: broker.email.trim().toLowerCase(),
        role: "BROKER",
      };
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

    // ================= CHECK EXISTING USER =================
    const existing = await pool.query(
      `SELECT id, status FROM users WHERE email = $1`,
      [userData.email]
    );

    if (existing.rows.length > 0) {
      const user = existing.rows[0];

      if (user.status === "active") {
        return res.status(400).json({
          message: "User already active ❌",
        });
      }

      // 🔥 IMPORTANT: restore deleted/inactive user instead of inserting new
      await pool.query(
        `
        UPDATE users 
        SET name=$1,
            role=$2,
            status='inactive'
        WHERE email=$3
        `,
        [userData.name, userData.role, userData.email]
      );
    } else {
      // ================= INSERT NEW USER =================
      const tempPassword = await bcrypt.hash("temp123", 10);

      await pool.query(
        `
        INSERT INTO users 
        (id, name, email, username, password_hash, role, status, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
        `,
        [
          userData.id,
          userData.name,
          userData.email,
          userData.email.split("@")[0],
          tempPassword,
          userData.role,
          "inactive",
        ]
      );
    }

    // ================= CREATE RESET TOKEN =================
    const token = crypto.randomBytes(32).toString("hex");

    await pool.query(
      `
      UPDATE users 
      SET reset_token=$1, token_expiry=$2
      WHERE email=$3
      `,
      [token, new Date(Date.now() + 60 * 60 * 1000), userData.email]
    );

    // ================= UPDATE DETAILS TABLE =================
    if (type === "RA") {
      await pool.query(
        `UPDATE ra_details SET status='approved' WHERE email=$1`,
        [userData.email]
      );
    } else {
      await pool.query(
        `UPDATE broker_details SET status='approved' WHERE email=$1`,
        [userData.email]
      );
    }

    // ================= SEND EMAIL =================
    const link = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
    await sendApprovalMail(userData.email, userData.name, link);

    return res.json({
      success: true,
      message: `${type} approved successfully ✅`,
    });

  } catch (error) {
    console.error("Approve Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};