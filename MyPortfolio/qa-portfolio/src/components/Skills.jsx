import './Skills.css'

function Skills() {
  const skillCategories = [
    {
      title: "AI & Automation",
      skills: [
        "AI-Augmented Testing",
        "Agentic AI for QA",
        "Large Language Models (LLMs)",
        "RAG (Retrieval-Augmented Generation)",
        "Prompt Engineering",
        "AI Workflow Automation (n8n)",
        "AI Application Prototyping (Langflow)",
        "Playwright + AI",
        "Intelligent Test Case Generation",
        "AI-powered Defect Analysis"
      ]
    },
    {
      title: "DRM & Streaming",
      skills: [
        "Widevine, FairPlay, PlayReady",
        "DRM License Acquisition",
        "Token Expiry Testing",
        "HLS / DASH Streaming",
        "ABR (Adaptive Bitrate)",
        "CDN Failover Testing",
        "Playback Validation",
        "Codec Testing"
      ]
    },
    {
      title: "Testing & QA",
      skills: [
        "Multi-Platform QA (Web, iOS, Android, Smart TV)",
        "REST & GraphQL API Testing",
        "Playwright Automation",
        "Node.js Test Frameworks",
        "Integration Testing",
        "Regression Testing",
        "Risk-Based Testing",
        "Shift-Left Testing"
      ]
    },
    {
      title: "Tools & Technologies",
      skills: [
        "Playwright",
        "Postman",
        "Node.js",
        "Git / GitHub / GitLab",
        "Jenkins CI/CD",
        "Jira",
        "n8n",
        "Langflow",
        "MCP (Model Context Protocol)"
      ]
    }
  ]

  return (
    <section className="skills">
      <h2>Core Skills & Technologies</h2>
      <div className="skills-grid">
        {skillCategories.map((category, index) => (
          <div key={index} className="skill-category">
            <h3>{category.title}</h3>
            <div className="skill-tags">
              {category.skills.map((skill, idx) => (
                <span key={idx} className="skill-tag">{skill}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Skills
