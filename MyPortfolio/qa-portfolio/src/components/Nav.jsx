import { FaFileDownload } from 'react-icons/fa'
import ThemePicker from './ThemePicker'
import { PROFILE_PDF_NAME, PROFILE_URL } from '../profile'
import './Nav.css'

const LINKS = [
  ['About', '#about'],
  ['Experience', '#experience'],
  ['Projects', '#projects'],
  ['Skills', '#skills'],
  ['Contact', '#contact']
]

export default function Nav({ theme, onThemeChange }) {
  return (
    <header className="site-nav">
      <nav className="nav-inner" aria-label="Primary">
        <a href="#top" className="nav-brand">Ishank Walia</a>
        <ul className="nav-links">
          {LINKS.map(([label, href]) => (
            <li key={href}><a href={href}>{label}</a></li>
          ))}
        </ul>
        <div className="nav-actions">
          <ThemePicker theme={theme} onSelect={onThemeChange} />
          <a href={PROFILE_URL} download={PROFILE_PDF_NAME} className="nav-profile">
            <FaFileDownload aria-hidden="true" /> Profile
          </a>
        </div>
      </nav>
    </header>
  )
}
