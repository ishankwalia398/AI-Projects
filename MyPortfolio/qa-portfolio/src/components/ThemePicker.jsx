import { FaSun, FaMoon } from 'react-icons/fa'
import './ThemePicker.css'

export default function ThemePicker({ theme, onSelect }) {
  return (
    <div className="theme-picker" role="group" aria-label="Color theme">
      <button type="button" aria-pressed={theme === 'light'}
        aria-label="Light: Sand & Copper" title="Sand & Copper"
        onClick={() => onSelect('light')}>
        <FaSun aria-hidden="true" /> Light
      </button>
      <button type="button" aria-pressed={theme === 'dark'}
        aria-label="Dark: Black & Green" title="Black & Green"
        onClick={() => onSelect('dark')}>
        <FaMoon aria-hidden="true" /> Dark
      </button>
    </div>
  )
}
