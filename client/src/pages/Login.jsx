import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../App'
import { useData } from '../context/DataContext'
import toast from 'react-hot-toast'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { addActivity } = useData()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setIsLoading(true)
    try {
      const resp = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await resp.json()
      if (!resp.ok) {
        toast.error(data.error || 'Login failed')
        setIsLoading(false)
        return
      }
      if (data.token) localStorage.setItem('insightflow_token', data.token)
      login({ email: data.user.email, name: data.user.name, id: data.user.id })
      addActivity('login', `Logged in as ${data.user.name}`, data.user.email)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch {
      // Offline fallback
      login({ email, name: email.split('@')[0], id: Date.now() })
      addActivity('login', `Logged in as ${email.split('@')[0]}`, `${email} (offline mode)`)
      toast.success('Welcome (offline mode)!')
      navigate('/dashboard')
    }
    setIsLoading(false)
  }

  return (
    <div className="auth-page">
      {/* Background Effects */}
      <div className="auth-bg-grid" />
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-card glass-card">
          {/* Logo */}
          <Link to="/" className="auth-logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L29.8564 10V26L16 34L2.14359 26V10L16 2Z" stroke="url(#authGrad_new)" strokeWidth="3" strokeLinejoin="round" fill="none" />
                <path d="M16 8L22.9282 12V20L16 24L9.0718 20V12L16 8Z" fill="url(#authGrad_pulse)" fillOpacity="0.6">
                  <animate attributeName="fill-opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
                </path>
                <circle cx="16" cy="16" r="3" fill="#fff">
                  <animate attributeName="r" values="2;3.5;2" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <defs>
                  <linearGradient id="authGrad_new" x1="2" y1="2" x2="30" y2="30">
                    <stop stopColor="#6c5ce7"/><stop offset="1" stopColor="#00d2ff"/>
                  </linearGradient>
                  <linearGradient id="authGrad_pulse" x1="16" y1="8" x2="16" y2="24">
                    <stop stopColor="#a29bfe"/><stop offset="1" stopColor="#6c5ce7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text">InsightFlow</span>
          </Link>

          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Sign in to continue to your dashboard</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className={`auth-submit ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
              {isLoading ? (
                <div className="loading-spinner" />
              ) : (
                <>
                  Sign In
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
