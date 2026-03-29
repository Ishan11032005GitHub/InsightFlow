import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../App'
import { useData } from '../context/DataContext'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
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
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="url(#sideGrad)" strokeWidth="2" fill="none"/>
              <path d="M14 10L20 13V19L14 22L8 19V13L14 10Z" fill="url(#sideGrad)"/>
              <defs>
                <linearGradient id="sideGrad" x1="2" y1="2" x2="26" y2="26">
                  <stop stopColor="#6c5ce7"/>
                  <stop offset="1" stopColor="#00d2ff"/>
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

// Smart Upload Zone
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

// Stat Card
function StatCard({ icon, label, value, change, color, delay }) {
  return (
    <motion.div
      className="stat-card-dash glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="stat-icon-wrap" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-label">{label}</span>
        <span className="stat-value-dash">{value}</span>
        {change && (
          <span className={`stat-change ${change > 0 ? 'positive' : 'negative'}`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
    </motion.div>
  )
}

// Recent Activity Item
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

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const location = useLocation()
  const { reports, uploadedData } = useData()

  // Calculate dynamic stats
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
        <div className="page-enter">
          {/* Header */}
          <div className="dash-header">
            <div>
              <h1>Dashboard</h1>
              <p>Welcome back! Here's your analytics overview.</p>
            </div>
            <div className="dash-header-actions">
              <button className="btn-outline" onClick={() => {}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Search
              </button>
            </div>
          </div>

          {/* Quick Stats */}
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

          {/* Main Grid */}
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
              <h3>Quick Actions</h3>
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

            {/* Recent Activity */}
            <motion.div
              className="dash-card glass-card activity-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <h3>Recent Activity</h3>
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
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity found.</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export { Sidebar }
