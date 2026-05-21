import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'

const fmt = (dateStr) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const initials = (name) => name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export default function EventCard({ event }) {
  const navigate = useNavigate()
  const minTicket = event.ticketTypes?.reduce((m, t) => t.price < m.price ? t : m, event.ticketTypes[0])

  return (
    <div className="event-card" onClick={() => navigate(`/events/${event._id}`)}>
      <div className="event-card-image">
        <img src={event.bannerUrl} alt={event.title} loading="lazy" />
        <div className="event-card-badges">
          <span className="badge badge-orange" style={{ textTransform: 'capitalize' }}>{event.category}</span>
          <span className="badge badge-gray" style={{ background: 'rgba(6,11,24,0.75)', color: '#fff', border: 'none', backdropFilter: 'blur(6px)' }}>
            <Calendar size={10} /> {fmt(event.date)}
          </span>
        </div>
      </div>
      <div className="event-card-body">
        <h3 className="event-card-title">{event.title}</h3>
        <div className="event-card-meta">
          <div className="event-card-meta-row">
            <MapPin size={13} />
            <span>{event.venue.name}, {event.venue.city}</span>
          </div>
          <div className="event-card-meta-row">
            <Calendar size={13} />
            <span>{event.time} onwards</span>
          </div>
        </div>
        <div className="event-card-footer">
          <div className="event-card-organizer">
            <div className="event-card-organizer-avatar">{initials(event.organizer.name)}</div>
            <span className="event-card-organizer-name">{event.organizer.name}</span>
          </div>
          {event.minPrice === 0
            ? <span className="event-card-price free">FREE</span>
            : <span className="event-card-price">From ₹{event.minPrice?.toLocaleString('en-IN')}</span>
          }
        </div>
      </div>
    </div>
  )
}
