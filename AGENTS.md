# AI Projects Repository Instructions

## `/go` command

When the user sends exactly `/go`, treat it as an explicit request and authorization to validate, commit, and push the intentional changes in this repository to its configured GitHub remote.

1. Inspect the repository root, current branch, upstream, working-tree status, staged changes, and diffs before committing.
2. Identify the affected projects and run the checks appropriate to their changed files.
3. Keep `.env` files, credentials, API keys, tokens, local deployment metadata, build output, virtual environments, caches, and runtime artifacts out of the commit.
4. Stage only reviewed, intentional changes. Do not include unrelated untracked files from other projects merely because they exist in the monorepo.
5. Scan the staged content for secret-shaped values and resolve any suspicious result before committing.
6. Create a concise commit message that describes the actual staged changes, then push the current branch to its normal upstream.
7. Never force-push or perform destructive cleanup. If a normal push is rejected, report the reason and preserve the local commit.
8. If there are no intentional changes, report that the repository is already clean.
9. Report the validation results, commit hash, branch, and remote push result.
