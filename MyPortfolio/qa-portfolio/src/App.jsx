import { useState, useEffect } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Skills from './components/Skills'
import GitHub from './components/GitHub'
import Contact from './components/Contact'
import Footer from './components/Footer'
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
      <Nav theme={theme} onThemeChange={setTheme} />
      <main>
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Skills />
        <GitHub />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default App
