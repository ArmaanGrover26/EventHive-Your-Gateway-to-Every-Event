import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Flame, ArrowRight, Ticket, Star, Globe } from 'lucide-react'
import EventCard from '../components/ui/EventCard.jsx'
import Loader from '../components/ui/Loader.jsx'
import { getFeaturedEvents, getCategories } from '../services/api.js'

// Decorative floating cards in hero (visual only, not data-driven)
const MINI_CARDS = [
  { cat: 'Music',    title: 'Live Concert',       price: '₹2,500', date: 'Coming Up' },
  { cat: 'Tech',     title: 'React Summit India', price: '₹1,500', date: 'Coming Up' },
  { cat: 'Fest',     title: 'Sunburn Festival',   price: '₹4,000', date: 'Coming Up' },
  { cat: 'Comedy',   title: 'Stand-up Night',     price: '₹1,200', date: 'Coming Up' },
]

export default function Home() {
  const [featured,   setFeatured]   = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getFeaturedEvents(), getCategories()])
      .then(([feats, cats]) => { setFeatured(feats); setCategories(cats) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      {/* ── HERO ───────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-eyebrow">
              <Flame size={13} /> Discover • Book • Attend
            </div>
            <h1 className="hero-title">
              Discover Events That{' '}
              <span className="gradient-text">Move You</span>
            </h1>
            <p className="hero-subtitle">
              From sold-out concerts to intimate workshops — find, book, and experience
              the best events near you. Your next unforgettable memory is one click away.
            </p>
            <div className="hero-cta">
              <Link to="/events" className="btn btn-primary btn-xl">
                Explore Events <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn btn-ghost btn-xl">
                Host an Event
              </Link>
            </div>
            <div className="hero-stats">
              {[
                { value: '10K+', label: 'Events Listed'     },
                { value: '500+', label: 'Cities Covered'    },
                { value: '1M+',  label: 'Happy Attendees'   },
                { value: '98%',  label: 'Satisfaction Rate' },
              ].map(s => (
                <div key={s.label}>
                  <div className="hero-stat-value">{s.value}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Floating cards visual */}
        <div className="hero-visual">
          <div className="hero-blob" />
          <div className="hero-cards-float">
            {MINI_CARDS.map((c, i) => (
              <div key={i} className="hero-mini-card">
                <div className="hero-mini-card-cat">{c.cat}</div>
                <div className="hero-mini-card-title">{c.title}</div>
                <div className="hero-mini-card-info">
                  <span className="hero-mini-card-price">{c.price}</span>
                  <span className="hero-mini-card-date">{c.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ─────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">Browse by Category</h2>
              <p className="section-subtitle">Find your next experience across {categories.length} event types</p>
            </div>
            <Link to="/events" className="btn btn-outline btn-sm">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="category-grid">
            {(loading ? Array(8).fill(null) : categories).map((cat, i) =>
              cat ? (
                <div
                  key={cat.id}
                  className="category-card"
                  onClick={() => navigate(`/events?category=${cat.id}`)}
                >
                  <div className="category-icon">{cat.icon}</div>
                  <div className="category-name">{cat.label}</div>
                  <div className="category-count">{cat.count} events</div>
                </div>
              ) : (
                <div key={i} className="category-card" style={{ opacity: 0.4, animation: 'pulse 1.5s infinite' }} />
              )
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURED EVENTS ────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-header-row">
            <div>
              <h2 className="section-title">🔥 Trending Events</h2>
              <p className="section-subtitle">Hot tickets selling fast — grab yours now</p>
            </div>
            <Link to="/events" className="btn btn-outline btn-sm">
              See All <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <Loader page text="Fetching hot events..." />
          ) : featured.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎭</div>
              <h3>No events yet</h3>
              <p>Check back soon — organizers are adding events!</p>
              <Link to="/register" className="btn btn-primary">Host an Event</Link>
            </div>
          ) : (
            <div className="events-grid">
              {featured.slice(0, 6).map(e => <EventCard key={e._id} event={e} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────── */}
      <section className="section how-it-works">
        <div className="container">
          <div className="section-header text-center" style={{ maxWidth: 560, margin: '0 auto 48px' }}>
            <h2 className="section-title">How EventHive Works</h2>
            <p className="section-subtitle">Book any event in under 2 minutes</p>
          </div>
          <div className="steps-grid">
            {[
              { num: '01', icon: '🔍', title: 'Find Your Event',    desc: 'Browse thousands of events by category, location, or date. Use smart filters to find exactly what you\'re looking for.' },
              { num: '02', icon: '🎟️', title: 'Choose Your Ticket', desc: 'Pick your ticket type — General, VIP, or Early Bird. Select quantity and review the details instantly.' },
              { num: '03', icon: '🎉', title: 'Attend & Enjoy',     desc: 'Get your QR code ticket instantly. Show it at the door and dive into an unforgettable experience.' },
            ].map(s => (
              <div key={s.num} className="step-card">
                <div className="step-number">{s.icon}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ───────────────────────── */}
      <section className="section-sm">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { icon: <Ticket size={24} color="var(--orange)" />, title: 'Instant E-Tickets',   desc: 'QR code tickets delivered to your inbox instantly after booking.' },
              { icon: <Star   size={24} color="var(--gold)"   />, title: 'Verified Organizers', desc: 'Every event on EventHive goes through a quality verification process.' },
              { icon: <Globe  size={24} color="var(--teal, #06B6D4)" />, title: 'Pan-India Coverage', desc: 'Events across 500+ cities and 8 categories. Never miss what\'s near you.' },
            ].map(f => (
              <div key={f.title} className="card" style={{ textAlign: 'center' }}>
                <div style={{ background: 'var(--orange-subtle)', width: 56, height: 56, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────── */}
      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <h2>Ready to Host Your Next Big Event?</h2>
            <p>Join organizers who trust EventHive to sell out their shows</p>
            <Link to="/register" className="btn btn-white btn-xl">
              Start for Free <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
