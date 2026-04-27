import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../App'
import { useData } from '../context/DataContext'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import ThemeToggle from '../components/common/ThemeToggle'
import './Dashboard.css'

// Sidebar Navigation Component
function Sidebar({ collapsed, setCollapsed, currentPath }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="9" rx="1"/>
          <rect x="14" y="3" width="7" height="5" rx="1"/>
          <rect x="14" y="12" width="7" height="9" rx="1"/>
          <rect x="3" y="16" width="7" height="5" rx="1"/>
        </svg>
      ),
    },
    {
      path: '/upload',
      label: 'Upload & Analyze',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      ),
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      ),
    },
    {
      path: '/chat',
      label: 'Chat with PDF',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      path: '/ai-chat',
      label: 'AI Chat',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      ),
    },
    {
      path: '/visualization',
      label: 'Visualizations',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
    },
    {
      path: '/data-cleaning',
      label: 'Data Cleaning',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h10M4 17h6"/>
        </svg>
      ),
    },
    {
      path: '/compare',
      label: 'Compare Datasets',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="8" height="16" rx="1"/><rect x="14" y="4" width="8" height="16" rx="1"/>
          <path d="M10 12h4"/>
        </svg>
      ),
    },
    {
      path: '/history',
      label: 'Activity History',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
  ]

  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-logo">
          <div className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
              <path d="M16 2L29.8564 10V26L16 34L2.14359 26V10L16 2Z" stroke="url(#sideGrad_new)" strokeWidth="3" strokeLinejoin="round" fill="none" />
              <path d="M16 8L22.9282 12V20L16 24L9.0718 20V12L16 8Z" fill="url(#sideGrad_pulse)" fillOpacity="0.6">
                <animate attributeName="fill-opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
              </path>
              <circle cx="16" cy="16" r="3" fill="#fff">
                <animate attributeName="r" values="2;3.5;2" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <defs>
                <linearGradient id="sideGrad_new" x1="2" y1="2" x2="30" y2="30">
                  <stop stopColor="#6c5ce7"/><stop offset="1" stopColor="#00d2ff"/>
                </linearGradient>
                <linearGradient id="sideGrad_pulse" x1="16" y1="8" x2="16" y2="24">
                  <stop stopColor="#a29bfe"/><stop offset="1" stopColor="#6c5ce7"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          {!collapsed && <span className="logo-text">InsightFlow</span>}
        </Link>
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? (
              <path d="M9 18l6-6-6-6"/>
            ) : (
              <path d="M15 18l-6-6 6-6"/>
            )}
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
            {currentPath === item.path && (
              <motion.div className="nav-indicator" layoutId="navIndicator" />
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <ThemeToggle />
        {!collapsed && (
          <div className="user-info">
            <div className="user-avatar">
              {(user?.name || 'U')[0].toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-email">{user?.email || ''}</span>
            </div>
          </div>
        )}
        <button className="logout-btn" onClick={() => { logout(); navigate('/') }} title="Logout">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </motion.aside>
  )
}

// Smart Upload Zone — LOGIC UNCHANGED
function SmartUploadZone({ onFileAccepted }) {
  const navigate = useNavigate()
  
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return
    const file = acceptedFiles[0]
    const ext = file.name.split('.').pop().toLowerCase()
    
    if (['csv', 'xlsx', 'xls'].includes(ext)) {
      toast.success(`📊 CSV detected: "${file.name}" — Routing to Analytics`, { duration: 3000 })
      if (onFileAccepted) onFileAccepted(file, 'csv')
      setTimeout(() => navigate('/upload', { state: { file, type: 'csv' } }), 800)
    } else if (ext === 'pdf') {
      toast.success(`📄 PDF detected: "${file.name}" — Opening Chat`, { duration: 3000 })
      if (onFileAccepted) onFileAccepted(file, 'pdf')
      setTimeout(() => navigate('/chat', { state: { file, type: 'pdf' } }), 800)
    } else {
      toast.error(`Unsupported file type: .${ext}. Upload CSV, Excel, or PDF files.`)
    }
  }, [navigate, onFileAccepted])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
    },
  })

  return (
    <motion.div
      {...getRootProps()}
      className={`smart-upload-zone ${isDragActive ? 'dragging' : ''}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <input {...getInputProps()} />
      <div className="upload-zone-content">
        <div className="upload-icon-wrap">
          <motion.div
            className="upload-icon"
            animate={isDragActive ? { y: -10, scale: 1.1 } : { y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </motion.div>
          <div className="upload-orbit">
            <div className="orbit-dot csv" />
            <div className="orbit-dot pdf" />
          </div>
        </div>
        <h3>{isDragActive ? 'Drop your file here!' : 'Smart File Upload'}</h3>
        <p>
          {isDragActive
            ? 'Release to auto-detect and process'
            : 'Drop CSV → Analytics Pipeline • Drop PDF → AI Chat'
          }
        </p>
        <div className="upload-file-types">
          <span className="file-type csv">.CSV</span>
          <span className="file-type xlsx">.XLSX</span>
          <span className="file-type pdf">.PDF</span>
        </div>
      </div>
      <div className="upload-zone-border" />
    </motion.div>
  )
}

// Stat Card — Enhanced with sparkline + pulse
function StatCard({ icon, label, value, change, color, delay }) {
  const sparkData = useMemo(() => Array.from({ length: 7 }, () => Math.random() * 20 + 4), [])

  return (
    <motion.div
      className="stat-card-dash"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      style={{ '--card-color': color }}
    >
      <div className="stat-pulse" />
      <div className="stat-icon-wrap" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value-dash">{value}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {change && (
            <span className={`stat-change ${change > 0 ? 'positive' : 'negative'}`}>
              {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
            </span>
          )}
          <div className="stat-sparkline">
            {sparkData.map((h, i) => (
              <div key={i} className="spark-bar" style={{ height: h, background: `${color}60` }} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Recent Activity Item — UNCHANGED LOGIC
function ActivityItem({ icon, title, subtitle, time, color }) {
  return (
    <div className="activity-item">
      <div className="activity-icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="activity-info">
        <span className="activity-title">{title}</span>
        <span className="activity-subtitle">{subtitle}</span>
      </div>
      <span className="activity-time">{time}</span>
    </div>
  )
}

// Live Clock Hook
function useLiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60000)
    return () => clearInterval(id)
  }, [])
  return time.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ==========================================
// SEARCH COMMAND PALETTE (⌘K)
// ==========================================
function SearchPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const inputRef = React.useRef(null)

  const pages = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊', desc: 'Analytics overview & stats' },
    { label: 'Upload & Analyze', path: '/upload', icon: '📤', desc: 'Upload CSV/Excel files' },
    { label: 'Reports', path: '/reports', icon: '📄', desc: 'View generated reports' },
    { label: 'Chat with PDF', path: '/chat', icon: '💬', desc: 'AI-powered PDF Q&A' },
    { label: 'Visualizations', path: '/visualization', icon: '📈', desc: 'Interactive charts' },
    { label: 'Features', path: '/features', icon: '⭐', desc: 'Platform features' },
    { label: 'Pricing', path: '/pricing', icon: '💎', desc: 'Plans & pricing' },
    { label: 'Documentation', path: '/docs', icon: '📚', desc: 'Guides & docs' },
    { label: 'Contact', path: '/contact', icon: '📧', desc: 'Get in touch' },
  ]

  const filtered = query.trim()
    ? pages.filter(p => p.label.toLowerCase().includes(query.toLowerCase()) || p.desc.toLowerCase().includes(query.toLowerCase()))
    : pages

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onClose('toggle')
      }
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div className="search-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div
          className="search-palette"
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="search-input-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search pages, features, actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filtered.length > 0) {
                  navigate(filtered[0].path)
                  onClose()
                  setQuery('')
                }
              }}
            />
            <kbd onClick={onClose}>ESC</kbd>
          </div>
          <div className="search-results">
            {filtered.length === 0 ? (
              <div className="search-empty">No results for "{query}"</div>
            ) : (
              filtered.map((page, i) => (
                <button
                  key={page.path}
                  className="search-result-item"
                  onClick={() => { navigate(page.path); onClose(); setQuery('') }}
                >
                  <span className="search-result-icon">{page.icon}</span>
                  <div className="search-result-info">
                    <span className="search-result-label">{page.label}</span>
                    <span className="search-result-desc">{page.desc}</span>
                  </div>
                  <span className="search-result-go">↵</span>
                </button>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ==========================================
// NOTIFICATIONS PANEL
// ==========================================
function NotificationsPanel({ isOpen, onClose, anchorRef }) {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Analysis Complete', desc: 'Your CSV report "sales_data.csv" has been processed.', time: '2 min ago', read: false, icon: '✅' },
    { id: 2, title: 'New Feature Available', desc: 'Try our new multi-chart comparison view.', time: '1 hour ago', read: false, icon: '🚀' },
    { id: 3, title: 'Storage Alert', desc: 'You have used 72% of your storage quota.', time: '3 hours ago', read: true, icon: '💾' },
    { id: 4, title: 'PDF Indexed', desc: '"Q4_Report.pdf" is ready for chat.', time: 'Yesterday', read: true, icon: '📄' },
  ])

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} />
      <motion.div
        className="notif-panel"
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      >
        <div className="notif-header">
          <h4>Notifications {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}</h4>
          <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
        </div>
        <div className="notif-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${n.read ? 'read' : 'unread'}`}
              onClick={() => setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))}
            >
              <span className="notif-icon">{n.icon}</span>
              <div className="notif-info">
                <span className="notif-title">{n.title}</span>
                <span className="notif-desc">{n.desc}</span>
              </div>
              <span className="notif-time">{n.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  )
}

