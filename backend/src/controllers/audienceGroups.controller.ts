import type { Response } from "express";
import { pool } from "../db";
import type { AuthRequest } from "../middlewares/auth.middleware";

type MemberInput = { type: "CLIENT" | "BROKER"; id: string };
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

const parseGroup = (body: Record<string, unknown>) => {
  const name = String(body.name || "").trim().replace(/\s+/g, " ");
  const description = String(body.description || "").trim();
  const rawMembers = Array.isArray(body.members) ? body.members : [];
  const members: MemberInput[] = [];
  const seen = new Set<string>();
  for (const item of rawMembers) {
    if (!item || typeof item !== "object") continue;
    const type = String((item as { type?: unknown }).type || "").toUpperCase();
    const id = String((item as { id?: unknown }).id || "");
    const key = `${type}:${id}`;
    if ((type === "CLIENT" || type === "BROKER") && uuidPattern.test(id) && !seen.has(key)) {
      seen.add(key);
      members.push({ type, id } as MemberInput);
    }
  }
  if (name.length < 2 || name.length > 80) throw new Error("Group name must be between 2 and 80 characters.");
  if (description.length > 240) throw new Error("Group description must not exceed 240 characters.");
  if (members.length > 500) throw new Error("A group can contain up to 500 connections.");
  return { name, description: description || null, members };
};

const loadGroups = async (raUserId: string) => {
  const result = await pool.query(
    `SELECT audience_group.id, audience_group.name, audience_group.description,
       audience_group.created_at AS "createdAt", audience_group.updated_at AS "updatedAt",
       COALESCE(jsonb_agg(jsonb_build_object(
         'type', member.member_type,
         'id', CASE WHEN member.member_type = 'CLIENT' THEN member.client_user_id ELSE member.broker_id END,
         'name', CASE WHEN member.member_type = 'CLIENT'
           THEN COALESCE(NULLIF(TRIM(client.name), ''), client.email, 'Client')
           ELSE COALESCE(NULLIF(TRIM(broker.trade_name), ''), broker.legal_name, 'Broker') END
       ) ORDER BY member.member_type, CASE WHEN member.member_type = 'CLIENT' THEN client.name ELSE broker.legal_name END)
       FILTER (WHERE member.id IS NOT NULL), '[]'::jsonb) AS members
     FROM ra_audience_groups audience_group
     LEFT JOIN ra_audience_group_members member ON member.group_id = audience_group.id
     LEFT JOIN users client ON client.id = member.client_user_id
     LEFT JOIN broker_details broker ON broker.id = member.broker_id
     WHERE audience_group.ra_user_id = $1
     GROUP BY audience_group.id
     ORDER BY audience_group.updated_at DESC, audience_group.name`,
    [raUserId],
  );
  return result.rows;
};

export const listAudienceGroups = async (req: AuthRequest, res: Response) => {
  try { return res.json({ groups: await loadGroups(req.user!.id) }); }
  catch (error) {
    console.error("LIST AUDIENCE GROUPS ERROR", error);
    return res.status(500).json({ message: "Unable to load audience groups." });
  }
};

export const listAudienceConnections = async (req: AuthRequest, res: Response) => {
  try {
    const [clients, brokers] = await Promise.all([
      pool.query(
        `SELECT DISTINCT account.id, COALESCE(NULLIF(TRIM(account.name), ''), account.email, 'Client') AS name,
           account.email
         FROM client_ra_subscriptions subscription JOIN users account ON account.id = subscription.client_user_id
         WHERE subscription.ra_user_id = $1 AND subscription.status = 'ACTIVE'
           AND subscription.expires_at > NOW() AND account.status = 'active'
           AND COALESCE(account.is_active, FALSE) = TRUE ORDER BY name`, [req.user!.id],
      ),
      pool.query(
        `SELECT DISTINCT broker.id,
           COALESCE(NULLIF(TRIM(broker.trade_name), ''), broker.legal_name, 'Broker') AS name,
           broker.sebi_registration_no AS "sebiRegistration"
         FROM broker_research_analysts connection
         JOIN ra_details analyst ON analyst.id = connection.ra_id
         JOIN broker_details broker ON broker.id = connection.broker_id
         JOIN users account ON account.id = broker.user_id
         WHERE analyst.user_id = $1 AND connection.status = 'ACTIVE'
           AND account.status = 'active' AND COALESCE(account.is_active, FALSE) = TRUE
         ORDER BY name`, [req.user!.id],
      ),
    ]);
    return res.json({ clients: clients.rows, brokers: brokers.rows });
  } catch (error) {
    console.error("LIST AUDIENCE CONNECTIONS ERROR", error);
    return res.status(500).json({ message: "Unable to load group connections." });
  }
};

