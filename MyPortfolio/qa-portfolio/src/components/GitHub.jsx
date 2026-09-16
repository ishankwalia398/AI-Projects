import { useEffect, useMemo, useState } from 'react'
import { FaGithub } from 'react-icons/fa'
import { fetchContributionGraph, fetchGithubSnapshot, GITHUB_USER } from '../github'
import './GitHub.css'

function GitHub() {
  const [snapshot, setSnapshot] = useState(null)
  const [error, setError] = useState('')
  const [contributionData, setContributionData] = useState(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [contributionError, setContributionError] = useState('')

  useEffect(() => {
    fetchGithubSnapshot().then(setSnapshot).catch(() => {
      setError('Live GitHub data is temporarily unavailable. Visit the profile for the latest activity.')
    })
  }, [])

  useEffect(() => {
    fetchContributionGraph(selectedYear).then(setContributionData).catch(() => {
      setContributionError('Contribution data is temporarily unavailable.')
    })
  }, [selectedYear])

  const profile = snapshot?.profile
  const technologies = snapshot?.technologies || []
  const totalRecentEvents = snapshot?.events?.length || 0
  const availableYears = contributionData?.years?.map(year => year.year) || [new Date().getFullYear(), new Date().getFullYear() - 1]
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
    <section className="github-section">
      <h2>GitHub Activity & Contributions</h2>
      <div className="github-intro">
        <p>
          <FaGithub className="github-icon" />
          Follow my coding journey on <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noopener noreferrer">@{GITHUB_USER}</a>
        </p>
      </div>

      <div className="github-content">
        {error && <p className="github-status">{error}</p>}
        {!snapshot && !error && <p className="github-status">Loading live GitHub activity...</p>}
        <div className="github-stats-grid">
          <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noopener noreferrer" className="stat-card-uniform">
            <div className="github-stat-manual">
              <h3>GitHub Activity</h3>
              <div className="stat-grid">
                <div className="stat-item"><span className="stat-number">{profile?.public_repos ?? '—'}</span><span className="stat-label">Public Repos</span></div>
                <div className="stat-item"><span className="stat-number">{totalRecentEvents || '—'}</span><span className="stat-label">Recent Events</span></div>
                <div className="stat-item"><span className="stat-number">{technologies.length || '—'}</span><span className="stat-label">Top Languages</span></div>
              </div>
              <p className="view-github">→ View Full Profile</p>
            </div>
          </a>

          <div className="stat-card-uniform">
            <div className="github-stat-manual">
              <h3>Top Technologies</h3>
              <div className="tech-list">
                {technologies.length ? technologies.map(technology => (
                  <div className="tech-bar" key={technology.name}>
                    <div className="tech-info"><span className="tech-name">{technology.name}</span><span className="tech-percent">{technology.percent}%</span></div>
                    <div className="tech-progress"><div className="tech-fill" style={{ width: `${technology.percent}%`, background: technology.color }}></div></div>
                  </div>
                )) : <p className="github-status">Language data is loading...</p>}
              </div>
              <a href={`https://github.com/${GITHUB_USER}?tab=repositories`} target="_blank" rel="noopener noreferrer" className="view-github">→ View Repositories</a>
            </div>
          </div>

          <div className="stat-card-uniform contribution-card">
            <div className="github-stat-manual">
              <div className="contribution-heading">
                <h3>{contributionTotal} contributions in {selectedYear}</h3>
                <div className="contribution-years">
                  {availableYears.map(year => (
                    <button type="button" key={year} className={year === selectedYear ? 'selected' : ''} onClick={() => setSelectedYear(year)}>{year}</button>
                  ))}
                </div>
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
            </div>
          </div>
        </div>

        <div className="github-cta">
          <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noopener noreferrer" className="github-profile-button"><FaGithub /> Visit Full GitHub Profile</a>
        </div>
      </div>
    </section>
  )
}

export default GitHub
