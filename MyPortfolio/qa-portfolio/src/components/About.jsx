import './About.css'

const ACHIEVEMENTS = [
  ['30% higher DRM-protected playback success', 'Kaltura'],
  ['40% fewer critical production incidents in 6 months', 'Kaltura'],
  ['95% regression coverage with execution time cut by 73%', 'Kaltura'],
  ['60% less production defect leakage', 'GlobalLogic'],
  ['98% system test coverage on telecom billing platforms', 'Ericsson'],
  ['AI agents that generate test plans, test cases and Playwright scripts', 'Personal projects']
]

function About() {
  return (
    <section className="about" id="about">
      <h2>About Me</h2>
      <div className="about-content">
        <div className="about-text">
          <p>
            I'm a <strong>Quality Engineering Lead</strong> at <strong>Kaltura</strong> with 15+ years in quality engineering, the last 8+ in{' '}
            <strong>OTT/TV streaming</strong>. I specialize in <strong>DRM validation (Widevine, FairPlay, PlayReady)</strong>{' '}
            and <strong>AI-augmented testing</strong>.
          </p>
          <p>
            My work spans <strong>multi-platform streaming QA</strong> (Web, iOS, Android, Smart TV),{' '}
            <strong>REST/GraphQL API testing</strong> and <strong>CI/CD pipeline integration</strong>. At Kaltura I raised
            DRM-protected playback success by 30% and cut regression execution time by 73%; at GlobalLogic I reduced
            production defect leakage by 60%.
          </p>
          <p>
            I build AI tools that generate test artifacts, triage defects and investigate failures, using{' '}
            <strong>CrewAI</strong>, <strong>LangChain</strong>, <strong>Langflow</strong>, <strong>n8n</strong> and{' '}
            <strong>RAG</strong>, with <strong>DeepEval</strong> to measure LLM output quality and{' '}
            <strong>Playwright</strong> for automation.
          </p>
        </div>
        <div className="about-highlights">
          <h3>Key Achievements</h3>
          <ul>
            {ACHIEVEMENTS.map(([text, source]) => (
              <li key={text}>
                <span>{text}</span>
                <span className="achievement-source">{source}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default About
