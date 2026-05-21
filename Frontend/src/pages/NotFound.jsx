import { Link } from 'react-router-dom'
import { ArrowLeft, Flame } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="not-found">
      <div>
        <div className="not-found-code">404</div>
        <h2>Page Not Found</h2>
        <p>Looks like this event has left the building. The page you're looking for doesn't exist.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary btn-lg">
            <Flame size={18} /> Back to Home
          </Link>
          <Link to="/events" className="btn btn-outline btn-lg">
            <ArrowLeft size={18} /> Browse Events
          </Link>
        </div>
      </div>
    </div>
  )
}