// ==========================================
// SETTINGS PANEL
// ==========================================
function SettingsPanel({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleDeleteAccount = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    // Clear all user data
    localStorage.clear()
    toast.success('Account deleted successfully')
    logout()
    onClose()
    navigate('/')
  }

  if (!isOpen) return null

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} />
      <motion.div
        className="settings-panel"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="settings-header">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.36 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Settings
          </h4>
          <button className="settings-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="settings-body">
          {/* Profile */}
          <div className="settings-section">
            <h5>Profile</h5>
            <div className="settings-profile">
              <div className="settings-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
              <div>
                <p className="settings-name">{user?.name || 'User'}</p>
                <p className="settings-email">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="settings-section danger-zone">
            <h5>Danger Zone</h5>
            <p className="danger-desc">Once you delete your account, all data will be permanently removed. This action cannot be undone.</p>
            <button className="settings-danger-btn" onClick={handleDeleteAccount}>
              {confirmDelete ? 'Click Again to Confirm' : 'Delete Account'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { reports, uploadedData } = useData()
  const liveTime = useLiveClock()

  // Panel states
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSearchClose = useCallback((action) => {
    if (action === 'toggle') setSearchOpen(prev => !prev)
    else setSearchOpen(false)
  }, [])

  // Calculate dynamic stats — LOGIC UNCHANGED
  const statsSummary = useMemo(() => {
    const totalFiles = reports.length
    const pdfChats = reports.filter(r => r.type === 'pdf').length
    const dataReports = reports.filter(r => r.type !== 'pdf').length
    const totalRows = reports.reduce((acc, r) => acc + (typeof r.rows === 'number' ? r.rows : 0), 0)
    
    return { totalFiles, pdfChats, dataReports, totalRows }
  }, [reports])

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        currentPath={location.pathname}
      />

      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* ======= Premium Top Bar ======= */}
        <div className="dash-topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <span>Home</span>
              <span className="sep">/</span>
              <span className="current">Dashboard</span>
            </div>
            <div className="topbar-search" onClick={() => setSearchOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search anything...
              <kbd>⌘K</kbd>
            </div>
          </div>
          <div className="topbar-right">
            <span className="topbar-datetime">{liveTime}</span>
            <button className="topbar-icon-btn" title="Notifications" onClick={() => { setNotifOpen(!notifOpen); setSettingsOpen(false) }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="topbar-notif-dot" />
            </button>
            <button className="topbar-icon-btn" title="Settings" onClick={() => { setSettingsOpen(!settingsOpen); setNotifOpen(false) }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.36 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            <button className="topbar-create-btn" onClick={() => navigate('/upload')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Analysis
            </button>
          </div>
        </div>

        {/* Overlay Panels */}
        <SearchPalette isOpen={searchOpen} onClose={handleSearchClose} />
        <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

        {/* ======= Dashboard Body ======= */}
        <div className="dash-body">
          {/* Header */}
          <motion.div className="dash-header" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div>
              <h1>Dashboard</h1>
              <p>Welcome back! Here's your analytics overview.</p>
            </div>
            <div className="dash-header-actions">
              <button className="btn-outline" onClick={() => navigate('/reports')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                View Reports
              </button>
            </div>
          </motion.div>

          {/* Quick Stats — DATA BINDING UNCHANGED */}
          <div className="stats-row">
            <StatCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>}
              label="Files Processed"
              value={statsSummary.totalFiles}
              change={12}
              color="#6c5ce7"
              delay={0}
            />
            <StatCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
              label="Data Reports"
              value={statsSummary.dataReports}
              change={23}
              color="#00d2ff"
              delay={0.1}
            />
            <StatCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
              label="PDF Chat Sessions"
              value={statsSummary.pdfChats}
              change={statsSummary.totalFiles > 0 ? 100 : 0}
              color="#f72585"
              delay={0.2}
            />
            <StatCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg>}
              label="Total Rows/Pages"
              value={statsSummary.totalRows.toLocaleString()}
              change={34}
              color="#00e676"
              delay={0.3}
            />
          </div>

          {/* Main Grid — LOGIC UNCHANGED */}
          <div className="dash-grid">
            {/* Smart Upload */}
            <motion.div
              className="dash-card upload-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <SmartUploadZone />
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              className="dash-card glass-card quick-actions-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <h3>Quick Actions <span className="card-header-badge">Shortcuts</span></h3>
              <div className="quick-actions">
                <Link to="/upload" className="quick-action csv-action">
                  <div className="qa-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Analyze CSV Data</h4>
                    <p>Generate reports & charts</p>
                  </div>
                </Link>
                <Link to="/chat" className="quick-action pdf-action">
                  <div className="qa-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h4>Chat with PDF</h4>
                    <p>Ask questions about documents</p>
                  </div>
                </Link>
                <Link to="/visualization" className="quick-action viz-action">
                  <div className="qa-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </div>
                  <div>
                    <h4>View Visualizations</h4>
                    <p>Interactive charts & insights</p>
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Recent Activity — DATA BINDING UNCHANGED */}
            <motion.div
              className="dash-card glass-card activity-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <h3>Recent Activity <span className="card-header-badge">Timeline</span></h3>
              <div className="activity-list">
                {reports.length > 0 ? (
                  reports.slice(0, 4).map((report) => {
                    const isPdf = report.type === 'pdf';
                    const icon = isPdf ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10"/>
                        <line x1="12" y1="20" x2="12" y2="4"/>
                        <line x1="6" y1="20" x2="6" y2="14"/>
                      </svg>
                    );
                    
                    return (
                      <ActivityItem
                        key={report.id}
                        icon={icon}
                        title={isPdf ? 'PDF Chat Session' : 'Report Generated'}
                        subtitle={report.file}
                        time={report.date}
                        color={isPdf ? '#f72585' : '#6c5ce7'}
                      />
                    );
                  })
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px' }}>No recent activity yet. Upload a file to get started!</p>
                )}
              </div>
            </motion.div>

            {/* Performance Snapshot — NEW UI SECTION */}
            <motion.div
              className="dash-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <h3>Performance <span className="card-header-badge">Live</span></h3>
              <div style={{ padding: '0 22px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Processing Speed', value: '< 50ms', icon: '⚡', color: '#00e676' },
                  { label: 'Accuracy Rate', value: '99.2%', icon: '🎯', color: '#6c5ce7' },
                  { label: 'Uptime SLA', value: '99.9%', icon: '🛡️', color: '#00d2ff' },
                  { label: 'Active Sessions', value: '1', icon: '👤', color: '#ffa726' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ======= Premium Extra Sections ======= */}
          <motion.div className="dash-extras-row" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }}>
            {/* AI Insights */}
            <div className="insights-card">
              <h3>🧠 AI Insights <span className="card-header-badge">Auto</span></h3>
              {[
                { icon: '📈', title: 'Trending Up', desc: 'File uploads increased 12% this week. Your team is becoming more data-driven.', bg: 'rgba(0,230,118,0.08)' },
                { icon: '💡', title: 'Recommendation', desc: 'Try the PDF Chat feature for quick document analysis instead of manual reading.', bg: 'rgba(108,92,231,0.08)' },
                { icon: '⚡', title: 'Performance Alert', desc: 'All systems operating at peak performance. Response times under 50ms.', bg: 'rgba(0,210,255,0.08)' },
              ].map((ins, i) => (
                <div key={i} className="insight-item">
                  <div className="insight-icon" style={{ background: ins.bg }}>{ins.icon}</div>
                  <div className="insight-text">
                    <strong>{ins.title}</strong>
                    <span>{ins.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* System Status */}
            <div className="system-card">
              <h3>🟢 System Status <span className="card-header-badge">Live</span></h3>
              {[
                { name: 'API Gateway', status: 'Online' },
                { name: 'AI Processing', status: 'Online' },
                { name: 'File Storage', status: 'Online' },
                { name: 'RAG Pipeline', status: 'Online' },
                { name: 'Report Engine', status: 'Online' },
              ].map((sys, i) => (
                <div key={i} className="system-item">
                  <div className="system-item-left">
                    <span className="system-dot online" />
                    {sys.name}
                  </div>
                  <span className="system-status-badge online">{sys.status}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

// Reusable Page Shell — gives every page the premium topbar + layout
function PageShell({ currentPath, breadcrumb, children, actions }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const navigate = useNavigate()
  const liveTime = useLiveClock()

  // Panel states
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handleSearchClose = useCallback((action) => {
    if (action === 'toggle') setSearchOpen(prev => !prev)
    else setSearchOpen(false)
  }, [])

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} currentPath={currentPath} />
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="dash-topbar">
          <div className="topbar-left">
            <div className="topbar-breadcrumb">
              <span>Home</span>
              <span className="sep">/</span>
              <span className="current">{breadcrumb}</span>
            </div>
            <div className="topbar-search" onClick={() => setSearchOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search anything...
              <kbd>⌘K</kbd>
            </div>
          </div>
          <div className="topbar-right">
            <span className="topbar-datetime">{liveTime}</span>
            <button className="topbar-icon-btn" title="Notifications" onClick={() => { setNotifOpen(!notifOpen); setSettingsOpen(false) }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="topbar-notif-dot" />
            </button>
            <button className="topbar-icon-btn" title="Settings" onClick={() => { setSettingsOpen(!settingsOpen); setNotifOpen(false) }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.36 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
            {actions || (
              <button className="topbar-create-btn" onClick={() => navigate('/upload')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New Analysis
              </button>
            )}
          </div>
        </div>

        {/* Overlay Panels */}
        <SearchPalette isOpen={searchOpen} onClose={handleSearchClose} />
        <NotificationsPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
        <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

        <div className="dash-body">
          {children}
        </div>
      </main>
    </div>
  )
}

export { Sidebar, PageShell }

