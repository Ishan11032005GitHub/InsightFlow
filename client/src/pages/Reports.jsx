import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sidebar } from './Dashboard'
import { useData } from '../context/DataContext'
import './Reports.css'

function ReportCard({ report, delay, onDelete }) {
  const navigate = useNavigate()

  return (
    <motion.div
      className="report-card glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="report-card-header">
        <div className="report-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <span className={`report-status ${report.status}`}>
          {report.status === 'complete' || report.status === 'indexed' ? '✓ Ready' : '⏳ Processing'}
        </span>
      </div>
      <h4 className="report-title">{report.name}</h4>
      <p className="report-file">
        <span className={`file-badge ${report.type}`}>.{report.type.toUpperCase()}</span>
        {report.file}
      </p>
      <div className="report-meta">
        <div className="meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {report.date}
        </div>
        <div className="meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
          {report.type === 'pdf' ? `${report.rows} pages` : `${report.rows.toLocaleString()} rows`}
        </div>
        <div className="meta-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6"/>
          </svg>
          {report.type === 'pdf' ? 'Chat Ready' : `${report.insights} insights`}
        </div>
      </div>
      <div className="report-actions">
        <button className="report-btn view" onClick={() => navigate(report.type === 'pdf' ? '/chat' : '/visualization')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {report.type === 'pdf' ? (
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            ) : (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </>
            )}
          </svg>
          {report.type === 'pdf' ? 'Open Chat' : 'View'}
        </button>
        <button className="report-btn download">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </button>
        <button className="report-btn delete" onClick={() => onDelete(report.id)} title="Delete Report">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </motion.div>
  )
}

export default function Reports() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()
  const { reports: contextReports, deleteReport } = useData()

  const allReports = useMemo(() => [
    ...(contextReports || [])
  ], [contextReports])

  const filteredReports = filter === 'all'
    ? allReports
    : allReports.filter(r => r.status === filter)

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} currentPath="/reports" />
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="page-enter">
          <div className="dash-header">
            <div>
              <h1>Reports</h1>
              <p>View and manage your generated analytics reports.</p>
            </div>
            <button className="btn-primary" onClick={() => navigate('/upload')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Report
            </button>
          </div>

          {/* Filters */}
          <div className="reports-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Reports <span className="filter-count">{allReports.length}</span>
            </button>
            <button
              className={`filter-btn ${filter === 'complete' ? 'active' : ''}`}
              onClick={() => setFilter('complete')}
            >
              Completed <span className="filter-count">{allReports.filter(r => r.status === 'complete').length}</span>
            </button>
            <button
              className={`filter-btn ${filter === 'processing' ? 'active' : ''}`}
              onClick={() => setFilter('processing')}
            >
              Processing <span className="filter-count">{allReports.filter(r => r.status === 'processing').length}</span>
            </button>
          </div>

          {/* Reports Grid */}
          <div className="reports-grid">
            {filteredReports.map((report, i) => (
              <ReportCard key={report.id} report={report} delay={i * 0.08} onDelete={deleteReport} />
            ))}
          </div>

          {filteredReports.length === 0 && (
            <motion.div
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p>No reports found for this filter.</p>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
