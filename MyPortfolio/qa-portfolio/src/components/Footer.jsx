import { FaArrowUp } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>© {new Date().getFullYear()} Ishank Walia · Quality Engineering Lead</p>
        <a href="#top">Back to top <FaArrowUp aria-hidden="true" /></a>
      </div>
    </footer>
  )
}
