import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eh_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('eh_token')
      localStorage.removeItem('eh_user')
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login:    (data) => api.post('/auth/login',    data).then((r) => r.data),
  me:       ()     => api.get('/auth/me').then((r) => r.data),
}

// ── Events ────────────────────────────────────────────────────
export const getEvents = async ({ category, search, sort, page = 1, limit = 9 } = {}) => {
  const params = { page, limit }
  if (category && category !== 'all') params.category = category
  if (search) params.search = search
  if (sort)   params.sort   = sort
  const { data } = await api.get('/events', { params })
  return data
}

export const getEventById = async (id) => {
  const { data } = await api.get(`/events/${id}`)
  return data
}

export const getFeaturedEvents = async () => {
  const { data } = await api.get('/events/featured')
  return data
}

export const getCategories = async () => {
  const { data } = await api.get('/events/categories')
  return data
}

export const createEvent = async (eventData) => {
  const { data } = await api.post('/events', eventData)
  return data
}

export const updateEvent = async (id, eventData) => {
  const { data } = await api.put(`/events/${id}`, eventData)
  return data
}

export const deleteEvent = async (id) => {
  const { data } = await api.delete(`/events/${id}`)
  return data
}

// ── Bookings ──────────────────────────────────────────────────
export const getMyBookings = async () => {
  const { data } = await api.get('/bookings/my')
  return data
}

export const createBooking = async ({ eventId, ticketTypeId, quantity }) => {
  const { data } = await api.post('/bookings', { eventId, ticketTypeId, quantity })
  return data
}

export const cancelBooking = async (bookingId) => {
  const { data } = await api.patch(`/bookings/${bookingId}/cancel`)
  return data
}

// ── Admin ─────────────────────────────────────────────────────
export const getAdminStats = async () => {
  const { data } = await api.get('/admin/stats')
  return data
}

export const getAdminUsers = async () => {
  const { data } = await api.get('/admin/users')
  return data
}

export const getAdminEvents = async () => {
  const { data } = await api.get('/admin/events')
  return data
}

export const toggleBlockUser = async (userId) => {
  const { data } = await api.patch(`/admin/users/${userId}/block`)
  return data
}

export const updateEventStatus = async (eventId, status) => {
  const { data } = await api.patch(`/admin/events/${eventId}/status`, { status })
  return data
}

export const adminDeleteEvent = async (eventId) => {
  const { data } = await api.delete(`/admin/events/${eventId}`)
  return data
}

export const adminDeleteUser = async (userId) => {
  const { data } = await api.delete(`/admin/users/${userId}`)
  return data
}

// ── Organizer ─────────────────────────────────────────────────
export const getOrganizerEvents = async () => {
  const { data } = await api.get('/organizer/events')
  return data
}

export const getOrganizerStats = async () => {
  const { data } = await api.get('/organizer/stats')
  return data
}

export default api
