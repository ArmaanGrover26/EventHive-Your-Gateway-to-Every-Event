import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react'
import EventCard from '../components/ui/EventCard.jsx'
import Loader from '../components/ui/Loader.jsx'
import { getEvents, getCategories } from '../services/api.js'

const SORT_OPTIONS = [
  { value: 'latest',     label: 'Latest First'      },
  { value: 'date',       label: 'Upcoming First'    },
  { value: 'price_asc',  label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
]

export default function Events() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [events,     setEvents]     = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [total,      setTotal]      = useState(0)
  const [pages,      setPages]      = useState(1)

  const category = searchParams.get('category') || 'all'
  const search   = searchParams.get('search')   || ''
  const sort     = searchParams.get('sort')     || 'latest'
  const page     = Number(searchParams.get('page')) || 1

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams)
    if (val) next.set(key, val); else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  // Fetch categories once
  useEffect(() => {
    getCategories().then(setCategories).catch(console.error)
  }, [])

  const fetchEvents = useCallback(() => {
    setLoading(true)
    getEvents({ category: category === 'all' ? '' : category, search, sort, page })
      .then(data => { setEvents(data.events); setTotal(data.total); setPages(data.pages) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, search, sort, page])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="container">
          <h1>All Events</h1>
          <p>Explore {total} events happening across India</p>
        </div>
      </div>

      <div className="container section-sm">
        {/* Search */}
        <div className="search-bar" style={{ marginBottom: 20 }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search events, cities, artists..."
            value={search}
            onChange={e => setParam('search', e.target.value)}
          />
        </div>

        {/* Filters row */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 24 }}>
          <div className="filter-chips">
            <button
              className={`filter-chip ${category === 'all' ? 'active' : ''}`}
              onClick={() => setParam('category', '')}
            >All</button>
            {categories.map(c => (
              <button
                key={c.id}
                className={`filter-chip ${category === c.id ? 'active' : ''}`}
                onClick={() => setParam('category', c.id)}
              >{c.icon} {c.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SlidersHorizontal size={16} color="var(--text-subtle)" />
            <select
              className="sort-select"
              value={sort}
              onChange={e => setParam('sort', e.target.value)}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Results info */}
        <p className="results-info" style={{ marginBottom: 24 }}>
          {loading ? 'Searching...' : `Showing ${events.length} of ${total} events`}
        </p>

        {/* Events grid */}
        {loading ? (
          <Loader page text="Loading events..." />
        ) : events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎭</div>
            <h3>No events found</h3>
            <p>Try adjusting your search or filters to find events near you.</p>
            <button className="btn btn-outline" onClick={() => setSearchParams({})}>Clear Filters</button>
          </div>
        ) : (
          <div className="events-grid">
            {events.map(e => <EventCard key={e._id} event={e} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page <= 1} onClick={() => setParam('page', page - 1)}>
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                className={`page-btn ${p === page ? 'active' : ''}`}
                onClick={() => setParam('page', p)}
              >{p}</button>
            ))}
            <button className="page-btn" disabled={page >= pages} onClick={() => setParam('page', page + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
