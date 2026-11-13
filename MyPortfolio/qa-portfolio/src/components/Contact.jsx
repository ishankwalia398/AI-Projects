import { FaGithub, FaLinkedin, FaEnvelope, FaFileDownload } from 'react-icons/fa'
import { EMAIL, GITHUB_URL, GITHUB_USER, LINKEDIN_URL, RESUME_URL } from '../profile'
import './Contact.css'

const CONTACT_LINKS = [
  { label: 'Email', value: EMAIL, href: `mailto:${EMAIL}`, Icon: FaEnvelope },
  { label: 'LinkedIn', value: 'linkedin.com/in/ishankwalia', href: LINKEDIN_URL, Icon: FaLinkedin, external: true },
  { label: 'GitHub', value: `github.com/${GITHUB_USER}`, href: GITHUB_URL, Icon: FaGithub, external: true },
  { label: 'Résumé', value: 'Download PDF', href: RESUME_URL, Icon: FaFileDownload, download: true }
]

function Contact() {
  return (
    <section className="contact" id="contact">
      <h2>Let's Connect</h2>
      <div className="contact-content">
        <div className="contact-text">
          <p>
            I'm open to roles in <strong>Quality Engineering, QA Automation and AI-Augmented Testing</strong>, remote or
            with relocation. Based in Noida, India.
          </p>
          <p>
            Looking for a quality engineering lead who brings 15+ years of QA, deep DRM and streaming expertise, hands-on AI
            tooling and a record of cutting defects while speeding up releases? Let's talk.
          </p>
        </div>
        <div className="contact-links">
          {CONTACT_LINKS.map(({ label, value, href, Icon, external, download }) => (
            <a
              key={label}
              href={href}
              className="contact-link"
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              {...(download ? { download: true } : {})}
            >
              <Icon className="contact-icon" aria-hidden="true" />
              <div>
                <span className="contact-label">{label}</span>
                <span className="contact-value">{value}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Contact
