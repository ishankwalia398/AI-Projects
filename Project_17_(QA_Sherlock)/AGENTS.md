# QA Sherlock Repository Instructions

## `/go` command

When the user sends exactly `/go`, treat it as an explicit request and authorization to commit and push the current QA Sherlock changes to the configured GitHub remote.

1. Inspect the current branch, repository status, and staged diff.
2. Keep `.env`, credentials, API keys, tokens, `.vercel/`, build output, caches, and runtime artifacts out of the commit.
3. Run the checks appropriate to the changed files.
4. Stage only files under `Project_17_(QA_Sherlock)` when this project is inside the `AI-Projects` monorepo.
5. Create a concise commit message describing the actual changes and push the current branch to its normal upstream.
6. Never force-push. If there are no changes, report that the repository is already clean.
7. Report the commit hash, branch, remote, and validation result.
