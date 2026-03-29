import React, { useState, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import toast from 'react-hot-toast'
import { Sidebar } from './Dashboard'
import { useData } from '../context/DataContext'
import './Upload.css'

// Processing Pipeline Steps
const PIPELINE_STEPS = [
  { id: 'validate', label: 'Data Validation', icon: '🔍', description: 'Checking data integrity and format' },
  { id: 'clean', label: 'Data Cleaning', icon: '🧹', description: 'Handling missing values and outliers' },
  { id: 'analyze', label: 'Statistical Analysis', icon: '📊', description: 'Computing statistics and correlations' },
  { id: 'chart', label: 'Chart Generation', icon: '📈', description: 'Creating visualizations' },
  { id: 'insight', label: 'AI Insights', icon: '🧠', description: 'Generating intelligent findings' },
  { id: 'report', label: 'Report Ready', icon: '✅', description: 'Your report is complete!' },
]

function ProcessingPipeline({ currentStep, isProcessing }) {
  return (
    <div className="pipeline">
      {PIPELINE_STEPS.map((step, i) => {
        const status = i < currentStep ? 'complete' : i === currentStep && isProcessing ? 'active' : 'pending'
        return (
          <motion.div
            key={step.id}
            className={`pipeline-step ${status}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="pipeline-indicator">
              {status === 'complete' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              ) : status === 'active' ? (
                <div className="pipeline-spinner" />
              ) : (
                <span>{String(i + 1).padStart(2, '0')}</span>
              )}
            </div>
            <div className="pipeline-info">
              <span className="pipeline-label">{step.icon} {step.label}</span>
              <span className="pipeline-desc">{step.description}</span>
            </div>
            {i < PIPELINE_STEPS.length - 1 && <div className="pipeline-line" />}
          </motion.div>
        )
      })}
    </div>
  )
}

function DataPreview({ data, columns }) {
  if (!data || data.length === 0) return null
  const previewData = data.slice(0, 10)

  return (
    <div className="data-preview">
      <div className="preview-header-bar">
        <h4>Data Preview</h4>
        <span className="preview-count">{data.length} rows × {columns.length} columns</span>
      </div>
      <div className="preview-table-wrap">
        <table className="preview-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, i) => (
              <tr key={i}>
                {columns.map((col, j) => (
                  <td key={j}>{row[col] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 10 && (
        <div className="preview-more">
          Showing 10 of {data.length} rows
        </div>
      )}
    </div>
  )
}

function StatsCards({ stats }) {
  if (!stats) return null
  return (
    <div className="stats-summary">
      <h4>Statistical Summary</h4>
      <div className="stats-grid-upload">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            className="stat-mini glass-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="stat-mini-label">{stat.label}</span>
            <span className="stat-mini-value">{stat.value}</span>
            {stat.sub && <span className="stat-mini-sub">{stat.sub}</span>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function Upload() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [columns, setColumns] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [stats, setStats] = useState(null)
  const [reportReady, setReportReady] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { storeData } = useData()
  
  const intervalRef = React.useRef(null)
  const processedLocationRef = React.useRef(false)

  // Cleanup interval on unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  // Compute stats from parsed data
  const computeStats = useCallback((data, cols) => {
    const numericCols = cols.filter(col =>
      data.some(row => !isNaN(parseFloat(row[col])) && row[col] !== '')
    )

    const result = []
    result.push({ label: 'Total Rows', value: data.length.toLocaleString() })
    result.push({ label: 'Total Columns', value: cols.length })

    numericCols.slice(0, 4).forEach(col => {
      const values = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v))
      if (values.length > 0) {
        const mean = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
        const max = Math.max(...values).toFixed(2)
        const min = Math.min(...values).toFixed(2)
        result.push({ label: `${col} (Avg)`, value: mean, sub: `Min: ${min} | Max: ${max}` })
      }
    })

    return result
  }, [])

  const processFile = useCallback((fileObj) => {
    setFile(fileObj)
    const ext = fileObj.name.split('.').pop().toLowerCase()

    const parseCallback = (data, cols) => {
      setParsedData(data)
      setColumns(cols)
      
      // Start pipeline animation
      setIsProcessing(true)
      setCurrentStep(0)

      let step = 0
      // clear any existing interval
      if (intervalRef.current) clearInterval(intervalRef.current)

      intervalRef.current = setInterval(() => {
        step++
        if (step >= PIPELINE_STEPS.length) {
          clearInterval(intervalRef.current)
          setIsProcessing(false)
          const computedStats = computeStats(data, cols)
          setStats(computedStats)
          setReportReady(true)
          // Store in shared context so Visualization page can use it
          storeData(data, cols, fileObj.name, computedStats)
          toast.success('🎉 Analysis complete! Report is ready.')
        } else {
          setCurrentStep(step)
        }
      }, 1000)
    }

    if (ext === 'csv') {
      Papa.parse(fileObj, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length > 0) {
            parseCallback(results.data, results.meta.fields || Object.keys(results.data[0]))
          } else {
            toast.error('CSV file is empty')
          }
        },
        error: () => toast.error('Error parsing CSV file'),
      })
    } else if (['xlsx', 'xls'].includes(ext)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const data = XLSX.utils.sheet_to_json(ws)
          if (data.length > 0) {
            parseCallback(data, Object.keys(data[0]))
          } else {
            toast.error('Excel file is empty')
          }
        } catch {
          toast.error('Error parsing Excel file')
        }
      }
      reader.readAsArrayBuffer(fileObj)
    }
  }, [computeStats])

  // Handle file from navigation state
  React.useEffect(() => {
    if (location.state?.file && location.state?.type === 'csv' && !processedLocationRef.current) {
      processedLocationRef.current = true
      processFile(location.state.file)
      // clear location state to prevent re-processing
      window.history.replaceState({}, document.title)
    }
  }, [location.state, processFile])

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) processFile(accepted[0])
  }, [processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
  })

  const handleDownloadReport = () => {
    toast.success('Report downloading...')
    // Simulate report download
    const blob = new Blob([`InsightFlow Report\n\nFile: ${file.name}\nRows: ${parsedData.length}\nColumns: ${columns.length}\n\nStatistics:\n${stats.map(s => `${s.label}: ${s.value}`).join('\n')}`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `InsightFlow_Report_${file.name.replace(/\.\w+$/, '')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} currentPath="/upload" />
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="page-enter">
          <div className="dash-header">
            <div>
              <h1>Upload & Analyze</h1>
              <p>Upload CSV or Excel files for automated analysis and report generation.</p>
            </div>
          </div>

          {!file ? (
            <motion.div
              {...getRootProps()}
              className={`upload-dropzone ${isDragActive ? 'dragging' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <input {...getInputProps()} />
              <div className="dropzone-visual">
                <motion.div
                  className="dropzone-icon"
                  animate={isDragActive ? { y: -15, scale: 1.15 } : { y: [0, -8, 0] }}
                  transition={isDragActive ? { type: 'spring' } : { duration: 2, repeat: Infinity }}
                >
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </motion.div>
                <h2>{isDragActive ? 'Drop your file here!' : 'Drop your CSV or Excel file'}</h2>
                <p>or click to browse files</p>
                <div className="dropzone-formats">
                  <span>.CSV</span>
                  <span>.XLSX</span>
                  <span>.XLS</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="upload-results">
              {/* File Info */}
              <motion.div
                className="file-info-bar glass-card"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="file-info-left">
                  <div className="file-icon-lg">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  </div>
                  <div>
                    <h4>{file.name}</h4>
                    <p>{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <div className="file-info-actions">
                  {reportReady && (
                    <motion.button
                      className="btn-download"
                      onClick={handleDownloadReport}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                      Download Report
                    </motion.button>
                  )}
                  <button className="btn-outline" onClick={() => {
                    setFile(null)
                    setParsedData(null)
                    setColumns([])
                    setCurrentStep(-1)
                    setStats(null)
                    setReportReady(false)
                    setIsProcessing(false)
                  }}>
                    New Upload
                  </button>
                </div>
              </motion.div>

              <div className="upload-content-grid">
                {/* Pipeline */}
                <motion.div
                  className="glass-card pipeline-card"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h3>Processing Pipeline</h3>
                  <ProcessingPipeline currentStep={currentStep} isProcessing={isProcessing} />
                </motion.div>

                {/* Results */}
                <div className="results-column">
                  {parsedData && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <DataPreview data={parsedData} columns={columns} />
                    </motion.div>
                  )}
                  {stats && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <StatsCards stats={stats} />
                    </motion.div>
                  )}
                  {reportReady && (
                    <motion.div
                      className="report-ready glass-card"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="report-ready-icon">🎉</div>
                      <h3>Analysis Complete!</h3>
                      <p>Your comprehensive report is ready for download.</p>
                      <div className="report-actions">
                        <button className="btn-hero-primary" onClick={handleDownloadReport}>
                          Download Report
                        </button>
                        <button className="btn-outline" onClick={() => navigate('/visualization')}>
                          View Visualizations
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
