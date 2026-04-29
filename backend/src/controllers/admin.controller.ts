import { Request, Response } from "express";
import { pool } from "../db";
import bcrypt from "bcrypt";
import { sendApprovalMail } from "../config/mailer";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

export const approveUser = async (req: Request, res: Response) => {
  const client = await pool.connect();

  try {
    const { userId, type } = req.body;

    if (!userId || !type) {
      return res.status(400).json({ message: "userId and type required" });
    }

    await client.query("BEGIN");

    let name = "";
    let email = "";
    let role = "";

    // ================= GET DETAILS =================
    if (type === "RA") {
      const result = await client.query(
        `SELECT first_name, surname, email FROM ra_details WHERE id=$1`,
        [userId]
      );

      if (result.rowCount === 0) {
        throw new Error("RA not found");
      }

      const ra = result.rows[0];
      name = `${ra.first_name} ${ra.surname}`;
      email = ra.email.trim().toLowerCase();
      role = "RESEARCH_ANALYST";

    } else if (type === "BROKER") {
      const result = await client.query(
        `SELECT legal_name, email FROM broker_details WHERE id=$1`,
        [userId]
      );

      if (result.rowCount === 0) {
        throw new Error("Broker not found");
      }

      const broker = result.rows[0];
      name = broker.legal_name;
      email = broker.email.trim().toLowerCase();
      role = "BROKER";

    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

    // ================= CHECK EXISTING USER =================
    const existing = await client.query(
      `SELECT id, status FROM users WHERE email = $1`,
      [email]
    );

    let finalUserId: string;

    if ((existing.rowCount ?? 0) > 0) {
      // ✅ reuse existing user
      const user = existing.rows[0];
      finalUserId = user.id;

      await client.query(
        `UPDATE users 
         SET name=$1, role=$2, status='inactive'
         WHERE id=$3`,
        [name, role, finalUserId]
      );

    } else {
      // ✅ create new user (NO manual id)
      const tempPassword = await bcrypt.hash("temp123", 10);

      const insertRes = await client.query(
        `
        INSERT INTO users 
        (name, email, username, password_hash, role, status, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,NOW())
        RETURNING id
        `,
        [
          name,
          email,
          email.split("@")[0],
          tempPassword,
          role,
          "inactive",
        ]
      );

      finalUserId = insertRes.rows[0].id;
    }

    // ================= LINK DETAILS TABLE =================
    if (type === "RA") {
      await client.query(
        `UPDATE ra_details 
         SET status='approved',
             user_id = $1
         WHERE id = $2`,
        [finalUserId, userId]
      );
    } else {
      await client.query(
        `UPDATE broker_details 
         SET status='approved',
             user_id = $1
         WHERE id = $2`,
        [finalUserId, userId]
      );
    }

    // ================= CREATE RESET TOKEN =================
    const token = crypto.randomBytes(32).toString("hex");

    await client.query(
      `UPDATE users 
       SET reset_token=$1, token_expiry=$2
       WHERE id=$3`,
      [token, new Date(Date.now() + 60 * 60 * 1000), finalUserId]
    );

    // ================= COMMIT =================
    await client.query("COMMIT");

    // ================= SEND EMAIL =================
    const link = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
    await sendApprovalMail(email, name, link);

    return res.json({
      success: true,
      message: `${type} approved successfully ✅`,
      user_id: finalUserId,
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Approve Error:", error);

    return res.status(500).json({
      message: error instanceof Error ? error.message : "Server error",
    });
  } finally {
    client.release();
  }
};