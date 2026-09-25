# Broker–RA onboarding

Apply `backend/migrations/20260922_broker_ra_onboarding.sql` before deploying the API. The repository migration runner (`npm run migrate --prefix backend`) includes this idempotent migration. It has been applied to the local development database.

- `broker_research_analysts` links `broker_details.id` to `ra_details.id`. Its composite primary key prevents duplicate associations and supports one RA working with multiple brokers. It records association status, onboarding method and timestamps.
- `broker_ra_invitations` stores a SHA-256 token hash, optional recipient email, broker, onboarding method, seven-day expiry and consumption details. Raw tokens are returned only when generating the link.
- Invited registration creates the RA, registration application and association and consumes the token in one database transaction. A row lock prevents concurrent token reuse. The existing payment and administrator approval flow remains required for new RA accounts.
- Existing RA lookup includes approved, active accounts; adding an existing association is idempotent. Broker identity comes from authentication, not request parameters.
- Research Calls joins the broker association to `ra_details.user_id` and then `research_calls.ra_user_id`. It shows latest published/closed calls, including existing history, and excludes drafts. Original calls are not copied or reassigned.

The Add dialog supports opening the registration form, generating/copying or emailing a registration link, and searching for an existing RA. Email delivery needs the existing email configuration and `FRONTEND_URL`; a failed delivery leaves the generated link available for copying and is reported in the UI.

Each associated RA also has a **Remove** action with confirmation. `DELETE /api/broker/research-analysts/:raId` marks only the authenticated broker's association `INACTIVE`. The RA account, registration and calls remain intact, as do other brokers' associations. The removed RA and their calls disappear from this broker's lists. An approved, active RA can be added again through **Add existing RA**, which reactivates the existing association. No additional database migration is required.

Research Calls reuses the RA Performance `RecommendationHistory` component with broker-scoped records, without fetching global history or falling back to sample records. The existing broker dashboard and other mock-backed broker pages are outside this change.

Validation: backend/frontend builds, broker onboarding API/transaction tests, email service tests, desktop/mobile Playwright onboarding checks, and PostgreSQL checks for many-to-many associations and call isolation. PostgreSQL verification records are rolled back.

## Manual database commands for interns

The database engine is **PostgreSQL**, hosted on Oracle Cloud. These are PostgreSQL commands, not Oracle Database SQL. Use the migration for schema changes; do not restore a local database dump over production.

### Apply only this migration on Oracle Cloud

After the latest code has been pulled into `/home/ubuntu/fintree`, run on the server:

```bash
cd /home/ubuntu/fintree
./deploy/scripts/backup.sh
sudo docker compose --project-directory deploy -f deploy/compose.yml exec -T db \
  sh -c 'psql -v ON_ERROR_STOP=1 --single-transaction -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < backend/migrations/20260922_broker_ra_onboarding.sql
```

This runs the exact table/index creation SQL in [20260922_broker_ra_onboarding.sql](../backend/migrations/20260922_broker_ra_onboarding.sql) in one transaction. The migration creates `broker_research_analysts` and `broker_ra_invitations` without changing existing RA, broker or call records. It can be rerun safely. Normal Docker deployment already runs this migration automatically at application startup.

For the local development database, using the existing `backend/.env` connection settings:

```powershell
npm run migrate --prefix backend
```

### Manually associate an existing RA

Prefer **Research Analysts → Add Research Analyst → Add existing RA**. If an administrator specifically needs to perform the association in SQL, first open the database console on the server:

```bash
cd /home/ubuntu/fintree
sudo docker compose --project-directory deploy -f deploy/compose.yml exec db \
  sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Look up the IDs:

```sql
SELECT id AS broker_id, legal_name FROM broker_details ORDER BY legal_name;

SELECT ra.id AS ra_id, concat_ws(' ', ra.first_name, ra.surname) AS ra_name,
       ra.sebi_reg_no
FROM ra_details ra
JOIN users u ON u.id = ra.user_id
WHERE lower(ra.status) = 'approved' AND u.is_active = true
ORDER BY ra.first_name, ra.surname;
```

Replace both placeholders below with the selected UUIDs. Use `broker_details.id` and `ra_details.id`, **not** `users.id`. The query only links an active broker and an approved, active RA. `INSERT 0 0` means one of those IDs is missing or ineligible; do not treat it as success.

```sql
BEGIN;

INSERT INTO broker_research_analysts (broker_id, ra_id, onboarding_method)
SELECT broker.id, ra.id, 'EXISTING'
FROM broker_details broker
JOIN users broker_user ON broker_user.id = broker.user_id
CROSS JOIN ra_details ra
JOIN users ra_user ON ra_user.id = ra.user_id
WHERE broker.id = 'REPLACE_WITH_BROKER_UUID'::uuid
  AND ra.id = 'REPLACE_WITH_RA_UUID'::uuid
  AND broker_user.role = 'BROKER'
  AND broker_user.is_active = true
  AND lower(ra.status) = 'approved'
  AND ra_user.is_active = true
ON CONFLICT (broker_id, ra_id)
DO UPDATE SET status = 'ACTIVE', updated_at = now()
RETURNING broker_id, ra_id, status, onboarding_method;

COMMIT;
```

This associates the existing RA without duplicating their account or calls. Use the registration form for a new RA; manually inserting partial RA records bypasses required registration, payment and approval steps. The application generates invitation tokens securely—interns should not create invitation records by hand.

### Verify the schema and associations

```sql
SELECT to_regclass('public.broker_research_analysts') AS associations_table,
       to_regclass('public.broker_ra_invitations') AS invitations_table;

SELECT broker.legal_name, concat_ws(' ', ra.first_name, ra.surname) AS ra_name,
       link.status, link.onboarding_method, link.created_at
FROM broker_research_analysts link
JOIN broker_details broker ON broker.id = link.broker_id
JOIN ra_details ra ON ra.id = link.ra_id
ORDER BY link.created_at DESC;
```
