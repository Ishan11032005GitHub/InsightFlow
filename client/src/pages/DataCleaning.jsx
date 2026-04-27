import React, { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sidebar } from './Dashboard'
import { useData } from '../context/DataContext'
import toast from 'react-hot-toast'
import './DataCleaning.css'

const OPERATIONS = [
  { id: 'duplicates', label: 'Remove Duplicates', icon: '⊘' },
  { id: 'missing', label: 'Handle Missing Values', icon: '∅' },
  { id: 'rename', label: 'Rename Columns', icon: '✎' },
  { id: 'filter', label: 'Filter Rows', icon: '⊳' },
  { id: 'sort', label: 'Sort Data', icon: '↕' },
  { id: 'typecast', label: 'Convert Types', icon: '⟳' },
  { id: 'trim', label: 'Trim Whitespace', icon: '⌧' },
]

export default function DataCleaning() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { uploadedData, setUploadedData, uploadedColumns, setUploadedColumns, uploadedFileName, addActivity } = useData()
  const [activeOp, setActiveOp] = useState('duplicates')
  const [log, setLog] = useState([])

  // Operation-specific states
  const [missingStrategy, setMissingStrategy] = useState('drop')
  const [missingColumn, setMissingColumn] = useState('')
  const [fillValue, setFillValue] = useState('')
  const [renameFrom, setRenameFrom] = useState('')
  const [renameTo, setRenameTo] = useState('')
  const [filterColumn, setFilterColumn] = useState('')
  const [filterOp, setFilterOp] = useState('equals')
  const [filterValue, setFilterValue] = useState('')
  const [sortColumn, setSortColumn] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const [typeColumn, setTypeColumn] = useState('')
  const [typeTo, setTypeTo] = useState('number')

  const hasData = uploadedData && uploadedData.length > 0

  const addLog = (msg) => setLog(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev.slice(0, 19)])

  // Compute stats
  const stats = useMemo(() => {
    if (!hasData) return {}
    const totalCells = uploadedData.length * uploadedColumns.length
    let missingCells = 0
    const missingPerCol = {}
    uploadedColumns.forEach(col => {
      const missing = uploadedData.filter(r => r[col] === '' || r[col] === null || r[col] === undefined).length
      missingPerCol[col] = missing
      missingCells += missing
    })
    const dupes = uploadedData.length - new Set(uploadedData.map(r => JSON.stringify(r))).size
    return { totalCells, missingCells, missingPerCol, dupes, rows: uploadedData.length, cols: uploadedColumns.length }
  }, [uploadedData, uploadedColumns])

  // Remove duplicates
  const removeDuplicates = useCallback(() => {
    const seen = new Set()
    const cleaned = uploadedData.filter(row => {
      const key = JSON.stringify(row)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    const removed = uploadedData.length - cleaned.length
    setUploadedData(cleaned)
    addLog(`Removed ${removed} duplicate rows`)
    addActivity('cleaning', 'Removed duplicates', `${removed} rows removed from ${uploadedFileName}`)
    toast.success(`Removed ${removed} duplicates`)
  }, [uploadedData, setUploadedData])

  // Handle missing values
  const handleMissing = useCallback(() => {
    const cols = missingColumn ? [missingColumn] : uploadedColumns
    let cleaned = [...uploadedData]
    let affected = 0

    if (missingStrategy === 'drop') {
      cleaned = cleaned.filter(row => {
        const hasMissing = cols.some(c => row[c] === '' || row[c] === null || row[c] === undefined)
        if (hasMissing) affected++
        return !hasMissing
      })
    } else if (missingStrategy === 'fill') {
      cleaned = cleaned.map(row => {
        const newRow = { ...row }
        cols.forEach(c => {
          if (newRow[c] === '' || newRow[c] === null || newRow[c] === undefined) {
            newRow[c] = fillValue
            affected++
          }
        })
        return newRow
      })
    } else if (missingStrategy === 'mean') {
      cols.forEach(c => {
        const nums = cleaned.map(r => parseFloat(r[c])).filter(n => !isNaN(n))
        if (nums.length === 0) return
        const mean = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2)
        cleaned = cleaned.map(row => {
          if (row[c] === '' || row[c] === null || row[c] === undefined || isNaN(parseFloat(row[c]))) {
            affected++
            return { ...row, [c]: mean }
          }
          return row
        })
      })
    }
    setUploadedData(cleaned)
    addLog(`Missing values: ${missingStrategy} — ${affected} cells affected`)
    addActivity('cleaning', 'Handled missing values', `${missingStrategy}: ${affected} cells in ${uploadedFileName}`)
    toast.success(`Handled ${affected} missing values`)
  }, [uploadedData, uploadedColumns, missingColumn, missingStrategy, fillValue, setUploadedData])

  // Rename column
  const handleRename = useCallback(() => {
    if (!renameFrom || !renameTo) return
    const newCols = uploadedColumns.map(c => c === renameFrom ? renameTo : c)
    const newData = uploadedData.map(row => {
      const newRow = {}
      uploadedColumns.forEach(c => {
        newRow[c === renameFrom ? renameTo : c] = row[c]
      })
      return newRow
    })
    setUploadedColumns(newCols)
    setUploadedData(newData)
    addLog(`Renamed column "${renameFrom}" → "${renameTo}"`)
    addActivity('cleaning', 'Renamed column', `"${renameFrom}" → "${renameTo}" in ${uploadedFileName}`)
    toast.success(`Renamed "${renameFrom}" to "${renameTo}"`)
    setRenameFrom('')
    setRenameTo('')
  }, [renameFrom, renameTo, uploadedColumns, uploadedData, setUploadedColumns, setUploadedData])

  // Filter rows
  const handleFilter = useCallback(() => {
    if (!filterColumn || !filterValue) return
    const before = uploadedData.length
    const cleaned = uploadedData.filter(row => {
      const val = String(row[filterColumn] || '')
      const cmp = filterValue
      switch (filterOp) {
        case 'equals': return val === cmp
        case 'not_equals': return val !== cmp
        case 'contains': return val.toLowerCase().includes(cmp.toLowerCase())
        case 'gt': return parseFloat(val) > parseFloat(cmp)
        case 'lt': return parseFloat(val) < parseFloat(cmp)
        case 'gte': return parseFloat(val) >= parseFloat(cmp)
        case 'lte': return parseFloat(val) <= parseFloat(cmp)
        default: return true
      }
    })
    setUploadedData(cleaned)
    addLog(`Filtered: kept ${cleaned.length}/${before} rows where ${filterColumn} ${filterOp} "${filterValue}"`)
    addActivity('cleaning', 'Filtered rows', `Kept ${cleaned.length}/${before} rows in ${uploadedFileName}`)
    toast.success(`Kept ${cleaned.length} of ${before} rows`)
  }, [uploadedData, filterColumn, filterOp, filterValue, setUploadedData])

  // Sort
  const handleSort = useCallback(() => {
    if (!sortColumn) return
    const sorted = [...uploadedData].sort((a, b) => {
      const av = a[sortColumn], bv = b[sortColumn]
      const an = parseFloat(av), bn = parseFloat(bv)
      if (!isNaN(an) && !isNaN(bn)) return sortOrder === 'asc' ? an - bn : bn - an
      return sortOrder === 'asc' ? String(av || '').localeCompare(String(bv || '')) : String(bv || '').localeCompare(String(av || ''))
    })
    setUploadedData(sorted)
    addLog(`Sorted by ${sortColumn} (${sortOrder})`)
    addActivity('cleaning', 'Sorted data', `By ${sortColumn} (${sortOrder}) in ${uploadedFileName}`)
    toast.success(`Sorted by ${sortColumn}`)
  }, [uploadedData, sortColumn, sortOrder, setUploadedData])

  // Type conversion
  const handleTypecast = useCallback(() => {
    if (!typeColumn) return
    let converted = 0
    const cleaned = uploadedData.map(row => {
      const val = row[typeColumn]
      let newVal = val
      if (typeTo === 'number') {
        const n = parseFloat(val)
        if (!isNaN(n)) { newVal = n; converted++ }
      } else if (typeTo === 'string') {
        newVal = String(val || ''); converted++
      } else if (typeTo === 'lowercase') {
        newVal = String(val || '').toLowerCase(); converted++
      } else if (typeTo === 'uppercase') {
        newVal = String(val || '').toUpperCase(); converted++
      }
      return { ...row, [typeColumn]: newVal }
    })
    setUploadedData(cleaned)
    addLog(`Converted ${typeColumn} to ${typeTo}: ${converted} values`)
    addActivity('cleaning', 'Type conversion', `${typeColumn} → ${typeTo}: ${converted} values in ${uploadedFileName}`)
    toast.success(`Converted ${converted} values`)
  }, [uploadedData, typeColumn, typeTo, setUploadedData])

  // Trim whitespace
  const handleTrim = useCallback(() => {
    let trimmed = 0
    const cleaned = uploadedData.map(row => {
      const newRow = {}
      uploadedColumns.forEach(c => {
        if (typeof row[c] === 'string' && row[c] !== row[c].trim()) {
          trimmed++
          newRow[c] = row[c].trim()
        } else {
          newRow[c] = row[c]
        }
      })
      return newRow
    })
    setUploadedData(cleaned)
    addLog(`Trimmed whitespace from ${trimmed} cells`)
    addActivity('cleaning', 'Trimmed whitespace', `${trimmed} cells in ${uploadedFileName}`)
    toast.success(`Trimmed ${trimmed} cells`)
  }, [uploadedData, uploadedColumns, setUploadedData])

  const renderOperation = () => {
    switch (activeOp) {
      case 'duplicates':
        return (
          <div className="cleaning-panel">
            <h3>Remove Duplicate Rows</h3>
            <p>Removes rows that are exact duplicates across all columns.</p>
            <div className="cleaning-stats">
              <div className="cleaning-stat">Duplicate rows: <strong>{stats.dupes || 0}</strong></div>
              <div className="cleaning-stat">Total rows: <strong>{stats.rows || 0}</strong></div>
            </div>
            <button className="cleaning-apply-btn" onClick={removeDuplicates} disabled={!stats.dupes}>
              Remove {stats.dupes || 0} Duplicates
            </button>
          </div>
        )

      case 'missing':
        return (
          <div className="cleaning-panel">
            <h3>Handle Missing Values</h3>
            <p>Deal with empty or null cells in your data.</p>
            <div className="cleaning-stats">
              <div className="cleaning-stat">Missing cells: <strong>{stats.missingCells || 0}</strong></div>
              <div className="cleaning-stat">Total cells: <strong>{stats.totalCells || 0}</strong></div>
            </div>
            <div className="cleaning-controls">
              <select className="cleaning-select" value={missingColumn} onChange={e => setMissingColumn(e.target.value)}>
                <option value="">All columns</option>
                {uploadedColumns.map(c => (
                  <option key={c} value={c}>{c} ({stats.missingPerCol?.[c] || 0} missing)</option>
                ))}
              </select>
              <select className="cleaning-select" value={missingStrategy} onChange={e => setMissingStrategy(e.target.value)}>
                <option value="drop">Drop rows with missing</option>
                <option value="fill">Fill with value</option>
                <option value="mean">Fill with mean (numeric)</option>
              </select>
              {missingStrategy === 'fill' && (
                <input className="cleaning-input" placeholder="Fill value..." value={fillValue} onChange={e => setFillValue(e.target.value)} />
              )}
              <button className="cleaning-apply-btn" onClick={handleMissing}>Apply</button>
            </div>
          </div>
        )

      case 'rename':
        return (
          <div className="cleaning-panel">
            <h3>Rename Columns</h3>
            <p>Select a column and provide a new name.</p>
            <div className="cleaning-controls">
              <select className="cleaning-select" value={renameFrom} onChange={e => setRenameFrom(e.target.value)}>
                <option value="">Select column</option>
                {uploadedColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="cleaning-input" placeholder="New name..." value={renameTo} onChange={e => setRenameTo(e.target.value)} />
              <button className="cleaning-apply-btn" onClick={handleRename} disabled={!renameFrom || !renameTo}>Rename</button>
            </div>
          </div>
        )

      case 'filter':
        return (
          <div className="cleaning-panel">
            <h3>Filter Rows</h3>
            <p>Keep only rows matching your condition.</p>
            <div className="cleaning-controls">
              <select className="cleaning-select" value={filterColumn} onChange={e => setFilterColumn(e.target.value)}>
                <option value="">Select column</option>
                {uploadedColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="cleaning-select" value={filterOp} onChange={e => setFilterOp(e.target.value)}>
                <option value="equals">Equals</option>
                <option value="not_equals">Not equals</option>
                <option value="contains">Contains</option>
                <option value="gt">Greater than</option>
                <option value="lt">Less than</option>
                <option value="gte">≥</option>
                <option value="lte">≤</option>
              </select>
              <input className="cleaning-input" placeholder="Value..." value={filterValue} onChange={e => setFilterValue(e.target.value)} />
              <button className="cleaning-apply-btn" onClick={handleFilter} disabled={!filterColumn || !filterValue}>Filter</button>
            </div>
          </div>
        )

      case 'sort':
        return (
          <div className="cleaning-panel">
            <h3>Sort Data</h3>
            <p>Sort rows by a column value.</p>
            <div className="cleaning-controls">
              <select className="cleaning-select" value={sortColumn} onChange={e => setSortColumn(e.target.value)}>
                <option value="">Select column</option>
                {uploadedColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="cleaning-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button className="cleaning-apply-btn" onClick={handleSort} disabled={!sortColumn}>Sort</button>
            </div>
          </div>
        )

      case 'typecast':
        return (
          <div className="cleaning-panel">
            <h3>Convert Column Types</h3>
            <p>Transform values in a column to a different type.</p>
            <div className="cleaning-controls">
              <select className="cleaning-select" value={typeColumn} onChange={e => setTypeColumn(e.target.value)}>
                <option value="">Select column</option>
                {uploadedColumns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="cleaning-select" value={typeTo} onChange={e => setTypeTo(e.target.value)}>
                <option value="number">To Number</option>
                <option value="string">To String</option>
                <option value="lowercase">To Lowercase</option>
                <option value="uppercase">To Uppercase</option>
              </select>
              <button className="cleaning-apply-btn" onClick={handleTypecast} disabled={!typeColumn}>Convert</button>
            </div>
          </div>
        )

      case 'trim':
        return (
          <div className="cleaning-panel">
            <h3>Trim Whitespace</h3>
            <p>Remove leading and trailing spaces from all text cells.</p>
            <button className="cleaning-apply-btn" onClick={handleTrim}>Trim All Cells</button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} currentPath="/data-cleaning" />
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="page-enter">
          <div className="dash-header">
            <div>
              <h1>Data Cleaning</h1>
              <p>{hasData ? `Working on "${uploadedFileName}" — ${uploadedData.length} rows × ${uploadedColumns.length} columns` : 'Upload a dataset first to start cleaning.'}</p>
            </div>
          </div>

          {!hasData ? (
            <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p>Upload a CSV or Excel file on the Upload page first.</p>
            </motion.div>
          ) : (
            <div className="cleaning-layout">
              {/* Operations sidebar */}
              <div className="cleaning-sidebar">
                {OPERATIONS.map(op => (
                  <button key={op.id} className={`cleaning-op-btn ${activeOp === op.id ? 'active' : ''}`} onClick={() => setActiveOp(op.id)}>
                    <div className="op-icon">{op.icon}</div>
                    {op.label}
                  </button>
                ))}
              </div>

              {/* Main panel */}
              <div className="cleaning-main">
                {renderOperation()}

                {/* Data preview */}
                <div className="cleaning-panel">
                  <h3>Data Preview (first 50 rows)</h3>
                  <div className="cleaning-preview">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          {uploadedColumns.map(c => <th key={c}>{c}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {uploadedData.slice(0, 50).map((row, i) => (
                          <tr key={i}>
                            <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                            {uploadedColumns.map(c => <td key={c}>{row[c] === '' || row[c] === null || row[c] === undefined ? <span style={{ color: '#ff5252', fontStyle: 'italic' }}>null</span> : String(row[c])}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Log */}
                {log.length > 0 && (
                  <div className="cleaning-panel">
                    <h3>Operations Log</h3>
                    {log.map((entry, i) => (
                      <div key={i} className="cleaning-log">{entry}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
