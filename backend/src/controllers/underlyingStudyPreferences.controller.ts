import type { Response } from "express";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";
import { getUnderlyingStudyPersonalization } from "../services/underlyingStudyPreferences.service";

export const getMyUnderlyingStudyPreferences =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Authentication is required.",
      });
    }

    try {
      // Do not trust the role stored in the JWT.
      const actorResult = await pool.query(
        `
          SELECT role, status, is_active
          FROM users
          WHERE id = $1
          LIMIT 1
        `,
        [userId]
      );

      const actor = actorResult.rows[0];

      if (
        !actor ||
        actor.role !== "RESEARCH_ANALYST" ||
        actor.status?.toLowerCase() !==
          "active" ||
        actor.is_active !== true
      ) {
        return res.status(403).json({
          success: false,
          code: "ACTIVE_RA_REQUIRED",
          message:
            "An active Research Analyst account is required.",
        });
      }

      const preferences =
        await getUnderlyingStudyPersonalization(
          userId
        );

      return res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      console.error(
        "GET STUDY PREFERENCES ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        code:
          "STUDY_PREFERENCES_FETCH_FAILED",
        message:
          "Unable to load underlying-study preferences.",
      });
    }
  };