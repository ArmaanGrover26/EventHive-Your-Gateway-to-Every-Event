import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Ban, UserCheck, Trash2, RefreshCw } from 'lucide-react'
import Loader from '../components/ui/Loader.jsx'
import { useToast } from '../context/ToastContext.jsx'
import {
  getAdminStats,
  getAdminUsers,
  getAdminEvents,
  toggleBlockUser,
  updateEventStatus,
  adminDeleteEvent,
  adminDeleteUser,
} from '../services/api.js'

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function AdminPanel() {
  const toast = useToast()
  const [tab,     setTab]     = useState('overview')
  const [stats,   setStats]   = useState(null)
  const [users,   setUsers]   = useState([])
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [st, us, ev] = await Promise.all([getAdminStats(), getAdminUsers(), getAdminEvents()])
      setStats(st)
      setUsers(us)
      setEvents(ev)
    } catch (err) {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleToggleBlock = async (user) => {
    setActionId(user._id)
    try {
      const res = await toggleBlockUser(user._id)
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isBlocked: !u.isBlocked } : u))
      toast.success(res.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user')
    } finally {
      setActionId(null)
    }
  }

  const handleEventStatus = async (eventId, status) => {
    setActionId(eventId)
    try {
      const res = await updateEventStatus(eventId, status)
      setEvents(prev => prev.map(e => e._id === eventId ? { ...e, status } : e))
      toast.success(res.message)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update event')
    } finally {
      setActionId(null)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Permanently delete this event?')) return
    setActionId(eventId)
    try {
      await adminDeleteEvent(eventId)
      setEvents(prev => prev.filter(e => e._id !== eventId))
      toast.success('Event deleted')
    } catch (err) {
      toast.error('Failed to delete event')
    } finally {
      setActionId(null)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user?')) return
    setActionId(userId)
    try {
      await adminDeleteUser(userId)
      setUsers(prev => prev.filter(u => u._id !== userId))
      toast.success('User deleted')
    } catch (err) {
      toast.error('Failed to delete user')
    } finally {
      setActionId(null)
    }
  }

  const STAT_CARDS = stats ? [
    { label: 'Total Users',    value: stats.totalUsers.toLocaleString('en-IN'),    icon: '👥', color: 'var(--orange)' },
    { label: 'Total Events',   value: stats.totalEvents.toLocaleString('en-IN'),   icon: '🎪', color: 'var(--gold)'   },
    { label: 'Total Bookings', value: stats.totalBookings.toLocaleString('en-IN'), icon: '🎟️', color: 'var(--success)' },
    { label: 'Revenue',        value: `₹${((stats.totalRevenue || 0) / 100000).toFixed(1)}L`, icon: '💰', color: 'var(--teal,#06B6D4)' },
  ] : []

  const pendingEvents = events.filter(e => e.status === 'pending')

  const TABS = [
    { key: 'overview', label: 'Overview'                          },
    { key: 'users',    label: `Users (${users.length})`           },
    { key: 'events',   label: `Events (${events.length})`         },
    { key: 'pending',  label: `Pending (${pendingEvents.length})` },
  ]

  if (loading) return <Loader page text="Loading admin panel..." />

  return (
    <div className="dashboard-page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 className="page-title">Admin Panel</h1>
            <p style={{ color: 'var(--text-muted)' }}>Platform overview and management</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchAll} title="Refresh data">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`admin-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <>
            <div className="dashboard-stats" style={{ marginBottom: 40 }}>
              {STAT_CARDS.map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-icon" style={{ background: `${s.color}15`, marginBottom: 12 }}>
                    <span style={{ fontSize: '1.25rem' }}>{s.icon}</span>
                  </div>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {pendingEvents.length > 0 && (
              <>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 16, color: 'var(--warning,#F59E0B)' }}>
                  ⏳ Pending Approval ({pendingEvents.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 40 }}>
                  {pendingEvents.map(e => (
                    <div key={e._id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-solid)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', flexWrap: 'wrap' }}>
                      <img src={e.bannerUrl} alt="" style={{ width: 60, height: 60, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <p style={{ fontWeight: 700 }}>{e.title}</p>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{e.venue?.city} · {fmt(e.date)} · by {e.organizer?.name}</p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)' }}
                          onClick={() => handleEventStatus(e._id, 'approved')}
                          disabled={actionId === e._id}
                        >
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'var(--error-subtle)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)' }}
                          onClick={() => handleEventStatus(e._id, 'rejected')}
                          disabled={actionId === e._id}
                        >
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {pendingEvents.length === 0 && (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="empty-state-icon">✅</div>
                <h3>All caught up!</h3>
                <p>No events pending approval right now.</p>
              </div>
            )}
          </>
        )}

        {/* ── Users ── */}
        {tab === 'users' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th><th>Role</th><th>Bookings</th><th>Joined</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {u.name?.split(' ').map(w => w[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600 }}>{u.name}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-orange' : u.role === 'organizer' ? 'badge-teal badge-gold' : 'badge-gray'}`}>{u.role}</span></td>
                    <td style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{u.bookingCount ?? 0}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{fmt(u.joinedAt || u.createdAt)}</td>
                    <td><span className={`badge ${u.isBlocked ? 'badge-red' : 'badge-green'}`}>{u.isBlocked ? 'Blocked' : 'Active'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-sm"
                          style={{ background: u.isBlocked ? 'var(--success-subtle)' : 'var(--error-subtle)', color: u.isBlocked ? 'var(--success)' : 'var(--error)', border: `1px solid ${u.isBlocked ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}` }}
                          onClick={() => handleToggleBlock(u)}
                          disabled={u.role === 'admin' || actionId === u._id}
                        >
                          {u.isBlocked ? <><UserCheck size={13} /> Unblock</> : <><Ban size={13} /> Block</>}
                        </button>
                        {u.role !== 'admin' && (
                          <button
                            className="btn btn-sm"
                            style={{ background: 'var(--error-subtle)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)' }}
                            onClick={() => handleDeleteUser(u._id)}
                            disabled={actionId === u._id}
                            title="Delete user"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="empty-state"><div className="empty-state-icon">👥</div><h3>No users yet</h3></div>
            )}
          </div>
        )}

        {/* ── All Events ── */}
        {tab === 'events' && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Event</th><th>Category</th><th>Date</th><th>Organizer</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={e.bannerUrl} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.title}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-orange" style={{ textTransform: 'capitalize' }}>{e.category}</span></td>
                    <td style={{ color: 'var(--text-muted)' }}>{fmt(e.date)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{e.organizer?.name}</td>
                    <td><span className={`badge ${e.status === 'approved' ? 'badge-green' : e.status === 'pending' ? 'badge-gold' : 'badge-red'}`}>{e.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {e.status === 'pending' && (
                          <>
                            <button className="btn btn-sm" style={{ background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)' }} onClick={() => handleEventStatus(e._id, 'approved')} disabled={actionId === e._id}>
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button className="btn btn-sm" style={{ background: 'var(--error-subtle)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)' }} onClick={() => handleEventStatus(e._id, 'rejected')} disabled={actionId === e._id}>
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {e.status === 'approved' && (
                          <button className="btn btn-sm" style={{ background: 'var(--error-subtle)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)' }} onClick={() => handleEventStatus(e._id, 'rejected')} disabled={actionId === e._id}>
                            <XCircle size={13} /> Unpublish
                          </button>
                        )}
                        {e.status === 'rejected' && (
                          <button className="btn btn-sm" style={{ background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)' }} onClick={() => handleEventStatus(e._id, 'approved')} disabled={actionId === e._id}>
                            <CheckCircle size={13} /> Approve
                          </button>
                        )}
                        <button className="btn btn-sm" style={{ background: 'var(--error-subtle)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)' }} onClick={() => handleDeleteEvent(e._id)} disabled={actionId === e._id} title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {events.length === 0 && (
              <div className="empty-state"><div className="empty-state-icon">🎪</div><h3>No events yet</h3></div>
            )}
          </div>
        )}

        {/* ── Pending Tab ── */}
        {tab === 'pending' && (
          <>
            {pendingEvents.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <h3>No pending events</h3>
                <p>All events have been reviewed.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingEvents.map(e => (
                  <div key={e._id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--bg-card)', border: '1px solid var(--border-solid)', borderRadius: 'var(--radius-lg)', padding: '16px', flexWrap: 'wrap' }}>
                    <img src={e.bannerUrl} alt="" style={{ width: 80, height: 60, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>{e.title}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                        📍 {e.venue?.city} · 📅 {fmt(e.date)} · 🎫 {e.ticketTypes?.length} ticket type(s)
                      </p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-subtle)' }}>
                        Organizer: <strong>{e.organizer?.name}</strong> ({e.organizer?.email})
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button className="btn btn-sm" style={{ background: 'var(--success-subtle)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.25)' }} onClick={() => handleEventStatus(e._id, 'approved')} disabled={actionId === e._id}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button className="btn btn-sm" style={{ background: 'var(--error-subtle)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.25)' }} onClick={() => handleEventStatus(e._id, 'rejected')} disabled={actionId === e._id}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
