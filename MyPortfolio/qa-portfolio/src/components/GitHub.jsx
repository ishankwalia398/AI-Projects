import { useEffect, useMemo, useState } from 'react'
import { FaGithub } from 'react-icons/fa'
import { fetchContributionGraph } from '../github'
import { LANGUAGES } from '../data/projects'
import { GITHUB_URL, GITHUB_USER } from '../profile'
import './GitHub.css'

// Keyed by language rather than by rank. GitHub's colours, except Python, whose
// official blue is too close to TypeScript's to tell apart in one bar.
const LANGUAGE_COLORS = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3e9c5a',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Java: '#b07219',
  Dockerfile: '#384d54'
}

function GitHub() {
  // Only the current year is shown.
  const selectedYear = new Date().getFullYear()
  const [contributionData, setContributionData] = useState(null)
  const [contributionError, setContributionError] = useState('')

  useEffect(() => {
    fetchContributionGraph(selectedYear).then(setContributionData).catch(() => {
      setContributionError('Contribution data is temporarily unavailable.')
    })
  }, [selectedYear])

  const contributionCells = useMemo(() => {
    const contributions = contributionData?.contributions || []
    const byDate = new Map(contributions.map(contribution => {
      const count = Number(contribution.count) || 0
      const level = Number.isFinite(Number(contribution.level))
        ? Number(contribution.level)
        : count === 0 ? 0 : count < 2 ? 1 : count < 5 ? 2 : count < 10 ? 3 : 4

      return [String(contribution.date).slice(0, 10), { ...contribution, count, level }]
    }))
    const currentDate = new Date()
    const isCurrentYear = selectedYear === currentDate.getUTCFullYear()
    const currentDateKey = currentDate.toISOString().slice(0, 10)
    const yearStart = new Date(Date.UTC(selectedYear, 0, 1))
    const yearEnd = new Date(Date.UTC(selectedYear, 11, 31))
    const gridStart = new Date(yearStart)
    gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay())
    const gridEnd = new Date(yearEnd)
    gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - gridEnd.getUTCDay()))
    const weeks = []

    for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor.setUTCDate(cursor.getUTCDate() + 7)) {
      const week = []
      for (let day = 0; day < 7; day += 1) {
        const date = new Date(cursor)
        date.setUTCDate(date.getUTCDate() + day)
        const dateKey = date.toISOString().slice(0, 10)
        const contribution = byDate.get(dateKey) || { date: dateKey, count: 0, level: 0 }
        week.push({
          ...contribution,
          isFuture: isCurrentYear && dateKey > currentDateKey && contribution.count === 0
        })
      }
      weeks.push(week)
    }

    const months = []
    for (let month = 0; month < 12; month += 1) {
      const firstDay = new Date(Date.UTC(selectedYear, month, 1))
      const weekIndex = Math.floor((firstDay - gridStart) / (7 * 24 * 60 * 60 * 1000))
      months.push({ label: firstDay.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }), weekIndex })
    }

    return { weeks, months }
  }, [contributionData, selectedYear])
  const contributionTotal = contributionData?.contributions?.reduce((total, contribution) => total + contribution.count, 0) || 0

  return (
    <section className="github-section" id="github">
      <h2>GitHub Activity</h2>
      <p className="section-lead">
        <FaGithub className="github-icon" aria-hidden="true" /> Follow my work on{' '}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">@{GITHUB_USER}</a>
      </p>

      <div className="github-card">
        <div className="contribution-heading">
          <h3>{contributionData ? `${contributionTotal} contributions in ${selectedYear}` : `Contributions in ${selectedYear}`}</h3>
        </div>
        {contributionError ? <p className="github-status">{contributionError}</p> : (
          <div className="calendar-container">
            <div className="calendar-layout">
              <div className="calendar-weekdays"><span>Mon</span><span>Wed</span><span>Fri</span></div>
              <div className="calendar-main">
                <div className="calendar-months">
                  {contributionCells.months.map(month => <span key={month.label} style={{ gridColumn: month.weekIndex + 1 }}>{month.label}</span>)}
                </div>
                <div className="calendar-grid">
                  {contributionCells.weeks.map((week, index) => (
                    <div className="calendar-week" key={index}>
                      {week.map(contribution => <span key={contribution.date} className={`contribution-cell level-${contribution.level}${contribution.isFuture ? ' future' : ''}`} title={contribution.isFuture ? '' : `${contribution.count} contributions on ${contribution.date}`} />)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="contribution-legend"><span>Less</span><i className="level-0" /><i className="level-1" /><i className="level-2" /><i className="level-3" /><i className="level-4" /><span>More</span></div>
          </div>
        )}

        {LANGUAGES.length > 0 && (
          <div className="languages">
            <h3>Languages across public repositories</h3>
            <div className="language-bar" aria-hidden="true">
              {LANGUAGES.map(language => (
                <span key={language.name} style={{ width: `${language.percent}%`, background: LANGUAGE_COLORS[language.name] || 'var(--accent-primary)' }} />
              ))}
            </div>
            <ul className="language-legend">
              {LANGUAGES.map(language => (
                <li key={language.name}>
                  <i style={{ background: LANGUAGE_COLORS[language.name] || 'var(--accent-primary)' }} />
                  {language.name} <span>{language.percent}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="github-cta">
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="github-profile-button"><FaGithub aria-hidden="true" /> Visit GitHub Profile</a>
      </div>
    </section>
  )
}

export default GitHub
