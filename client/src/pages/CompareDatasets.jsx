import React, { useState, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './Dashboard'
import { useData } from '../context/DataContext'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import './CompareDatasets.css'

function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (result) => resolve({ data: result.data, columns: result.meta.fields || [] }),
      error: reject,
    })
  })
}

// Compute per-column stats for any dataset
function computeColumnStats(data, columns) {
  const stats = {}
  columns.forEach(col => {
    const values = data.map(r => r[col]).filter(v => v !== '' && v !== null && v !== undefined)
    const nums = values.map(v => parseFloat(v)).filter(n => !isNaN(n))
    const isNumeric = nums.length > data.length * 0.3
    if (isNumeric && nums.length > 0) {
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length
      stats[col] = {
        type: 'numeric',
        mean: mean.toFixed(2),
        min: Math.min(...nums).toFixed(2),
        max: Math.max(...nums).toFixed(2),
        count: nums.length,
      }
    } else {
      const unique = new Set(values)
      stats[col] = {
        type: 'categorical',
        unique: unique.size,
        count: values.length,
        top: [...unique].slice(0, 3).join(', '),
      }
    }
  })
  return stats
}

function DataPreviewMini({ data, columns, label }) {
  if (!data || data.length === 0) return null
  const preview = data.slice(0, 5)
  return (
    <div className="compare-preview">
      <div className="compare-preview-header">
        <span>{label}</span>
        <span className="compare-preview-count">{data.length} rows × {columns.length} cols</span>
      </div>
      <div className="compare-preview-scroll">
        <table className="compare-preview-table">
          <thead>
            <tr>{columns.map((c, i) => <th key={i}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i}>{columns.map((c, j) => <td key={j}>{row[c] ?? '—'}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function CompareDatasets() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { uploadedData, uploadedColumns, uploadedFileName, addActivity } = useData()
  const fileInputRefA = useRef(null)
  const fileInputRefB = useRef(null)

  // Local Dataset A (either from context or uploaded here)
  const [localDataA, setLocalDataA] = useState(null)
  const [localColsA, setLocalColsA] = useState([])
  const [localFileNameA, setLocalFileNameA] = useState('')

  const [dataB, setDataB] = useState(null)
  const [colsB, setColsB] = useState([])
  const [fileNameB, setFileNameB] = useState('')

  // Use local A if uploaded here, otherwise fall back to context
  const activeDataA = localDataA || uploadedData
  const activeColsA = localDataA ? localColsA : uploadedColumns
  const activeFileNameA = localDataA ? localFileNameA : uploadedFileName

  const handleFileA = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { data, columns } = await parseCSV(file)
      if (columns.length === 0 || data.length === 0) {
        toast.error('File is empty or has no valid columns')
        return
      }
      setLocalDataA(data)
      setLocalColsA(columns)
      setLocalFileNameA(file.name)
      toast.success(`Dataset A: "${file.name}" — ${data.length} rows, ${columns.length} columns`)
    } catch {
      toast.error('Failed to parse file')
    }
    e.target.value = ''
  }

  const handleFileB = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { data, columns } = await parseCSV(file)
      if (columns.length === 0 || data.length === 0) {
        toast.error('File is empty or has no valid columns')
        return
      }
      setDataB(data)
      setColsB(columns)
      setFileNameB(file.name)
      toast.success(`Dataset B: "${file.name}" — ${data.length} rows, ${columns.length} columns`)
      addActivity('compare', 'Compared datasets', `${activeFileNameA} vs ${file.name}`)
    } catch {
      toast.error('Failed to parse file')
    }
    e.target.value = ''
  }

  const clearA = () => {
    setLocalDataA(null)
    setLocalColsA([])
    setLocalFileNameA('')
    toast('Dataset A cleared')
  }

  const clearB = () => {
    setDataB(null)
    setColsB([])
    setFileNameB('')
    toast('Dataset B cleared')
  }

  const hasA = activeDataA && activeDataA.length > 0
  const hasB = dataB && dataB.length > 0
  const canCompare = hasA && hasB

  // Comparison analysis
  const comparison = useMemo(() => {
    if (!canCompare) return null

    // Case-insensitive column matching
    const colsALower = new Map(activeColsA.map(c => [c.toLowerCase().trim(), c]))
    const colsBLower = new Map(colsB.map(c => [c.toLowerCase().trim(), c]))

    const commonCols = []
    const matchedA = new Set()
    const matchedB = new Set()

    colsALower.forEach((origA, lowerA) => {
      if (colsBLower.has(lowerA)) {
        commonCols.push({ colA: origA, colB: colsBLower.get(lowerA) })
        matchedA.add(origA)
        matchedB.add(colsBLower.get(lowerA))
      }
    })

    const onlyA = activeColsA.filter(c => !matchedA.has(c))
    const onlyB = colsB.filter(c => !matchedB.has(c))

    const statsA = computeColumnStats(activeDataA, activeColsA)
    const statsB = computeColumnStats(dataB, colsB)

    // Stats for common columns
    const colStats = commonCols.map(({ colA, colB }) => {
      const sA = statsA[colA]
      const sB = statsB[colB]
      const isNumeric = sA.type === 'numeric' && sB.type === 'numeric'

      if (isNumeric) {
        return {
          colA, colB, type: 'numeric',
          meanA: sA.mean, meanB: sB.mean,
          minA: sA.min, minB: sB.min,
          maxA: sA.max, maxB: sB.max,
        }
      }
      return {
        colA, colB, type: sA.type === sB.type ? sA.type : 'mixed',
        uniqueA: sA.unique || sA.count, uniqueB: sB.unique || sB.count,
        statsA: sA, statsB: sB,
      }
    })

    // Individual stats for unmatched columns
    const onlyAStats = onlyA.map(col => ({ col, ...statsA[col] }))
    const onlyBStats = onlyB.map(col => ({ col, ...statsB[col] }))

    return { commonCols, onlyA, onlyB, colStats, onlyAStats, onlyBStats }
  }, [canCompare, activeDataA, activeColsA, dataB, colsB])

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} currentPath="/compare" />
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="page-enter">
          <div className="dash-header">
            <div>
              <h1>Compare Datasets</h1>
              <p>Upload two datasets to compare their structure and statistics side by side.</p>
            </div>
          </div>

          <div className="compare-container">
            {/* Upload cards */}
            <div className="compare-upload-grid">
              <div className={`compare-upload-card ${hasA ? 'has-data' : ''}`} onClick={() => !hasA && fileInputRefA.current?.click()}>
                <h3>Dataset A</h3>
                {hasA ? (
                  <div className="compare-file-info">
                    <span>{activeFileNameA} — {activeDataA.length} rows × {activeColsA.length} cols</span>
                    <div className="compare-card-actions">
                      <button className="compare-reupload" onClick={(e) => { e.stopPropagation(); fileInputRefA.current?.click() }}>
                        Change
                      </button>
                      <button className="compare-remove" onClick={(e) => { e.stopPropagation(); clearA() }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>Click to upload a CSV file</p>
                )}
                <input ref={fileInputRefA} type="file" accept=".csv,.xlsx,.xls" className="compare-file-input" onChange={handleFileA} />
              </div>

              <div className="compare-vs">VS</div>

              <div className={`compare-upload-card ${hasB ? 'has-data' : ''}`} onClick={() => !hasB && fileInputRefB.current?.click()}>
                <h3>Dataset B</h3>
                {hasB ? (
                  <div className="compare-file-info">
                    <span>{fileNameB} — {dataB.length} rows × {colsB.length} cols</span>
                    <div className="compare-card-actions">
                      <button className="compare-reupload" onClick={(e) => { e.stopPropagation(); fileInputRefB.current?.click() }}>
                        Change
                      </button>
                      <button className="compare-remove" onClick={(e) => { e.stopPropagation(); clearB() }}>
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <p>Click to upload a CSV file</p>
                )}
                <input ref={fileInputRefB} type="file" accept=".csv,.xlsx,.xls" className="compare-file-input" onChange={handleFileB} />
              </div>
            </div>

            {/* Data previews */}
            {canCompare && (
              <div className="compare-previews-grid">
                <DataPreviewMini data={activeDataA} columns={activeColsA} label="Dataset A" />
                <DataPreviewMini data={dataB} columns={colsB} label="Dataset B" />
              </div>
            )}

            {/* Comparison results */}
            {comparison && (
              <motion.div className="compare-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {/* Overview metrics */}
                <div className="compare-section">
                  <h3>Overview</h3>
                  <div className="compare-metrics-grid">
                    <div className="compare-metric">
                      <div className="label">Rows</div>
                      <div className="values">
                        <span className="val-a">{activeDataA.length.toLocaleString()}</span>
                        <span style={{ color: 'var(--text-muted)' }}>vs</span>
                        <span className="val-b">{dataB.length.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="compare-metric">
                      <div className="label">Columns</div>
                      <div className="values">
                        <span className="val-a">{activeColsA.length}</span>
                        <span style={{ color: 'var(--text-muted)' }}>vs</span>
                        <span className="val-b">{colsB.length}</span>
                      </div>
                    </div>
                    <div className="compare-metric">
                      <div className="label">Common Columns</div>
                      <div className="values">
                        <span className="col-badge-common">{comparison.commonCols.length}</span>
                      </div>
                    </div>
                    <div className="compare-metric">
                      <div className="label">Only in A</div>
                      <div className="values">
                        <span className="col-badge-only-a">{comparison.onlyA.length}</span>
                      </div>
                    </div>
                    <div className="compare-metric">
                      <div className="label">Only in B</div>
                      <div className="values">
                        <span className="col-badge-only-b">{comparison.onlyB.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warning if no common columns */}
                {comparison.commonCols.length === 0 && (
                  <div className="compare-warning">
                    <span className="compare-warning-icon">⚠️</span>
                    <div>
                      <strong>No matching columns found</strong>
                      <p>These datasets have completely different column names. Column matching is case-insensitive. Below you can still see individual statistics for each dataset's columns.</p>
                      <div className="compare-colnames-hint">
                        <span><strong>A columns:</strong> {activeColsA.slice(0, 5).join(', ')}{activeColsA.length > 5 ? '…' : ''}</span>
                        <span><strong>B columns:</strong> {colsB.slice(0, 5).join(', ')}{colsB.length > 5 ? '…' : ''}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Common columns comparison */}
                {comparison.colStats.length > 0 && (
                  <div className="compare-section">
                    <h3>Common Columns — Side by Side</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="compare-columns-table">
                        <thead>
                          <tr>
                            <th>Column</th>
                            <th>Type</th>
                            <th>Dataset A</th>
                            <th>Dataset B</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparison.colStats.map(s => (
                            <tr key={s.colA}>
                              <td style={{ fontWeight: 600 }}>{s.colA}</td>
                              <td>{s.type}</td>
                              <td>
                                {s.type === 'numeric'
                                  ? `mean: ${s.meanA}, range: [${s.minA}, ${s.maxA}]`
                                  : `${s.uniqueA} unique values`}
                              </td>
                              <td>
                                {s.type === 'numeric'
                                  ? `mean: ${s.meanB}, range: [${s.minB}, ${s.maxB}]`
                                  : `${s.uniqueB} unique values`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Dataset A exclusive columns */}
                {comparison.onlyAStats.length > 0 && (
                  <div className="compare-section">
                    <h3>Dataset A — Exclusive Columns ({comparison.onlyAStats.length})</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="compare-columns-table">
                        <thead>
                          <tr>
                            <th>Column</th>
                            <th>Type</th>
                            <th>Statistics</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparison.onlyAStats.map(s => (
                            <tr key={s.col}>
                              <td style={{ fontWeight: 600 }}>{s.col}</td>
                              <td>{s.type}</td>
                              <td>
                                {s.type === 'numeric'
                                  ? `mean: ${s.mean}, range: [${s.min}, ${s.max}], count: ${s.count}`
                                  : `${s.unique} unique values, count: ${s.count}${s.top ? `, top: ${s.top}` : ''}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Dataset B exclusive columns */}
                {comparison.onlyBStats.length > 0 && (
                  <div className="compare-section">
                    <h3>Dataset B — Exclusive Columns ({comparison.onlyBStats.length})</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="compare-columns-table">
                        <thead>
                          <tr>
                            <th>Column</th>
                            <th>Type</th>
                            <th>Statistics</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comparison.onlyBStats.map(s => (
                            <tr key={s.col}>
                              <td style={{ fontWeight: 600 }}>{s.col}</td>
                              <td>{s.type}</td>
                              <td>
                                {s.type === 'numeric'
                                  ? `mean: ${s.mean}, range: [${s.min}, ${s.max}], count: ${s.count}`
                                  : `${s.unique} unique values, count: ${s.count}${s.top ? `, top: ${s.top}` : ''}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {!canCompare && (
              <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <p>{!hasA && !hasB ? 'Upload two CSV files above to start comparing.' : !hasA ? 'Upload Dataset A to start comparing.' : 'Upload Dataset B to start comparing.'}</p>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
