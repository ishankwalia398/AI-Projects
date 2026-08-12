import './Experience.css'

function Experience() {
  const experiences = [
    {
      title: "Quality Engineering Lead",
      company: "Kaltura",
      location: "Noida, India",
      period: "April 2024 – Present",
      type: "OTT / DRM / Streaming",
      highlights: [
        "Increased DRM-protected playback success rate by 30%",
        "Reduced critical production incidents by 40% in 6 months",
        "Built Node.js automation framework achieving 95% regression coverage",
        "Cut execution time by 73% enabling daily confident release validation",
        "Shifted defect detection left, catching 80% of issues pre-integration"
      ]
    },
    {
      title: "Consultant – Senior QA Engineer",
      company: "GlobalLogic",
      location: "Noida, India",
      period: "January 2018 – April 2024",
      type: "Automation & Streaming",
      highlights: [
        "Reduced production defect leakage by 60%",
        "Accelerated regression cycles by 80% through Node.js automation",
        "Increased early-stage defect detection by 50%+",
        "Eliminated 75% of redundant test cases",
        "Improved acceptance criteria quality, reducing rework by 30%"
      ]
    },
    {
      title: "Senior QA Engineer",
      company: "Zenith System Solutions",
      location: "Mumbai, India",
      period: "June 2017 – December 2017",
      type: "Automation & Integration Testing",
      highlights: [
        "Reduced end-to-end test cycle time by 83%",
        "Prevented critical production failures through integration coverage",
        "Mentored engineers on structured test design"
      ]
    },
    {
      title: "Solution Integrator (QA)",
      company: "Ericsson",
      location: "Gurgaon, India",
      period: "November 2013 – June 2017",
      type: "System & Integration Testing",
      highlights: [
        "Achieved 98% system test coverage across telecom platforms",
        "Reduced manual regression effort by 60%",
        "Prevented revenue-impacting defects through billing validation",
        "Improved defect turnaround time by 55%"
      ]
    },
    {
      title: "QA Subject Matter Expert",
      company: "Amdocs",
      location: "Pune, India",
      period: "July 2011 – November 2013",
      type: "Billing & CRM Platforms",
      highlights: [
        "Delivered zero critical production defects across multiple releases",
        "Standardized QA reporting and defect tracking"
      ]
    }
  ]

  return (
    <section className="experience">
      <h2>Professional Experience</h2>
      <div className="experience-timeline">
        {experiences.map((exp, index) => (
          <div key={index} className="experience-item">
            <div className="experience-marker"></div>
            <div className="experience-content">
              <div className="experience-header">
                <div>
                  <h3>{exp.title}</h3>
                  <p className="company">{exp.company} — {exp.location}</p>
                </div>
                <div className="experience-meta">
                  <span className="period">{exp.period}</span>
                  <span className="type">{exp.type}</span>
                </div>
              </div>
              <ul className="highlights">
                {exp.highlights.map((highlight, idx) => (
                  <li key={idx}>{highlight}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Experience
