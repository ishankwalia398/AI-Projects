import { FaFileDownload } from 'react-icons/fa'
import ThemePicker from './ThemePicker'
import { RESUME_URL } from '../profile'
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
          <a href={RESUME_URL} download className="nav-resume">
            <FaFileDownload aria-hidden="true" /> Résumé
          </a>
        </div>
      </nav>
    </header>
  )
}
