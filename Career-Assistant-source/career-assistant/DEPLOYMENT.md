# Production deployment

The Vercel site is the frontend. FastAPI, PostgreSQL and the background worker
must run separately. The Vercel `/api/*` function forwards requests to the
backend using the server-only `CAREER_API_URL` environment variable.

## 1. Deploy PostgreSQL, FastAPI, and the worker

The repository includes a Render Blueprint at
`Career-Assistant-source/career-assistant/render.yaml`. In Render, create a new
Blueprint instance from the GitHub repository and select that Blueprint file.
Review the resources and prices before confirming. The Blueprint provisions a
managed PostgreSQL database, a Docker web service, and a background worker in
the same region. Its database and service plans are paid tiers; do not downgrade
PostgreSQL to an ephemeral free database for production data.

If configuring services manually instead, use these settings:

- Root directory: `Career-Assistant-source/career-assistant/backend`
- Dockerfile: `Dockerfile`
- Health check path: `/api/health`
- Region: the same region as the database

Set these environment variables on both API and worker services (the Blueprint
sets them for you):

| Name | Value |
| --- | --- |
| `APP_ENV` | `production` |
| `DATABASE_URL` | The database's internal connection URL. `postgresql://` and `postgres://` URLs are supported. |
| `FRONTEND_URL` | `https://jobsearchandtracker.vercel.app` |
| `COOKIE_SECURE` | `true` |
| `SESSION_HOURS` | `24` |
| `STORAGE_DIR` | `/app/data/files` |

The service runs schema initialization when it starts. Confirm the health check
returns `{"status":"ok","service":"Career Assistant"}`.

## 2. Configure persistent file storage before enabling uploads

The API container and worker do not share local disk, and container filesystems
are ephemeral. Configure a private S3-compatible bucket on both services before
using resume uploads or attachments:

For AWS S3, create a private bucket and a least-privilege service identity. For
Cloudflare R2, create a private bucket and an R2 token with object read/write
permissions. Add the following environment variables to both Render services:

- `S3_BUCKET`: bucket name
- `S3_ENDPOINT_URL`: omit for AWS S3; for R2, use the account's S3 endpoint
- `AWS_ACCESS_KEY_ID`: access key from the chosen storage provider
- `AWS_SECRET_ACCESS_KEY`: secret key from the chosen storage provider
- `AWS_DEFAULT_REGION`: provider region (R2 uses `auto`)

Keep the bucket private and grant the service account only the required
read/write/delete permissions. Do not put these credentials in GitHub or
Vercel. Qdrant is optional for initial account registration; without it, resume
search uses the app's labelled lexical mode.

## 3. Connect Vercel to the backend

In the Vercel project settings, add the following environment variables for
Production:

| Name | Value |
| --- | --- |
| `CAREER_API_URL` | The backend's HTTPS origin, for example `https://career-assistant-api.onrender.com` (no `/api` suffix). |
| `VITE_BACKEND_CONFIGURED` | `true` |

Redeploy the Vercel project after saving these settings. The Vercel API function
forwards the browser's session cookie, CSRF token, and origin to FastAPI, so the
browser continues to call the same-origin `/api/*` path.

To check the connection, open
`https://jobsearchandtracker.vercel.app/api/health`. It should return the
FastAPI health JSON, not a Vercel 404 or the configuration 503. Then register a
test account and log in.

Do not put database URLs, AI provider keys, storage credentials, or API secrets
in `VITE_*` variables; those are included in browser-visible frontend bundles.
Add AI, SMTP and Qdrant settings only to the backend and worker environments
when those integrations are ready.

## 4. Important operational notes

- Use paid, persistent PostgreSQL and service plans for a production workload;
  free tiers may sleep or have ephemeral/limited storage.
- Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` and
  `MAIL_FROM` on the backend and worker before relying on password reset email.
- Keep `FRONTEND_URL` exactly aligned with the browser origin; the API enforces
  it for state-changing requests.
- Monitor the API and worker logs after deploy. Run registration, login, logout,
  password-reset, upload, and worker-processing smoke tests before inviting
  users.
