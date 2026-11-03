const GITHUB_API = 'https://api.github.com'
export const GITHUB_USER = 'ishankwalia398'
export const PROJECT_REPOSITORY = `${GITHUB_USER}/AI-Projects`
const CONTRIBUTIONS_API = 'https://github-contributions-api.jogruber.de/v4'

const PROJECT_NAME_OVERRIDES = {
  AIJobTracker: 'AI Job Tracker',
  AnswerRelevancyTest: 'Answer Relevancy Test',
  DeepEvalFramework: 'DeepEval Framework',
  JobTracker: 'Job Tracker',
  LinkedInContentGenerator: 'LinkedIn Content Generator',
  'Project_18_CrewAI(LogAnalyzer)': 'Log Analyzer (using CrewAI)',
  'Project_19_Langchain(LogAnalyzer)': 'Log Analyzer (using Langchain)'
}

const EXCLUDED_PROJECTS = new Set([
  'Project_1_(using_Skills)',
  'Skills_Created',
  'Project_3_(AIJobTracker)',
  'Project_4_(JobTracker)',
  'Project_5_(ai-global-career-and-resume-suite)',
  'MyPortfolio'
])

// Creation dates based on project directory creation
const PROJECT_CREATION_DATES = {
  'Project_1_(using_Skills)': '2026-07-14T21:49:21.898Z',
  'Project_2_(n8n_Agents)': '2026-07-14T21:49:21.997Z',
  'Project_3_(AIJobTracker)': '2026-07-14T21:49:22.009Z',
  'Project_4_(JobTracker)': '2026-07-14T21:49:22.226Z',
  'Project_5_(ai-global-career-and-resume-suite)': '2026-07-14T21:49:22.283Z',
  'Project_6_(Postman_To_Playwright)': '2026-07-14T21:49:22.343Z',
  'Project_7_(LinkedInContentGenerator)': '2026-07-14T21:49:22.372Z',
  'Project_8_(LangFlow_Agents)': '2026-07-14T21:49:36.097Z',
  'Project_9_(RAGs)': '2026-07-14T21:49:36.121Z',
  'Project_10_(Porfolio_Builder)': '2026-08-11T16:33:55.942Z',
  'Project_12_(OTT_DRM_AI_Troubleshooting_Copilot)': '2026-08-17T12:13:46.325Z',
  'Project_13_Simple_CrewAI_Agent': '2026-08-31T20:44:01.597Z',
  'Project_14_CrewAI_QA_Pipeline': '2026-09-02T17:24:00.900Z',
  'Project_15_DeepEval(AnswerRelevancy_Test)': '2026-09-05T19:15:01.415Z',
  'Project_16_DeepEvalFramework': '2026-09-10T21:58:39.151Z',
  'Project_17_(QA_Sherlock)': '2026-09-15T21:34:41.578Z',
  'Project_20_Langchain(QABugTriage)': '2026-09-21T16:46:16.892Z',
  'Project_18_CrewAI(LogAnalyzer)': '2026-09-21T17:00:04.858Z',
  'Project_19_Langchain(LogAnalyzer)': '2026-09-21T17:00:19.165Z',
  'Project_21_Career-Assistant': '2026-10-21T18:41:03.954Z',
  'Project_21_Career-Assistant-source': '2026-10-21T18:41:03.954Z'
}

function getProjectCreationDate(entryName) {
  if (PROJECT_CREATION_DATES[entryName]) {
    return new Date(PROJECT_CREATION_DATES[entryName]).getTime()
  }

  // Fallback based on project number if a new project directory is added
  const numMatch = entryName.match(/^Project_(\d+)/)
  if (numMatch) {
    return parseInt(numMatch[1], 10) * 1000000000
  }

  return 0
}

function formatProjectName(rawName, fullName) {
  if (fullName && PROJECT_NAME_OVERRIDES[fullName]) {
    return PROJECT_NAME_OVERRIDES[fullName]
  }

  if (PROJECT_NAME_OVERRIDES[rawName]) {
    return PROJECT_NAME_OVERRIDES[rawName]
  }

  const normalizedName = rawName
    .replace(/^Project_\d+_?/, '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()

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
    .filter(entry => entry.type === 'dir' && !EXCLUDED_PROJECTS.has(entry.name) && !/my[_-]?portfolio/i.test(entry.name))
    .map(entry => {
      const match = entry.name.match(/\(([^)]+)\)/)
      const rawName = match ? match[1] : entry.name
      const name = formatProjectName(rawName, entry.name)

      return {
        name,
        path: entry.path,
        url: `https://github.com/${PROJECT_REPOSITORY}/tree/main/${entry.path}`,
        description: `Explore the ${name} project and its implementation on GitHub.`,
        createdAt: getProjectCreationDate(entry.name)
      }
    })
    .sort((first, second) => first.createdAt - second.createdAt)
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
