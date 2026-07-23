import { Link } from 'react-router-dom'
import './footer.css'

export default function Footer() {
  return (
    <footer className="pm-footer">
      <div className="container-pm pm-footer__inner">
        <div className="pm-footer__brand">
          <span className="pm-nav__brand-mark" aria-hidden="true">🐾</span> PawMap
          <p>Community-driven rescue for the strays of Bengaluru.</p>
        </div>
        <div className="pm-footer__cols">
          <div>
            <h4>Platform</h4>
            <Link to="/report">Report a stray</Link>
            <Link to="/adopt">Adopt</Link>
            <Link to="/volunteer">Volunteer</Link>
          </div>
          <div>
            <h4>Account</h4>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </div>
          <div>
            <h4>About</h4>
            <Link to="/about">Our mission</Link>
            <Link to="/analytics">Impact data</Link>
          </div>
        </div>
      </div>
      <div className="pm-footer__bottom container-pm">
        <span>© {new Date().getFullYear()} PawMap. Built for the strays who can't wait.</span>
      </div>
    </footer>
  )
}