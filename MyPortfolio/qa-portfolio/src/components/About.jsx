import './About.css'

function About() {
  return (
    <section className="about">
      <h2>About Me</h2>
      <div className="about-content">
        <div className="about-text">
          <p>
            I'm a <strong>Senior QA Engineer</strong> with 15+ years of experience specializing in <strong>DRM validation
            (Widevine, FairPlay, PlayReady)</strong>, <strong>OTT/TV streaming platforms</strong>, and <strong>AI-augmented
            testing</strong>. Currently leading quality engineering at <strong>Kaltura</strong>.
          </p>
          <p>
            My expertise spans <strong>multi-platform streaming QA</strong> (Web, iOS, Android, Smart TV),
            <strong>REST/GraphQL API testing</strong>, and <strong>CI/CD pipeline integration</strong>. I've increased
            DRM-protected playback success by 30%, reduced production defects by 60%+, and accelerated regression cycles by 73%.
          </p>
          <p>
            I'm passionate about leveraging <strong>AI agents</strong>, <strong>LLMs</strong>, and <strong>intelligent
            automation</strong> to revolutionize quality engineering. I build AI-powered tools for test case generation,
            defect analysis, and regression optimization using <strong>n8n</strong>, <strong>Langflow</strong>,
            <strong>Playwright</strong>, and <strong>RAG</strong>.
          </p>
        </div>
        <div className="about-highlights">
          <h3>Key Achievements</h3>
          <ul>
            <li>🎯 30% increase in DRM-protected playback success rate</li>
            <li>🐛 60%+ reduction in production defects</li>
            <li>⚡ 73% faster regression test execution</li>
            <li>🔒 Zero critical defects in complex streaming releases</li>
            <li>🤖 Built AI agents for automated test artifacts generation</li>
            <li>📊 95% regression coverage with Node.js automation</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default About
