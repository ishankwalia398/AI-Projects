// Prints profile/profile.html to PDF with headless Chrome (or Edge) and copies it
// to MyPortfolio/ and the portfolio's public/ folder.
//   node profile/build-profile.mjs
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const portfolioRoot = path.resolve(here, '..')
const source = path.join(here, 'profile.html')
const output = path.join(portfolioRoot, 'Ishank_Walia_Profile.pdf')
const publicCopy = path.join(portfolioRoot, 'qa-portfolio', 'public', 'Ishank_Walia_Profile.pdf')

const browsers = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome'
].filter(Boolean)
const browser = browsers.find(candidate => existsSync(candidate))
if (!browser) throw new Error('Chrome or Edge not found; set CHROME_PATH.')

// A throwaway profile so this works while the normal browser is open.
const profile = mkdtempSync(path.join(tmpdir(), 'profile-chrome-'))
try {
  execFileSync(browser, [
    '--headless=new',
    '--disable-gpu',
    `--user-data-dir=${profile}`,
    '--no-pdf-header-footer',
    `--print-to-pdf=${output}`,
    pathToFileURL(source).href
  ], { stdio: 'inherit' })
} finally {
  rmSync(profile, { recursive: true, force: true })
}

copyFileSync(output, publicCopy)
console.log(`Wrote ${path.relative(process.cwd(), output)} and ${path.relative(process.cwd(), publicCopy)}`)
