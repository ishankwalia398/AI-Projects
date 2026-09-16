const GITHUB_API = 'https://api.github.com'
export const GITHUB_USER = 'ishankwalia398'
export const PROJECT_REPOSITORY = `${GITHUB_USER}/AI-Projects`
const CONTRIBUTIONS_API = 'https://github-contributions-api.jogruber.de/v4'

const PROJECT_NAME_OVERRIDES = {
  AIJobTracker: 'AI Job Tracker',
  AnswerRelevancyTest: 'Answer Relevancy Test',
  DeepEvalFramework: 'DeepEval Framework',
  JobTracker: 'Job Tracker',
  LinkedInContentGenerator: 'LinkedIn Content Generator'
}

function formatProjectName(rawName) {
  const normalizedName = rawName
    .replace(/^Project_\d+_?/, '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()

  if (PROJECT_NAME_OVERRIDES[rawName]) {
    return PROJECT_NAME_OVERRIDES[rawName]
  }

  return normalizedName
    .split(' ')
    .map(word => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(' ')
}

async function githubFetch(path) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: { Accept: 'application/vnd.github+json' }
  })

  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status}`)
  }

  return response.json()
}

export async function fetchContributionGraph(year) {
  const cacheKey = Date.now()
  const response = await fetch(`${CONTRIBUTIONS_API}/${GITHUB_USER}?y=${year}&cb=${cacheKey}`, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache'
    }
  })

  if (!response.ok) {
    throw new Error(`Contribution request failed: ${response.status}`)
  }

  return response.json()
}

export async function fetchAiProjects() {
  const entries = await githubFetch(`/repos/${PROJECT_REPOSITORY}/contents`)

  return entries
    .filter(entry => entry.type === 'dir' && entry.name !== 'Project_1_(using_Skills)' && entry.name !== 'Skills_Created' && !/my[_-]?portfolio/i.test(entry.name))
    .map(entry => {
      const match = entry.name.match(/\(([^)]+)\)/)
      const name = formatProjectName(match ? match[1] : entry.name)

      return {
        name,
        path: entry.path,
        url: `https://github.com/${PROJECT_REPOSITORY}/tree/main/${entry.path}`,
        description: `Explore the ${name} project and its implementation on GitHub.`
      }
    })
    .sort((first, second) => first.name.localeCompare(second.name))
}

export async function fetchGithubSnapshot() {
  const [profile, repositories, events] = await Promise.all([
    githubFetch(`/users/${GITHUB_USER}`),
    githubFetch(`/users/${GITHUB_USER}/repos?per_page=100&sort=updated`),
    githubFetch(`/users/${GITHUB_USER}/events/public?per_page=100`)
  ])

  const languageTotals = {}
  await Promise.all(repositories.slice(0, 30).map(async repository => {
    try {
      const languages = await githubFetch(`/repos/${GITHUB_USER}/${repository.name}/languages`)
      Object.entries(languages).forEach(([language, bytes]) => {
        languageTotals[language] = (languageTotals[language] || 0) + bytes
      })
    } catch {
      // A single inaccessible repository should not prevent the dashboard rendering.
    }
  }))

  const technologies = Object.entries(languageTotals)
    .sort(([, firstBytes], [, secondBytes]) => secondBytes - firstBytes)
    .slice(0, 5)
    .map(([name, bytes], index, languages) => ({
      name,
      percent: Math.max(1, Math.round((bytes / languages.reduce((total, [, value]) => total + value, 0)) * 100)),
      color: ['#f1e05a', '#3178c6', '#3572A5', '#e34c26', '#563d7c'][index]
    }))

  const activeDays = [...new Set(events.map(event => event.created_at.slice(0, 10)))]
  let currentStreak = 0
  let cursor = new Date()
  while (activeDays.includes(cursor.toISOString().slice(0, 10))) {
    currentStreak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return {
    profile,
    repositories,
    events,
    technologies,
    currentStreak,
    recentActivity: events.slice(0, 4)
  }
}
