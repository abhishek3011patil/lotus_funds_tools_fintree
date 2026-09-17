# Recommendation attachments

Recommendations accept up to 10 files, each up to 5 MB: JPG/JPEG, PNG, WEBP,
GIF, PDF, DOC/DOCX, XLS/XLSX, CSV, TXT and PPT/PPTX. The picker can add files
over multiple selections and remove individual files before submission.

Apply the additive database migration before running the updated backend:

```powershell
npm run migrate --prefix backend
```

The migrations are safe to rerun. They add missing Aadhaar registration columns
and `research_calls.attachments` (JSONB),
with the original filename, public upload path, MIME type and size for every
file. Existing `file_url` values are retained and used as a fallback. New
records also populate `file_url` with the first file for older clients.
Corrections inherit the complete attachment list. Exiting or publishing a
draft updates the same row, retaining its attachments.

The multipart create-call endpoint accepts repeated `files` fields, as well
as the legacy single `file` field. Both share the 10-file total limit.
Uploaded files stay in `backend/uploads`; rejected multipart uploads and
uploads rejected before the recommendation is saved are removed.

The Performance table lists the attachment count. Its viewer shows every
image and an individual open/download link for each attachment. Documents
open using the browser or the user's installed application.

The Docker image runs the migrations before starting the backend, using the
configured database environment. Migration failures stop startup. Take a
database and uploads backup before deploying, as described in OPERATIONS.md.
To apply the migrations separately before replacing the running application:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yml build app
docker compose --env-file deploy/.env -f deploy/compose.yml run --rm app npm run migrate
```
