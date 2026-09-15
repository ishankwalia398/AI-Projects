# Later Vercel deployment

The included Vercel configuration deploys the real-data upload interface and keeps the saved demonstration at `/demo/`. Import the repository root in Vercel; the build runs `npm run build`, output `dist`. No secrets, Python dependencies or live investigation worker are bundled. Deployment is deferred until requested.

For the live product, use Vercel for an authenticated UI and lightweight API, plus a separately hosted Python worker:

1. Authenticated API accepts a Playwright report, enforces size/tenant limits, stores it and queues a job.
2. Worker invokes the existing live pipeline with tenant-scoped Pinecone and Jira settings.
3. Worker stores report JSON and generated artifacts in private object storage.
4. UI polls an authorized job-status endpoint and renders completed results.

Set `QA_SHERLOCK_API_URL` in the Vercel build environment to the public HTTPS URL of that authenticated worker API. On the worker, set `QA_SHERLOCK_UI_ORIGIN` to the exact Vercel site origin so cross-origin browser requests are allowed. The local UI leaves the API URL empty and uses the same origin.

The queue, authentication, status API and worker hosting are architectural next steps, not included services. Keeping six-agent execution outside request handlers avoids relying on function duration limits. Check current Vercel plan limits when implementing deployment.

Provide the Vercel deployment token through the deployment environment later. LLM, Pinecone and Jira secrets belong to worker secret storage; never use public frontend variable prefixes. The static demo needs none of these credentials. Do not upload real investigation reports to a public static deployment.
