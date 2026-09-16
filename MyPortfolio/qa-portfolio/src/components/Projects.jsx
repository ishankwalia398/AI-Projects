import { useEffect, useState } from 'react'
import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa'
import { fetchAiProjects } from '../github'
import './Projects.css'

function Projects() {
  const [projects, setProjects] = useState([])
  const [projectError, setProjectError] = useState('')

  useEffect(() => {
    fetchAiProjects().then(setProjects).catch(() => {
      setProjectError('Projects are temporarily unavailable. View the repository on GitHub for the latest list.')
    })
  }, [])

  const qaSkills = [
    ['Software Test Plan Generator', 'Automated STP generation from requirements'],
    ['Test Case Generator', 'Intelligent test case creation'],
    ['Practitest Integration', 'Upload test cases to Practitest automatically'],
    ['Postman to Playwright Converter', 'API test migration tool'],
    ['Automation Report Analyzer', 'Analyzes test execution reports'],
    ['Generate Backend Software Test Plan', 'Automated STP generation from requirements, for Backend only'],
    ['Generate Backend Test Case', 'Intelligent test case creation, for Backend only']
  ]

  return (
    <section className="projects">
      <h2>AI Projects & Tools</h2>
      <div className="projects-intro">
        <p>
          Live project directory from GitHub, refreshed whenever this page opens. Building the future of quality engineering with AI agents, intelligent automation, and RAG-powered tools.
          All projects are available on my <a href="https://github.com/ishankwalia398/AI-Projects" target="_blank" rel="noopener noreferrer">GitHub</a>.
        </p>
      </div>
      <div className="projects-container">
        <div className="project-category">
          <h3 className="category-title">AI-Powered Projects</h3>
          {projectError && <p className="project-status">{projectError}</p>}
          {!projects.length && !projectError && <p className="project-status">Loading projects from GitHub...</p>}
          <div className="project-grid">
            {projects.map(project => (
              <a key={project.path} href={project.url} target="_blank" rel="noopener noreferrer" className="project-card">
                <h4>{project.name} <FaExternalLinkAlt aria-hidden="true" /></h4>
                <p>{project.description}</p>
              </a>
            ))}
          </div>
        </div>
        <div className="project-category">
          <h3 className="category-title">QA Skills Showcase</h3>
          <div className="project-grid">
            {qaSkills.map(([name, description]) => (
              <div key={name} className="project-card">
                <h4>{name}</h4>
                <p>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="projects-cta">
        <a
          href="https://github.com/ishankwalia398/AI-Projects"
          target="_blank"
          rel="noopener noreferrer"
          className="github-button"
        >
          <FaGithub /> View All Projects on GitHub
        </a>
      </div>
    </section>
  )
}

export default Projects
