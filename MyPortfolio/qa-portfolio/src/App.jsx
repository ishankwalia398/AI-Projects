import { useState, useEffect } from 'react'
import ThemePicker from './components/ThemePicker'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import GitHub from './components/GitHub'
import Experience from './components/Experience'
import Contact from './components/Contact'
import './App.css'

function App() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.removeAttribute('data-palette')
    document.documentElement.style.colorScheme = theme
    try {
      localStorage.removeItem('theme')
      localStorage.removeItem('palette')
    } catch { /* Keep theme switching available when storage is disabled. */ }
  }, [theme])

  return (
    <div className="app">
      <ThemePicker theme={theme} onSelect={setTheme} />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <GitHub />
      <Experience />
      <Contact />
    </div>
  )
}

export default App
