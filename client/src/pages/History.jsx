import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './Dashboard'
import { useData } from '../context/DataContext'
import './History.css'

const TYPE_CONFIG = {
  upload:        { label: 'Upload',        icon: '📤', color: '#6c5ce7' },
  pdf:           { label: 'PDF Chat',      icon: '📄', color: '#00b894' },
  'ai-chat':     { label: 'AI Chat',       icon: '🤖', color: '#0984e3' },
  visualization: { label: 'Visualization', icon: '📊', color: '#e17055' },
  report:        { label: 'Report',        icon: '📋', color: '#fdcb6e' },
  cleaning:      { label: 'Data Cleaning', icon: '🧹', color: '#a29bfe' },
  compare:       { label: 'Compare',       icon: '🔀', color: '#00cec9' },
  login:         { label: 'Login',         icon: '🔑', color: '#636e72' },
  export:        { label: 'Export',        icon: '💾', color: '#d63031' },
}

function formatTime(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = now - d

  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`

  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  if (isToday) return `Today ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  if (isYesterday) return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function groupByDate(entries) {
  const groups = {}
  const now = new Date()
  entries.forEach(entry => {
    const d = new Date(entry.timestamp)
    const isToday = d.toDateString() === now.toDateString()
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = d.toDateString() === yesterday.toDateString()

    let label
    if (isToday) label = 'Today'
    else if (isYesterday) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    if (!groups[label]) groups[label] = []
    groups[label].push(entry)
  })
  return groups
}

export default function History() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { activityLog, clearActivityLog } = useData()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  const filtered = useMemo(() => {
    let items = activityLog || []
    if (filterType !== 'all') items = items.filter(a => a.type === filterType)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      items = items.filter(a => a.title.toLowerCase().includes(q) || (a.details && a.details.toLowerCase().includes(q)))
    }
    return items
  }, [activityLog, filterType, searchQuery])

  const grouped = useMemo(() => groupByDate(filtered), [filtered])

  const typeCount = useMemo(() => {
    const counts = {}
    ;(activityLog || []).forEach(a => { counts[a.type] = (counts[a.type] || 0) + 1 })
    return counts
  }, [activityLog])

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} currentPath="/history" />
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="page-enter history-page">
          {/* Header */}
          <motion.div
            className="history-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="history-header-left">
              <h1>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Activity History
              </h1>
              <p className="history-subtitle">
                {(activityLog || []).length} total activities tracked
              </p>
            </div>
            <div className="history-header-right">
              {(activityLog || []).length > 0 && (
                <button className="btn-outline danger" onClick={() => {
                  if (window.confirm('Clear all activity history?')) clearActivityLog()
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Clear All
                </button>
              )}
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            className="history-stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
              const count = typeCount[key] || 0
              if (count === 0) return null
              return (
                <button
                  key={key}
                  className={`history-stat-card glass-card ${filterType === key ? 'active' : ''}`}
                  onClick={() => setFilterType(filterType === key ? 'all' : key)}
                >
                  <span className="stat-icon">{cfg.icon}</span>
                  <span className="stat-count">{count}</span>
                  <span className="stat-label">{cfg.label}</span>
                </button>
              )
            })}
          </motion.div>

          {/* Search & Filter Bar */}
          <motion.div
            className="history-toolbar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="history-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search activities..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>
            <div className="history-filters">
              <button
                className={`filter-chip ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                All
              </button>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  className={`filter-chip ${filterType === key ? 'active' : ''}`}
                  onClick={() => setFilterType(filterType === key ? 'all' : key)}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Activity Timeline */}
          <div className="history-timeline">
            {filtered.length === 0 ? (
              <motion.div
                className="history-empty glass-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h3>{searchQuery || filterType !== 'all' ? 'No matching activities' : 'No activity yet'}</h3>
                <p>{searchQuery || filterType !== 'all' ? 'Try a different search or filter' : 'Start using InsightFlow — your activities will appear here automatically.'}</p>
              </motion.div>
            ) : (
              Object.entries(grouped).map(([dateLabel, entries]) => (
                <div key={dateLabel} className="timeline-group">
                  <div className="timeline-date-label">
                    <span>{dateLabel}</span>
                  </div>
                  <AnimatePresence>
                    {entries.map((entry, i) => {
                      const cfg = TYPE_CONFIG[entry.type] || TYPE_CONFIG.upload
                      return (
                        <motion.div
                          key={entry.id}
                          className="timeline-entry glass-card"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: i * 0.03, duration: 0.3 }}
                        >
                          <div className="entry-dot" style={{ background: cfg.color }} />
                          <div className="entry-icon" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                            {cfg.icon}
                          </div>
                          <div className="entry-content">
                            <div className="entry-title">{entry.title}</div>
                            {entry.details && <div className="entry-details">{entry.details}</div>}
                          </div>
                          <div className="entry-meta">
                            <span className="entry-badge" style={{ background: `${cfg.color}20`, color: cfg.color }}>
                              {cfg.label}
                            </span>
                            <span className="entry-time">{formatTime(entry.timestamp)}</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