const saveGroup = async (req: AuthRequest, res: Response, groupId?: string) => {
  let input: ReturnType<typeof parseGroup>;
  try { input = parseGroup(req.body || {}); }
  catch (error) { return res.status(400).json({ message: error instanceof Error ? error.message : "Invalid group." }); }
  if (groupId && !uuidPattern.test(groupId)) return res.status(400).json({ message: "Select a valid group." });

  const db = await pool.connect();
  try {
    await db.query("BEGIN");
    const clientIds = input.members.filter(member => member.type === "CLIENT").map(member => member.id);
    const brokerIds = input.members.filter(member => member.type === "BROKER").map(member => member.id);
    const eligible = await db.query(
      `SELECT 'CLIENT' AS type, subscription.client_user_id AS id
       FROM client_ra_subscriptions subscription JOIN users account ON account.id = subscription.client_user_id
       WHERE subscription.ra_user_id = $1 AND subscription.client_user_id = ANY($2::uuid[])
         AND subscription.status = 'ACTIVE' AND subscription.expires_at > NOW()
         AND account.status = 'active' AND COALESCE(account.is_active, FALSE) = TRUE
       UNION ALL
       SELECT 'BROKER' AS type, connection.broker_id AS id
       FROM broker_research_analysts connection JOIN ra_details analyst ON analyst.id = connection.ra_id
       WHERE analyst.user_id = $1 AND connection.broker_id = ANY($3::uuid[]) AND connection.status = 'ACTIVE'`,
      [req.user!.id, clientIds, brokerIds],
    );
    const eligibleKeys = new Set(eligible.rows.map(row => `${row.type}:${row.id}`));
    if (input.members.some(member => !eligibleKeys.has(`${member.type}:${member.id}`))) {
      await db.query("ROLLBACK");
      return res.status(400).json({ message: "A selected member is no longer an active connection." });
    }

    const result = groupId
      ? await db.query(
          `UPDATE ra_audience_groups SET name = $3, description = $4, updated_at = NOW()
           WHERE id = $2 AND ra_user_id = $1 RETURNING id`,
          [req.user!.id, groupId, input.name, input.description],
        )
      : await db.query(
          `INSERT INTO ra_audience_groups (ra_user_id, name, description) VALUES ($1, $2, $3) RETURNING id`,
          [req.user!.id, input.name, input.description],
        );
    if (!result.rows[0]) {
      await db.query("ROLLBACK");
      return res.status(404).json({ message: "Audience group was not found." });
    }
    const id = result.rows[0].id;
    await db.query(`DELETE FROM ra_audience_group_members WHERE group_id = $1`, [id]);
    for (const member of input.members) {
      await db.query(
        `INSERT INTO ra_audience_group_members (group_id, member_type, client_user_id, broker_id)
         VALUES ($1, $2, $3, $4)`,
        [id, member.type, member.type === "CLIENT" ? member.id : null, member.type === "BROKER" ? member.id : null],
      );
    }
    await db.query("COMMIT");
    return res.status(groupId ? 200 : 201).json({ success: true, groupId: id });
  } catch (error: any) {
    await db.query("ROLLBACK").catch(() => undefined);
    if (error?.code === "23505") return res.status(409).json({ message: "A group with this name already exists." });
    console.error("SAVE AUDIENCE GROUP ERROR", error);
    return res.status(500).json({ message: "Unable to save audience group." });
  } finally { db.release(); }
};

export const createAudienceGroup = (req: AuthRequest, res: Response) => saveGroup(req, res);
export const updateAudienceGroup = (req: AuthRequest, res: Response) => saveGroup(req, res, String(req.params.groupId || ""));

export const deleteAudienceGroup = async (req: AuthRequest, res: Response) => {
  const groupId = String(req.params.groupId || "");
  if (!uuidPattern.test(groupId)) return res.status(400).json({ message: "Select a valid group." });
  const result = await pool.query(`DELETE FROM ra_audience_groups WHERE id = $2 AND ra_user_id = $1 RETURNING id`, [req.user!.id, groupId]);
  if (!result.rows[0]) return res.status(404).json({ message: "Audience group was not found." });
  return res.status(204).send();
};
