import { GITHUB_USER } from './profile'

// Third-party contributions API (not api.github.com), so it does not share
// GitHub's anonymous rate limit. Project and language data are built at deploy
// time instead; see scripts/build-project-data.mjs.
const CONTRIBUTIONS_API = 'https://github-contributions-api.jogruber.de/v4'

export async function fetchContributionGraph(year) {
  const response = await fetch(`${CONTRIBUTIONS_API}/${GITHUB_USER}?y=${year}&cb=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })

  if (!response.ok) {
    throw new Error(`Contribution request failed: ${response.status}`)
  }

  return response.json()
}
