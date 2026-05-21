import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'

const LINKS = {
  Platform: [
    { label: 'Browse Events',   to: '/events'   },
    { label: 'Create an Event', to: '/register' },
    { label: 'Pricing',         to: '#'         },
    { label: 'Organizer Guide', to: '#'         },
  ],
  Company: [
    { label: 'About Us',  to: '#' },
    { label: 'Blog',      to: '#' },
    { label: 'Careers',   to: '#' },
    { label: 'Press Kit', to: '#' },
  ],
  Support: [
    { label: 'Help Center',      to: '#' },
    { label: 'Contact Us',       to: '#' },
    { label: 'Refund Policy',    to: '#' },
    { label: 'Terms of Service', to: '#' },
  ],
}

const SOCIALS = [
  { label: '𝕏',  href: '#' },
  { label: '📸', href: '#' },
  { label: '💼', href: '#' },
  { label: '▶️', href: '#' },
]

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="nav-brand" style={{ marginBottom: '12px', display: 'inline-flex' }}>
                <Flame size={22} color="var(--orange)" />
                <span className="nav-brand-text">EventHive</span>
              </Link>
              <p>
                Your gateway to every event. Discover concerts, workshops, sports, and more.
                Book your seat in seconds and make memories that last a lifetime.
              </p>
            </div>

            {Object.entries(LINKS).map(([section, links]) => (
              <div key={section} className="footer-col">
                <h4>{section}</h4>
                <div className="footer-links">
                  {links.map(l => (
                    <Link key={l.label} to={l.to} className="footer-link">{l.label}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} EventHive. All rights reserved. Made with 🔥 in India.</p>
            <div className="footer-socials">
              {SOCIALS.map(({ label, href }) => (
                <a key={label} href={href} className="social-btn" target="_blank" rel="noopener noreferrer"
                   style={{ fontSize: '1rem' }}>
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
