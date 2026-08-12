import { FaGithub, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa'
import './Contact.css'

function Contact() {
  return (
    <section className="contact">
      <h2>Let's Connect</h2>
      <div className="contact-content">
        <div className="contact-text">
          <p>
            I'm actively seeking opportunities in <strong>Quality Engineering, QA Automation, and AI-Augmented Testing</strong>.
            Open to remote work and relocation.
          </p>
          <p>
            Looking for a senior QA engineer who can bring 15+ years of experience, AI expertise,
            and a proven track record of reducing defects while accelerating releases? Let's talk.
          </p>
        </div>
        <div className="contact-links">
          <a href="mailto:ishank.walia398@gmail.com" className="contact-link">
            <FaEnvelope className="contact-icon" />
            <div>
              <span className="contact-label">Email</span>
              <span className="contact-value">ishank.walia398@gmail.com</span>
            </div>
          </a>
          <a href="tel:+919899467741" className="contact-link">
            <FaPhone className="contact-icon" />
            <div>
              <span className="contact-label">Phone</span>
              <span className="contact-value">+91-9899467741</span>
            </div>
          </a>
          <a href="https://www.linkedin.com/in/ishankwalia/" target="_blank" rel="noopener noreferrer" className="contact-link">
            <FaLinkedin className="contact-icon" />
            <div>
              <span className="contact-label">LinkedIn</span>
              <span className="contact-value">linkedin.com/in/ishankwalia</span>
            </div>
          </a>
          <a href="https://github.com/ishankwalia398" target="_blank" rel="noopener noreferrer" className="contact-link">
            <FaGithub className="contact-icon" />
            <div>
              <span className="contact-label">GitHub</span>
              <span className="contact-value">github.com/ishankwalia398</span>
            </div>
          </a>
          <div className="contact-link">
            <FaMapMarkerAlt className="contact-icon" />
            <div>
              <span className="contact-label">Location</span>
              <span className="contact-value">Noida, India</span>
            </div>
          </div>
        </div>
      </div>
      <footer className="footer">
        <p>© 2026 Ishank Walia. Built with React. Deployed on Vercel.</p>
      </footer>
    </section>
  )
}

export default Contact
