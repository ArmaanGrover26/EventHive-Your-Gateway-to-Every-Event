import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin, Ticket, Clock, QrCode, X } from 'lucide-react'
import Loader from '../components/ui/Loader.jsx'
import { getMyBookings, cancelBooking } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const fmt      = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
const initials = (n) => n?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()

const STATUS_STYLE = {
  confirmed: 'badge-green',
  cancelled: 'badge-red',
  pending:   'badge-gold',
}

export default function Dashboard() {
  const { user }    = useAuth()
  const toast       = useToast()
  const [bookings,   setBookings]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [cancelling, setCancelling] = useState(null)
  const [tab,        setTab]        = useState('upcoming')

  useEffect(() => {
    getMyBookings()
      .then(setBookings)
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false))
  }, [])

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return
    setCancelling(id)
    try {
      await cancelBooking(id)
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b))
      toast.success('Booking cancelled successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking')
    } finally {
      setCancelling(null)
    }
  }

  const upcoming = bookings.filter(b => b.status === 'confirmed')
  const past     = bookings.filter(b => b.status === 'cancelled')
  const shown    = tab === 'upcoming' ? upcoming : past

  const stats = [
    { label: 'Total Bookings',  value: bookings.length,              icon: '🎟️', color: 'var(--orange)' },
    { label: 'Upcoming Events', value: upcoming.length,              icon: '📅', color: 'var(--gold)'   },
    { label: 'Events Attended', value: past.length,                  icon: '✅', color: 'var(--success)' },
    { label: 'Total Spent',     value: `₹${bookings.filter(b => b.status === 'confirmed').reduce((s,b) => s + b.totalAmount, 0).toLocaleString('en-IN')}`, icon: '💰', color: 'var(--teal,#06B6D4)' },
  ]

  if (loading) return <Loader page text="Loading your bookings..." />

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
              {initials(user?.name)}
            </div>
            <div>
              <h1 className="page-title" style={{ marginBottom: 2 }}>Hey, {user?.name?.split(' ')[0]}! 👋</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{user?.email} · {user?.role}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="dashboard-stats">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}15` }}>
                <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-card)', border: '1px solid var(--border-solid)', borderRadius: 'var(--radius-lg)', padding: 6, width: 'fit-content' }}>
          {[
            { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
            { key: 'past',     label: `Past / Cancelled (${past.length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{
                padding: '8px 20px', borderRadius: 'var(--radius-md)', fontWeight: 500, fontSize: '0.875rem',
                background: tab === key ? 'var(--gradient-brand)' : 'transparent',
                color: tab === key ? '#fff' : 'var(--text-muted)',
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {shown.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎭</div>
            <h3>{tab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}</h3>
            <p>{tab === 'upcoming' ? 'Explore events and book your next experience!' : 'Events you\'ve attended will appear here.'}</p>
            <Link to="/events" className="btn btn-primary">Browse Events</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {shown.map(b => (
              <div key={b._id} className="booking-card" style={{ opacity: b.status === 'cancelled' ? 0.65 : 1 }}>
                <img src={b.event?.bannerUrl} alt="" className="booking-card-img" />
                <div className="booking-card-info">
                  <h3 className="booking-card-title">{b.event?.title}</h3>
                  <div className="booking-card-meta">
                    <span><Calendar size={13} /> {fmt(b.event?.date)}</span>
                    <span><Clock    size={13} /> {b.event?.time}</span>
                    <span><MapPin   size={13} /> {b.event?.venue?.city}</span>
                    <span><Ticket   size={13} /> {b.ticketType?.name} × {b.quantity}</span>
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className={`badge ${STATUS_STYLE[b.status]}`}>{b.status}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Ref: {b.bookingRef}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--gold)' }}>
                      {b.totalAmount === 0 ? 'FREE' : `₹${b.totalAmount.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>
                <div className="booking-card-actions">
                  <button className="btn btn-ghost btn-sm" title="View QR Ticket">
                    <QrCode size={15} /> QR Ticket
                  </button>
                  {b.status === 'confirmed' && (
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--error-subtle)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)' }}
                      onClick={() => handleCancel(b._id)}
                      disabled={cancelling === b._id}
                    >
                      <X size={14} /> {cancelling === b._id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
