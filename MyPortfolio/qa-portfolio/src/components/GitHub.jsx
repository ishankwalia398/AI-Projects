import { FaGithub, FaStar, FaCodeBranch } from 'react-icons/fa'
import './GitHub.css'

function GitHub() {
  return (
    <section className="github-section">
      <h2>GitHub Activity & Contributions</h2>

      <div className="github-intro">
        <p>
          <FaGithub className="github-icon" />
          Follow my coding journey on <a href="https://github.com/ishankwalia398" target="_blank" rel="noopener noreferrer">
            @ishankwalia398
          </a>
        </p>
      </div>

      <div className="github-content">
        <div className="github-calendar-wrapper">
          <h3>Daily Coding Activity</h3>
          <div className="calendar-container">
            <img
              src="https://ghchart.rshah.org/00d9ff/ishankwalia398"
              alt="GitHub Contribution Calendar"
              className="github-calendar"
            />
          </div>
        </div>

        <div className="github-stats-grid">
          <a href="https://github.com/ishankwalia398" target="_blank" rel="noopener noreferrer" className="stat-card-uniform">
            <div className="github-stat-manual">
              <h3>GitHub Activity</h3>
              <div className="stat-grid">
                <div className="stat-item">
                  <span className="stat-number">3</span>
                  <span className="stat-label">Public Repos</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">30+</span>
                  <span className="stat-label">AI Projects</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">3</span>
                  <span className="stat-label">Languages</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">Active</span>
                  <span className="stat-label">Contributor</span>
                </div>
              </div>
              <p className="view-github">→ View Full Profile</p>
            </div>
          </a>
          <a href="https://github.com/ishankwalia398?tab=repositories" target="_blank" rel="noopener noreferrer" className="stat-card-uniform">
            <div className="github-stat-manual">
              <h3>Top Technologies</h3>
              <div className="tech-list">
                <div className="tech-bar">
                  <div className="tech-info">
                    <span className="tech-name">TypeScript</span>
                    <span className="tech-percent">35%</span>
                  </div>
                  <div className="tech-progress">
                    <div className="tech-fill" style={{width: '35%', background: '#3178c6'}}></div>
                  </div>
                </div>
                <div className="tech-bar">
                  <div className="tech-info">
                    <span className="tech-name">JavaScript</span>
                    <span className="tech-percent">35%</span>
                  </div>
                  <div className="tech-progress">
                    <div className="tech-fill" style={{width: '35%', background: '#f1e05a'}}></div>
                  </div>
                </div>
                <div className="tech-bar">
                  <div className="tech-info">
                    <span className="tech-name">Python</span>
                    <span className="tech-percent">30%</span>
                  </div>
                  <div className="tech-progress">
                    <div className="tech-fill" style={{width: '30%', background: '#3572A5'}}></div>
                  </div>
                </div>
              </div>
              <p className="view-github">→ View Repositories</p>
            </div>
          </a>
          <a href="https://github.com/ishankwalia398?tab=overview" target="_blank" rel="noopener noreferrer" className="stat-card-uniform">
            <div className="github-stat-manual">
              <h3>Contribution Streak 🔥</h3>
              <div className="streak-display">
                <div className="streak-item">
                  <span className="streak-number">85+</span>
                  <span className="streak-label">Total Contributions</span>
                </div>
                <div className="streak-divider"></div>
                <div className="streak-item">
                  <span className="streak-number">2024</span>
                  <span className="streak-label">Active Since</span>
                </div>
              </div>
              <p className="view-github">→ View Contribution Graph</p>
            </div>
          </a>

          <a
            href="https://github.com/ishankwalia398/AI-Projects"
            target="_blank"
            rel="noopener noreferrer"
            className="stat-card-uniform repo-card-featured"
          >
            <div className="github-stat-manual">
              <h3>Featured Repositories</h3>
              <div className="repo-content">
                <div className="repo-header">
                  <FaCodeBranch className="repo-icon" />
                  <h4>AI-Projects</h4>
                </div>
                <p className="repo-desc">Collection of AI agents, RAG applications, and intelligent QA automation tools built with n8n, Langflow, and Playwright</p>
                <div className="repo-tags">
                  <span>AI</span>
                  <span>QA</span>
                  <span>Automation</span>
                  <span>RAG</span>
                </div>
              </div>
              <p className="view-github">→ View Repository</p>
            </div>
          </a>
        </div>

        <div className="github-cta">
          <a
            href="https://github.com/ishankwalia398"
            target="_blank"
            rel="noopener noreferrer"
            className="github-profile-button"
          >
            <FaGithub /> Visit Full GitHub Profile
          </a>
        </div>
      </div>
    </section>
  )
}

export default GitHub
