import { FaGithub, FaLinkedin, FaEnvelope, FaFileDownload } from 'react-icons/fa'
import { EMAIL, GITHUB_URL, LINKEDIN_URL, PROFILE_PDF_NAME, PROFILE_URL } from '../profile'
import './Hero.css'

const STATS = [
  { value: '30%', label: 'Higher DRM playback success', source: 'Kaltura' },
  { value: '73%', label: 'Faster regression runs', source: 'Kaltura' },
  { value: '60%', label: 'Less production defect leakage', source: 'GlobalLogic' }
]

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero-content">
        <div className="hero-text">
          <p className="hero-badge">
            <span className="status-dot" aria-hidden="true"></span>
            Open to GenAI roles · EU / US / APAC / Remote
          </p>
          <h1 className="hero-title">
            <span className="gradient-text">Ishank Walia</span>
          </h1>
          <p className="hero-subtitle">
            <span>Quality Engineering Lead</span><span className="subtitle-sep" aria-hidden="true"> · </span><span>AI-Augmented Testing</span>
          </p>
          <p className="hero-description">
            15+ years in quality engineering, the last 8+ making streaming platforms bulletproof. Specialized in DRM
            validation (Widevine, FairPlay, PlayReady) and OTT/TV quality, and now building AI agents, RAG pipelines and
            automation frameworks that catch what humans miss.
          </p>
          <div className="hero-stats">
            {STATS.map(stat => (
              <div className="stat" key={stat.label}>
                <span className="stat-number">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
                <span className="stat-source">{stat.source}</span>
              </div>
            ))}
          </div>
          <div className="hero-links">
            <a href={PROFILE_URL} download={PROFILE_PDF_NAME} className="hero-link primary">
              <FaFileDownload aria-hidden="true" /> Download Profile
            </a>
            <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className="hero-link">
              <FaLinkedin aria-hidden="true" /> LinkedIn
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hero-link">
              <FaGithub aria-hidden="true" /> GitHub
            </a>
            <a href={`mailto:${EMAIL}`} className="hero-link">
              <FaEnvelope aria-hidden="true" /> Email
            </a>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-wrapper">
            <img src="/ishank.png" alt="Ishank Walia" width="1062" height="1480" />
            <div className="image-glow"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
