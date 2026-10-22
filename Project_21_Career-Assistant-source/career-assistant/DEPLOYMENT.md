# Free-tier trial deployment

The Vercel site is the frontend. This optional free-tier setup runs FastAPI and
the queue worker together in one Render free web service, uses Render free
PostgreSQL, and stores uploads in Cloudflare R2's included Standard storage
allowance. The Vercel `/api/*` function forwards requests to FastAPI using the
server-only `CAREER_API_URL` environment variable.

This is for a trial, not a reliable production service. Render may sleep the
web service after 15 minutes without inbound traffic; waking it can take about
a minute. The free PostgreSQL database is limited to 1 GB, expires after 30
days, has no backups, and may be restarted or temporarily unavailable. Export
your data and migrate it before the expiry date. Free service plans, quotas,
and terms can change; review the provider dashboards before setup.

## 1. Create a Cloudflare R2 bucket

R2 is S3-compatible and currently includes 10 GB-month of Standard storage, 1
million Class A requests, and 10 million Class B requests per month. Usage above
the free allowance may be billed. Create a private bucket, then create an R2
API token with read/write access only to that bucket. Keep the token secret.

You will need the bucket name, the account's S3 API endpoint
(`https://<account-id>.r2.cloudflarestorage.com`), the access key ID, and the
secret access key. R2 uses `auto` as its region. Do not use a public bucket.

## 2. Create Render services from the Blueprint

The repository Blueprint is
`Project_21_Career-Assistant-source/career-assistant/render.yaml`. In Render,
create a Blueprint from `ishankwalia398/AI-Projects`, branch `main`, and use
that file path. Review the resources and ensure the web service and database
both show **Free** before confirming. This Blueprint creates a free PostgreSQL
database and one free Docker web service; it does not create a separate worker.
The worker runs in a managed thread inside the API process so queued workflows
are still handled without a paid worker service.

During Blueprint setup, enter the R2 values when prompted:

| Name | Value |
| --- | --- |
| `S3_BUCKET` | Your private R2 bucket name |
| `S3_ENDPOINT_URL` | `https://<account-id>.r2.cloudflarestorage.com` |
| `AWS_ACCESS_KEY_ID` | R2 token access key ID |
| `AWS_SECRET_ACCESS_KEY` | R2 token secret access key |

The Blueprint sets production mode, secure cookies, PostgreSQL, the frontend
origin, and `INLINE_WORKER=true`. Production startup refuses to run without the
private object store because Render's local filesystem is ephemeral. The API
initializes the schema automatically. Wait until the service is live and its
health check returns `{"status":"ok","service":"Career Assistant"}`.

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
Add AI, SMTP and Qdrant settings only to Render when those integrations are
ready.

## 4. What stays limited on free services

- Render's free web service sleeps after 15 minutes without inbound traffic;
  task processing pauses while it is asleep. The next request may wait about a
  minute for startup.
- The free Render database expires after 30 days. There are no automatic
  backups. Plan an export/migration before expiry; database expiry can make
  accounts and app records unavailable.
- R2's free usage has monthly quotas. Set billing alerts and monitor usage;
  above-quota usage can incur charges.
- AI generation requires a separately configured provider key and may incur
  API charges. Qdrant is optional; without it the app uses lexical retrieval.
- Password-reset email requires an SMTP provider; without it, email reset is
  unavailable. Render blocks outbound SMTP ports 25, 465 and 587 on Free web
  services, so the current SMTP adapter cannot deliver reset email from this
  free deployment. Registration and login do not require AI or SMTP.
- Keep `CAREER_API_URL` as an origin only, without `/api`. Vercel variables are
  server-side except `VITE_*`, which are exposed in the browser bundle.
- Keep `FRONTEND_URL` exactly aligned with the browser origin; the API enforces
  it for state-changing requests.
- After connecting Vercel, test health, registration, login, resume upload,
  task processing, logout, and file download.
