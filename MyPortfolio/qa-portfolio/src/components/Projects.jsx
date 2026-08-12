import { FaGithub, FaExternalLinkAlt } from 'react-icons/fa'
import './Projects.css'

function Projects() {
  const projects = [
    {
      category: "N8N AI Agents",
      items: [
        { name: "QA Buddy", description: "AI assistant for QA workflows with RAG integration" },
        { name: "LinkedIn Post Generator", description: "Automated content creation for professional posts" },
        { name: "PRD to Test Artifacts", description: "Converts product requirements to test cases" }
      ]
    },
    {
      category: "Langflow AI Agents",
      items: [
        { name: "AI Chat Buddy", description: "Conversational AI for QA guidance" },
        { name: "API Contract Validator", description: "Validates API contracts and responses" },
        { name: "Bug Triage", description: "Intelligent bug categorization and prioritization" },
        { name: "Flaky Test Analyzer", description: "Identifies and analyzes flaky test patterns" },
        { name: "RCA Agent", description: "Root cause analysis for test failures" },
        { name: "Test Plan Creator", description: "Generates comprehensive test plans" },
        { name: "Test Case Creator", description: "AI-powered test case generation" }
      ]
    },
    {
      category: "AI Tools & Automation",
      items: [
        { name: "AI Job Tracker", description: "Job application tracking with AI insights" },
        { name: "Job Finder and Tracker", description: "Automated job search and tracking" },
        { name: "AI Global Career & Resume Suite", description: "Resume optimization and career guidance" },
        { name: "Postman to Playwright", description: "Converts Postman collections to Playwright tests" },
        { name: "LinkedIn Content Generator", description: "Creates engaging LinkedIn content" }
      ]
    },
    {
      category: "RAG Applications",
      items: [
        { name: "Basic RAG (N8N)", description: "Retrieval-augmented generation with n8n" },
        { name: "Basic RAG (Vibe Coding)", description: "RAG implementation using prompt engineering" },
        { name: "QA Buddy with RAG", description: "Context-aware QA assistant" },
        { name: "Test Case Pipeline using RAG", description: "Automated test case generation pipeline" }
      ]
    },
    {
      category: "QA Skills Showcase",
      items: [
        { name: "Software Test Plan Generator", description: "Automated STP generation from requirements" },
        { name: "Test Case Generator", description: "Intelligent test case creation" },
        { name: "Practitest Integration", description: "Upload test cases to Practitest automatically" },
        { name: "Postman to Playwright Converter", description: "API test migration tool" },
        { name: "Automation Report Analyzer", description: "Analyzes test execution reports" },
        { name: "Portfolio Builder", description: "AI-powered professional portfolio creation tool" }
      ]
    }
  ]

  return (
    <section className="projects">
      <h2>AI Projects & Tools</h2>
      <div className="projects-intro">
        <p>
          Building the future of quality engineering with AI agents, intelligent automation, and RAG-powered tools.
          All projects are available on my <a href="https://github.com/ishankwalia398/AI-Projects" target="_blank" rel="noopener noreferrer">GitHub</a>.
        </p>
      </div>
      <div className="projects-container">
        {projects.map((category, index) => (
          <div key={index} className="project-category">
            <h3 className="category-title">{category.category}</h3>
            <div className="project-grid">
              {category.items.map((project, idx) => (
                <div key={idx} className="project-card">
                  <h4>{project.name}</h4>
                  <p>{project.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
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
