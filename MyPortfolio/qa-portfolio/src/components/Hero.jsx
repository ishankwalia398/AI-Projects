import { FaGithub, FaLinkedin, FaEnvelope, FaPhone } from 'react-icons/fa'
import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="hero-banner">
        <div className="banner-content">
          <div className="banner-badge">🎯 OPEN TO OPPORTUNITIES - GenAI Roles · EU/US/APAC/Remote</div>
          <h2 className="banner-title">Senior QA Engineer | AI-Powered Testing Leader</h2>
          <p className="banner-subtitle">15+ Years · DRM & Streaming Expert · AI Agents & Automation · 30% Quality Improvement · 73% Faster Testing</p>
        </div>
      </div>
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            <span className="gradient-text">Ishank Walia</span>
          </h1>
          <p className="hero-subtitle">Senior QA Engineer turned AI-Powered Testing Leader</p>
          <p className="hero-description">
            15+ years making streaming platforms bulletproof. Now building intelligent QA systems with AI agents, RAG pipelines, and automation frameworks that catch what humans miss. Specialized in DRM validation, OTT/TV quality, and the engineering discipline needed to make AI-augmented testing production-ready.
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">30%</span>
              <span className="stat-label">DRM Success Rate ↑</span>
            </div>
            <div className="stat">
              <span className="stat-number">73%</span>
              <span className="stat-label">Faster Regression</span>
            </div>
            <div className="stat">
              <span className="stat-number">60%+</span>
              <span className="stat-label">Defect Reduction</span>
            </div>
          </div>
          <div className="hero-links">
            <a href="https://github.com/ishankwalia398" target="_blank" rel="noopener noreferrer" className="hero-link">
              <FaGithub /> GitHub
            </a>
            <a href="https://www.linkedin.com/in/ishankwalia/" target="_blank" rel="noopener noreferrer" className="hero-link">
              <FaLinkedin /> LinkedIn
            </a>
            <a href="mailto:ishank.walia398@gmail.com" className="hero-link">
              <FaEnvelope /> Email
            </a>
            <a href="tel:+919899467741" className="hero-link">
              <FaPhone /> Call
            </a>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-wrapper">
            <img src="/ishank.png" alt="Ishank Walia" />
            <div className="image-glow"></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
