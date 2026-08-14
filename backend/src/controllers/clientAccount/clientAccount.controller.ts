import bcrypt from "bcrypt";
import { Response } from "express";
import { pool } from "../../db";
import { AuthRequest } from "../../middlewares/auth.middleware";

export const getClientProfile = async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.id;

    if (!clientId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT
         client.id,
         client.name,
         client.username,
         client.email,
         client.role,
         client.status,
         client.created_at,
         profile.first_name,
         profile.last_name,
         profile.phone_number,
         profile.profile_image
       FROM users client
       LEFT JOIN client_profiles profile ON profile.user_id = client.id
       WHERE client.id = $1 AND client.role = 'CLIENT'
       LIMIT 1`,
      [clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const profile = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: profile.id,
        name: profile.name || profile.username || "Client",
        username: profile.username,
        email: profile.email,
        firstName: profile.first_name || null,
        lastName: profile.last_name || null,
        phoneNumber: profile.phone_number || null,
        profileImage: profile.profile_image
          ? `/uploads/${String(profile.profile_image).replace(/^[/\\]+/, "")}`
          : null,
        role: profile.role,
        status: profile.status,
        memberSince: profile.created_at,
      },
    });
  } catch (error) {
    console.error("GET CLIENT PROFILE ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load profile" });
  }
};

export const changeClientPassword = async (req: AuthRequest, res: Response) => {
  try {
    const clientId = req.user?.id;
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!clientId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }

    const result = await pool.query(
      `SELECT password_hash
       FROM users
       WHERE id = $1 AND role = 'CLIENT'
       LIMIT 1`,
      [clientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }

    const matches = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!matches) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2 AND role = 'CLIENT'`,
      [passwordHash, clientId]
    );

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("CHANGE CLIENT PASSWORD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to change password" });
  }
};
