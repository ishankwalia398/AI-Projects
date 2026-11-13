import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa'
import { FEATURED_PROJECTS, MORE_PROJECTS, QA_SKILLS } from '../data/projects'
import { PROJECT_REPOSITORY_URL } from '../profile'
import './Projects.css'

function Projects() {
  return (
    <section className="projects" id="projects">
      <h2>AI Projects & Tools</h2>
      <p className="section-lead">
        AI agents, RAG pipelines and LLM evaluation applied to real QA problems. Everything is open source in my{' '}
        <a href={PROJECT_REPOSITORY_URL} target="_blank" rel="noopener noreferrer">AI-Projects repository</a>.
      </p>

      <div className="featured-grid">
        {FEATURED_PROJECTS.map(project => (
          <article key={project.folder} className="featured-card">
            {/* Add `image: '/projects/<file>.jpg'` (16:9) in data/projects.js to show a screenshot. */}
            {project.image && (
              <a href={project.live} target="_blank" rel="noopener noreferrer" className="featured-image" tabIndex={-1} aria-hidden="true">
                <img src={project.image} alt="" loading="lazy" width="1200" height="675" />
              </a>
            )}
            <div className="featured-meta">
              <span className="featured-category">{project.category}</span>
              <span className="live-pill"><span className="status-dot" aria-hidden="true"></span> Live demo</span>
            </div>
            <div className="featured-body">
              <h3>{project.name}</h3>
              <p className="featured-tagline">{project.tagline}</p>
              <dl className="featured-details">
                <dt>Problem</dt>
                <dd>{project.problem}</dd>
                <dt>Approach</dt>
                <dd>{project.approach}</dd>
              </dl>
              <ul className="stack-list" aria-label="Tech stack">
                {project.stack.map(item => <li key={item}>{item}</li>)}
              </ul>
              <div className="featured-actions">
                <a href={project.live} target="_blank" rel="noopener noreferrer" className="action primary">
                  <FaExternalLinkAlt aria-hidden="true" /> Live demo
                </a>
                <a href={project.url} target="_blank" rel="noopener noreferrer" className="action">
                  <FaGithub aria-hidden="true" /> Source
                </a>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="project-category">
        <h3 className="category-title">More AI Projects</h3>
        <div className="project-grid">
          {MORE_PROJECTS.map(project => (
            <article key={project.folder} className="project-card">
              <h4>
                <a href={project.url} target="_blank" rel="noopener noreferrer" className="card-link">{project.name}</a>
              </h4>
              <p>{project.description}</p>
              {project.live && (
                <a href={project.live} target="_blank" rel="noopener noreferrer" className="card-live">
                  Live demo <FaExternalLinkAlt aria-hidden="true" />
                </a>
              )}
            </article>
          ))}
        </div>
      </div>

      <div className="project-category">
        <h3 className="category-title">Reusable QA Skills</h3>
        <p className="category-lead">Claude Code skills that automate everyday QA work, from test planning to PractiTest uploads.</p>
        <div className="project-grid">
          {QA_SKILLS.map(skill => (
            <article key={skill.name} className="project-card">
              <h4>
                {skill.url
                  ? <a href={skill.url} target="_blank" rel="noopener noreferrer" className="card-link">{skill.name}</a>
                  : skill.name}
              </h4>
              <p>{skill.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Projects
