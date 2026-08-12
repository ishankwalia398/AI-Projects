import { useState, useEffect } from 'react'
import { FaSun, FaMoon } from 'react-icons/fa'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import GitHub from './components/GitHub'
import Experience from './components/Experience'
import Contact from './components/Contact'
import './App.css'

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="app">
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <FaSun /> : <FaMoon />}
      </button>
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
