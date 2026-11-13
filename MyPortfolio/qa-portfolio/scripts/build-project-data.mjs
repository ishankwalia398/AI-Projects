// Builds src/data/generated.json before `vite build` / `vite dev`.
//
// The project list comes from the AI-Projects repository this site lives in, and
// language stats come from the GitHub API once per build. Visitors therefore never
// call the GitHub API, so its 60-requests-per-hour anonymous limit cannot break the
// page. If either source is unavailable, the previously committed values are kept.
import { execFileSync } from 'node:child_process'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const GITHUB_USER = 'ishankwalia398'
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(appRoot, '..', '..')
const outFile = path.join(appRoot, 'src', 'data', 'generated.json')
const isProjectFolder = name => /^Project_\d+/.test(name)

async function readPrevious() {
  try {
    return JSON.parse(await readFile(outFile, 'utf8'))
  } catch {
    return { projectFolders: [], languages: [] }
  }
}

async function listProjectFolders() {
  try {
    // Committed folders only, so every listed project exists on GitHub.
    const output = execFileSync('git', ['ls-tree', '-d', '--name-only', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' })
    const folders = output.split('\n').map(line => line.trim()).filter(isProjectFolder)
    if (folders.length) return folders
  } catch { /* git unavailable: fall back to the file system. */ }

  try {
    const entries = await readdir(repoRoot, { withFileTypes: true })
    const folders = entries.filter(entry => entry.isDirectory() && isProjectFolder(entry.name)).map(entry => entry.name)
    if (folders.length) return folders
  } catch { /* Repository root not available in this build environment. */ }

  return null
}

async function github(pathname) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'portfolio-build' }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const response = await fetch(`https://api.github.com${pathname}`, { headers, signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error(`GitHub ${pathname} returned ${response.status}`)
  return response.json()
}

async function fetchLanguages() {
  try {
    const repositories = await github(`/users/${GITHUB_USER}/repos?per_page=100`)
    const totals = {}
    for (const repository of repositories.filter(repository => !repository.fork)) {
      const languages = await github(`/repos/${GITHUB_USER}/${repository.name}/languages`)
      for (const [language, bytes] of Object.entries(languages)) totals[language] = (totals[language] || 0) + bytes
    }
    const ranked = Object.entries(totals).sort(([, a], [, b]) => b - a).slice(0, 6)
    const total = ranked.reduce((sum, [, bytes]) => sum + bytes, 0)
    return total ? ranked.map(([name, bytes]) => ({ name, percent: Math.max(1, Math.round((bytes / total) * 100)) })) : null
  } catch (error) {
    console.warn(`[project-data] Keeping previous language stats: ${error.message}`)
    return null
  }
}

const previous = await readPrevious()
const projectFolders = await listProjectFolders()
if (!projectFolders) console.warn('[project-data] Repository folders not found; keeping previous project list.')
const languages = await fetchLanguages()

const next = {
  projectFolders: projectFolders || previous.projectFolders,
  languages: languages || previous.languages
}

const serialized = `${JSON.stringify(next, null, 2)}\n`
if (serialized !== `${JSON.stringify(previous, null, 2)}\n`) {
  await writeFile(outFile, serialized)
  console.log(`[project-data] Updated ${path.relative(appRoot, outFile)}`)
} else {
  console.log('[project-data] Data unchanged')
}
