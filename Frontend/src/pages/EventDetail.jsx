import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Clock, Users, Tag, Share2, CheckCircle } from 'lucide-react'
import Loader from '../components/ui/Loader.jsx'
import Modal from '../components/ui/Modal.jsx'
import { getEventById, createBooking } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const initials = (n) => n?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export default function EventDetail() {
  const { id } = useParams()
  const { user }    = useAuth()
  const toast       = useToast()
  const navigate    = useNavigate()
  const [event,     setEvent]    = useState(null)
  const [loading,   setLoading]  = useState(true)
  const [selected,  setSelected] = useState(null)
  const [qty,       setQty]      = useState(1)
  const [modal,     setModal]    = useState(false)
  const [booking,   setBooking]  = useState(false)
  const [booked,    setBooked]   = useState(false)

  useEffect(() => {
    setLoading(true)
    getEventById(id)
      .then(e => { setEvent(e); if (e.ticketTypes?.length) setSelected(e.ticketTypes[0]) })
      .catch((err) => toast.error(err.response?.data?.message || 'Event not found'))
      .finally(() => setLoading(false))
  }, [id])

  const handleBook = async () => {
    if (!user) { navigate('/login'); return }
    setBooking(true)
    try {
      await createBooking({ eventId: event._id, ticketTypeId: selected._id, quantity: qty })
      setBooked(true)
      toast.success('🎉 Booking confirmed! Check your dashboard.')
      setTimeout(() => { setModal(false); setBooked(false) }, 2200)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Booking failed')
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <Loader page text="Loading event..." />
  if (!event)  return <div className="container section"><p>Event not found.</p></div>

  const avail = selected ? selected.totalSeats - selected.bookedSeats : 0
  const pct   = selected ? Math.round((selected.bookedSeats / selected.totalSeats) * 100) : 0

  return (
    <>
      {/* Banner */}
      <div className="event-detail-hero">
        <img src={event.bannerUrl} alt={event.title} />
        <div className="event-detail-hero-content">
          <div className="container">
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="badge badge-orange" style={{ textTransform: 'capitalize' }}>{event.category}</span>
              {event.status === 'approved' && <span className="badge badge-green"><CheckCircle size={10} /> Verified</span>}
            </div>
            <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.75rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 12 }}>{event.title}</h1>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)' }}>
                <Calendar size={14} /> {fmt(event.date)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)' }}>
                <MapPin size={14} /> {event.venue.name}, {event.venue.city}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)' }}>
                <Clock size={14} /> {event.time}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detail layout */}
      <div className="container">
        <div className="event-detail-layout">
          {/* Main */}
          <div className="event-detail-main">
            <div className="card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>About this Event</h2>
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.75 }}>{event.description}</p>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 16 }}>Venue Details</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ background: 'var(--orange-subtle)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                  <MapPin size={22} color="var(--orange)" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{event.venue.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{event.venue.address}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {event.tags.map(t => (
                <span key={t} className="badge badge-gray">
                  <Tag size={10} /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="event-detail-sidebar">
            <div className="ticket-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: '1.0625rem' }}>Select Tickets</h3>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => navigator.share?.({ title: event.title, url: window.location.href })} title="Share">
                  <Share2 size={16} />
                </button>
              </div>

              {event.ticketTypes.map(tt => (
                <div
                  key={tt._id}
                  className={`ticket-type ${selected?._id === tt._id ? 'selected' : ''}`}
                  onClick={() => { setSelected(tt); setQty(1) }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div className="ticket-type-name">{tt.name}</div>
                      <div className="ticket-type-price">{tt.price === 0 ? 'FREE' : `₹${tt.price.toLocaleString('en-IN')}`}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className={`badge ${tt.totalSeats - tt.bookedSeats < 50 ? 'badge-red' : 'badge-green'}`} style={{ fontSize: '0.7rem' }}>
                        {tt.totalSeats - tt.bookedSeats} left
                      </div>
                    </div>
                  </div>
                  {/* Fill bar */}
                  <div style={{ marginTop: 10, height: 4, background: 'var(--border-solid)', borderRadius: 8 }}>
                    <div style={{ height: '100%', width: `${Math.round((tt.bookedSeats/tt.totalSeats)*100)}%`, background: 'var(--gradient-brand)', borderRadius: 8 }} />
                  </div>
                  <div className="ticket-type-avail">{Math.round((tt.bookedSeats/tt.totalSeats)*100)}% filled</div>
                </div>
              ))}

              {/* Quantity */}
              {selected && avail > 0 && (
                <div style={{ margin: '20px 0' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 10 }}>Quantity</p>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                    <span className="qty-count">{qty}</span>
                    <button className="qty-btn" onClick={() => setQty(q => Math.min(10, avail, q + 1))}>+</button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>max 10</span>
                  </div>
                </div>
              )}

              {/* Total */}
              {selected && (
                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>{selected.name} × {qty}</span>
                    <span>₹{(selected.price * qty).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.0625rem' }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--gold)' }}>
                      {selected.price === 0 ? 'FREE' : `₹${(selected.price * qty).toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={() => setModal(true)}
                disabled={!selected || avail === 0}
              >
                {avail === 0 ? 'Sold Out' : '🎟️ Book Now'}
              </button>

              {!user && (
                <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-subtle)', marginTop: 10 }}>
                  <Link to="/login" style={{ color: 'var(--orange)' }}>Log in</Link> to complete booking
                </p>
              )}

              {/* Organizer */}
              <div style={{ borderTop: '1px solid var(--border-solid)', marginTop: 20, paddingTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}>
                  {initials(event.organizer.name)}
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Organized by</p>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{event.organizer.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking confirmation modal */}
      {modal && (
        <Modal title={booked ? 'Booking Confirmed! 🎉' : 'Confirm Your Booking'} onClose={() => !booking && setModal(false)}>
          {booked ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎟️</div>
              <h3 style={{ marginBottom: 8 }}>You're all set!</h3>
              <p style={{ color: 'var(--text-muted)' }}>Your booking is confirmed. Check your dashboard for QR code details.</p>
              <Link to="/dashboard" className="btn btn-primary btn-full" style={{ marginTop: 20 }}>View My Bookings</Link>
            </div>
          ) : (
            <div>
              <div className="card" style={{ marginBottom: 20, background: 'var(--bg-surface)', border: 'none' }}>
                <h4 style={{ fontWeight: 700, marginBottom: 6 }}>{event.title}</h4>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 4 }}>📅 {fmt(event.date)} · {event.time}</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>📍 {event.venue.name}, {event.venue.city}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Ticket Type', value: selected.name },
                  { label: 'Quantity',    value: qty },
                  { label: 'Total',       value: selected.price === 0 ? 'FREE' : `₹${(selected.price * qty).toLocaleString('en-IN')}`, highlight: true },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{r.label}</span>
                    <span style={{ fontWeight: r.highlight ? 700 : 500, color: r.highlight ? 'var(--gold)' : 'var(--text-primary)' }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-full btn-lg" onClick={handleBook} disabled={booking}>
                {booking ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
