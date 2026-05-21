import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, MapPin, Users, Edit3, Trash2, TrendingUp, DollarSign } from 'lucide-react'
import Modal from '../components/ui/Modal.jsx'
import Loader from '../components/ui/Loader.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import {
  getOrganizerEvents,
  getOrganizerStats,
  createEvent,
  deleteEvent,
} from '../services/api.js'

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const BLANK = {
  title: '', category: 'music', date: '', time: '', venue: '', city: '',
  description: '', bannerUrl: '',
  ticketTypes: [{ name: 'General', price: 500, totalSeats: 100 }],
}

export default function OrganizerPanel() {
  const { user } = useAuth()
  const toast    = useToast()
  const [events,  setEvents]  = useState([])
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(BLANK)
  const [saving,  setSaving]  = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [evs, st] = await Promise.all([getOrganizerEvents(), getOrganizerStats()])
      setEvents(evs)
      setStats(st)
    } catch (err) {
      toast.error('Failed to load your events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setTicket = (i, k, v) => setForm(f => {
    const tts = [...f.ticketTypes]
    tts[i] = { ...tts[i], [k]: k === 'name' ? v : Number(v) }
    return { ...f, ticketTypes: tts }
  })

  const addTicketType = () => {
    setForm(f => ({
      ...f,
      ticketTypes: [...f.ticketTypes, { name: 'VIP', price: 1500, totalSeats: 50 }]
    }))
  }

  const removeTicketType = (i) => {
    setForm(f => ({ ...f, ticketTypes: f.ticketTypes.filter((_, idx) => idx !== i) }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title || !form.date || !form.city) { toast.error('Fill required fields'); return }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        category: form.category,
        description: form.description || 'Event description coming soon.',
        date: form.date,
        time: form.time || '06:00 PM',
        venue: {
          name: form.venue || form.city,
          city: form.city,
          address: form.city,
        },
        bannerUrl: form.bannerUrl || undefined,
        tags: [],
        ticketTypes: form.ticketTypes.map(t => ({
          name: t.name,
          price: Number(t.price),
          totalSeats: Number(t.totalSeats),
          bookedSeats: 0,
        })),
      }
      await createEvent(payload)
      toast.success('Event created! Pending admin approval.')
      setModal(false)
      setForm(BLANK)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return
    try {
      await deleteEvent(id)
      toast.success('Event deleted')
      setEvents(prev => prev.filter(e => e._id !== id))
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event')
    }
  }

  const statCards = [
    { label: 'Total Events',     value: stats?.totalEvents ?? '—',        icon: '🎪', color: 'var(--orange)' },
    { label: 'Total Bookings',   value: stats?.totalBookings ?? '—',      icon: '🎟️', color: 'var(--gold)' },
    { label: 'Live Events',      value: stats?.liveEvents ?? '—',         icon: '✅', color: 'var(--success)' },
    { label: 'Pending Approval', value: stats?.pendingEvents ?? '—',      icon: '⏳', color: 'var(--warning,#F59E0B)' },
    { label: 'Revenue',          value: stats ? `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}` : '—', icon: '💰', color: 'var(--teal,#06B6D4)' },
  ]

  if (loading) return <Loader page text="Loading your organizer panel..." />

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 className="page-title">Organizer Panel</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage your events and track performance</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={18} /> Create Event
          </button>
        </div>

        {/* Stats */}
        <div className="dashboard-stats" style={{ marginBottom: 40 }}>
          {statCards.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}18`, marginBottom: 12 }}>
                <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
              </div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Events list */}
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>Your Events</h2>
        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎪</div>
            <h3>No events yet</h3>
            <p>Create your first event and start selling tickets!</p>
            <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Create Event</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map(e => {
              const totalBooked = e.ticketTypes.reduce((a, t) => a + t.bookedSeats, 0)
              return (
                <div key={e._id} className="organizer-event-row">
                  <img src={e.bannerUrl} alt={e.title} className="organizer-event-img" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{e.title}</h3>
                      <span className={`badge ${e.status === 'approved' ? 'badge-green' : e.status === 'pending' ? 'badge-gold' : 'badge-red'}`}>{e.status}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--text-muted)' }}><Calendar size={13} /> {fmt(e.date)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--text-muted)' }}><MapPin   size={13} /> {e.venue?.city}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem', color: 'var(--text-muted)' }}><Users    size={13} /> {totalBooked} booked</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link to={`/events/${e._id}`} className="btn btn-ghost btn-sm btn-icon" title="View event"><Edit3 size={15} /></Link>
                    <button className="btn btn-sm" onClick={() => handleDelete(e._id)}
                      style={{ background: 'var(--error-subtle)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)' }} title="Delete">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {modal && (
        <Modal title="Create New Event" onClose={() => { setModal(false); setForm(BLANK) }} maxWidth="660px">
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input className="form-input" placeholder="e.g. Coldplay Live in Mumbai" value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {['music','sports','technology','food','arts','business','comedy','film'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">City *</label>
                <input className="form-input" placeholder="Mumbai" value={form.city} onChange={e => set('city', e.target.value)} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Time</label>
                <input className="form-input" type="time" value={form.time} onChange={e => set('time', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Venue Name</label>
              <input className="form-input" placeholder="e.g. DY Patil Stadium" value={form.venue} onChange={e => set('venue', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Describe your event..." value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Banner Image URL</label>
              <input className="form-input" placeholder="https://..." value={form.bannerUrl} onChange={e => set('bannerUrl', e.target.value)} />
            </div>

            {/* Ticket Types */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label className="form-label" style={{ margin: 0 }}>Ticket Types *</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addTicketType}><Plus size={14} /> Add Type</button>
              </div>
              {form.ticketTypes.map((tt, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input className="form-input" placeholder="Type name" value={tt.name} onChange={e => setTicket(i, 'name', e.target.value)} />
                  <input className="form-input" type="number" placeholder="Price ₹" min="0" value={tt.price} onChange={e => setTicket(i, 'price', e.target.value)} />
                  <input className="form-input" type="number" placeholder="Seats" min="1" value={tt.totalSeats} onChange={e => setTicket(i, 'totalSeats', e.target.value)} />
                  {form.ticketTypes.length > 1 && (
                    <button type="button" className="btn btn-sm" style={{ background: 'var(--error-subtle)', color: 'var(--error)', border: 'none' }} onClick={() => removeTicketType(i)}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating...' : <><Plus size={16} /> Create Event</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
