import './Skills.css'

const SKILL_CATEGORIES = [
  {
    title: 'AI & LLM Engineering',
    skills: [
      'Agentic AI for QA',
      'Multi-agent systems (CrewAI, LangChain)',
      'RAG (Pinecone, ChromaDB, Qdrant)',
      'LLM evaluation (DeepEval)',
      'Prompt engineering',
      'Workflow automation (n8n, Langflow)',
      'MCP (Model Context Protocol)'
    ]
  },
  {
    title: 'DRM & Streaming',
    skills: [
      'Widevine, FairPlay, PlayReady',
      'License acquisition & token expiry',
      'HLS / DASH',
      'Adaptive bitrate (ABR)',
      'CDN failover',
      'Playback & codec validation',
      'Smart TV (Tizen, webOS)'
    ]
  },
  {
    title: 'Testing & Automation',
    skills: [
      'Multi-platform QA (Web, iOS, Android, TV)',
      'REST & GraphQL API testing',
      'Playwright',
      'Node.js test frameworks',
      'Risk-based & shift-left testing',
      'ATDD / BDD',
      'Regression & integration testing'
    ]
  },
  {
    title: 'Languages & Tooling',
    skills: [
      'JavaScript',
      'TypeScript',
      'Python',
      'Postman',
      'Jenkins',
      'Git, GitHub, GitLab',
      'Jira'
    ]
  }
]

function Skills() {
  return (
    <section className="skills" id="skills">
      <h2>Core Skills & Technologies</h2>
      <div className="skills-grid">
        {SKILL_CATEGORIES.map(category => (
          <div key={category.title} className="skill-category">
            <h3>{category.title}</h3>
            <ul className="skill-tags">
              {category.skills.map(skill => (
                <li key={skill} className="skill-tag">{skill}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Skills
