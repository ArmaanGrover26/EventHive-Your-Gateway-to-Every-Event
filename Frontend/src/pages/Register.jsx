import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Flame } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const ROLES = [
  { value: 'attendee',  label: '🎟️ Attendee',  desc: 'Discover & book events'    },
  { value: 'organizer', label: '🎪 Organizer', desc: 'Create & manage events'     },
]

export default function Register() {
  const { register } = useAuth()
  const toast        = useToast()
  const navigate     = useNavigate()

  const [form,    setForm]    = useState({ name: '', email: '', password: '', role: 'attendee' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name    || form.name.trim().length < 2) e.name     = 'Full name is required (min 2 chars)'
    if (!form.email)                                   e.email    = 'Email is required'
    if (!form.password || form.password.length < 6)   e.password = 'Password must be at least 6 characters'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const user = await register(form)
      toast.success(`Account created! Welcome to EventHive, ${user.name.split(' ')[0]}! 🔥`)
      navigate(user.role === 'organizer' ? '/organizer' : '/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed'
      toast.error(msg)
      if (msg.toLowerCase().includes('email')) {
        setErrors({ email: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <Link to="/" className="nav-brand">
            <Flame size={22} color="var(--orange)" />
            <span className="nav-brand-text">EventHive</span>
          </Link>
        </div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Join thousands of people discovering the best events</p>

        {/* Role selection */}
        <div style={{ marginBottom: 20 }}>
          <p className="form-label" style={{ marginBottom: 8 }}>I want to…</p>
          <div className="role-tabs">
            {ROLES.map(r => (
              <button
                key={r.value}
                type="button"
                className={`role-tab ${form.role === r.value ? 'active' : ''}`}
                onClick={() => set('role', r.value)}
              >
                <div>{r.label}</div>
                <div style={{ fontSize: '0.7rem', marginTop: 2, opacity: 0.75 }}>{r.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full name</label>
            <div className="input-icon-wrap">
              <User size={16} className="input-icon" />
              <input id="reg-name" type="text" className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="Priya Sharma" value={form.name} onChange={e => set('name', e.target.value)} autoComplete="name" />
            </div>
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email address</label>
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input id="reg-email" type="email" className={`form-input ${errors.email ? 'error' : ''}`}
                placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
            </div>
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="input-icon-wrap" style={{ position: 'relative' }}>
              <Lock size={16} className="input-icon" />
              <input id="reg-password" type={showPwd ? 'text' : 'password'}
                className={`form-input ${errors.password ? 'error' : ''}`}
                placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)}
                style={{ paddingRight: 44 }} autoComplete="new-password" />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer' }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Creating account...' : '🔥 Create Account'}
          </button>
        </form>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textAlign: 'center', marginTop: 16 }}>
          By signing up you agree to our <a href="#" style={{ color: 'var(--orange)' }}>Terms</a> and <a href="#" style={{ color: 'var(--orange)' }}>Privacy Policy</a>
        </p>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
