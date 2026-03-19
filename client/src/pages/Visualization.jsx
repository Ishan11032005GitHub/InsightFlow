import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Line, Doughnut, Pie, Scatter } from 'react-chartjs-2'
import { Sidebar } from './Dashboard'
import { useData } from '../context/DataContext'
import './Visualization.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Chart.js dark theme defaults
ChartJS.defaults.color = '#a0a0b5'
ChartJS.defaults.borderColor = 'rgba(255, 255, 255, 0.04)'
ChartJS.defaults.font.family = "'Inter', sans-serif"

const CHART_COLORS = [
  'rgba(108, 92, 231, 0.8)',
  'rgba(0, 210, 255, 0.8)',
  'rgba(247, 37, 133, 0.8)',
  'rgba(0, 230, 118, 0.8)',
  'rgba(255, 167, 38, 0.8)',
  'rgba(162, 155, 254, 0.8)',
  'rgba(0, 245, 212, 0.8)',
  'rgba(255, 107, 53, 0.8)',
  'rgba(64, 196, 255, 0.8)',
  'rgba(124, 77, 255, 0.8)',
]

const CHART_COLORS_BG = CHART_COLORS.map(c => c.replace('0.8', '0.15'))

const tooltipConfig = {
  backgroundColor: 'rgba(13, 13, 21, 0.95)',
  borderColor: 'rgba(108, 92, 231, 0.3)',
  borderWidth: 1,
  cornerRadius: 10,
  padding: 12,
  titleFont: { weight: '600' },
}

// Helper: detect numeric columns
function getNumericColumns(data, columns) {
  return columns.filter(col =>
    data.slice(0, 50).some(row => {
      const val = row[col]
      return val !== '' && val !== null && val !== undefined && !isNaN(parseFloat(val))
    })
  )
}

// Helper: detect categorical columns (non-numeric with limited unique values)
function getCategoricalColumns(data, columns) {
  return columns.filter(col => {
    const uniqueVals = new Set(data.map(row => row[col]).filter(v => v !== '' && v !== null && v !== undefined))
    const isNumeric = data.slice(0, 50).every(row => {
      const val = row[col]
      return val === '' || val === null || val === undefined || !isNaN(parseFloat(val))
    })
    return !isNumeric && uniqueVals.size > 1 && uniqueVals.size <= 30
  })
}

// Helper: get numeric values for a column
function getNumericValues(data, col) {
  return data.map(r => parseFloat(r[col])).filter(v => !isNaN(v))
}

// Dynamic Bar Chart from CSV data
function DynamicBarChart({ data, columns, selectedNumCol, selectedCatCol }) {
  const chartData = useMemo(() => {
    if (!data || !selectedNumCol) return null

    if (selectedCatCol) {
      // Group by category and sum/average
      const groups = {}
      data.forEach(row => {
        const cat = row[selectedCatCol] || 'Unknown'
        const val = parseFloat(row[selectedNumCol])
        if (!isNaN(val)) {
          if (!groups[cat]) groups[cat] = { sum: 0, count: 0 }
          groups[cat].sum += val
          groups[cat].count++
        }
      })
      const labels = Object.keys(groups).slice(0, 20)
      const values = labels.map(l => +(groups[l].sum / groups[l].count).toFixed(2))

      return {
        labels,
        datasets: [{
          label: `Avg ${selectedNumCol} by ${selectedCatCol}`,
          data: values,
          backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
          borderColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length].replace('0.8', '1')),
          borderWidth: 1,
          borderRadius: 6,
        }],
      }
    } else {
      // Show first 30 rows
      const values = data.slice(0, 30).map(r => parseFloat(r[selectedNumCol])).filter(v => !isNaN(v))
      return {
        labels: values.map((_, i) => `Row ${i + 1}`),
        datasets: [{
          label: selectedNumCol,
          data: values,
          backgroundColor: 'rgba(108, 92, 231, 0.6)',
          borderColor: 'rgba(108, 92, 231, 1)',
          borderWidth: 1,
          borderRadius: 6,
        }],
      }
    }
  }, [data, selectedNumCol, selectedCatCol])

  if (!chartData) return <div className="no-chart">Select columns to generate chart</div>

  return (
    <Bar
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top', align: 'end' }, tooltip: tooltipConfig },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' } },
          x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } },
        },
      }}
    />
  )
}

// Dynamic Line Chart
function DynamicLineChart({ data, numericCols }) {
  const chartData = useMemo(() => {
    if (!data || numericCols.length === 0) return null

    const cols = numericCols.slice(0, 3) // Show up to 3 numeric columns
    const sampleData = data.slice(0, 50) // Sample 50 rows

    return {
      labels: sampleData.map((_, i) => i + 1),
      datasets: cols.map((col, idx) => ({
        label: col,
        data: sampleData.map(r => parseFloat(r[col]) || 0),
        borderColor: CHART_COLORS[idx],
        backgroundColor: CHART_COLORS_BG[idx],
        fill: idx === 0,
        tension: 0.4,
        pointBackgroundColor: CHART_COLORS[idx],
        pointBorderColor: '#0d0d15',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
      })),
    }
  }, [data, numericCols])

  if (!chartData) return <div className="no-chart">No numeric data available</div>

  return (
    <Line
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'top', align: 'end' }, tooltip: tooltipConfig },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' } },
          x: { grid: { display: false }, title: { display: true, text: 'Row Index', color: '#6b6b80' } },
        },
      }}
    />
  )
}

// Dynamic Distribution Chart (for a categorical column)
function DynamicDistributionChart({ data, catCol }) {
  const chartData = useMemo(() => {
    if (!data || !catCol) return null

    const counts = {}
    data.forEach(row => {
      const val = row[catCol] || 'Unknown'
      counts[val] = (counts[val] || 0) + 1
    })

    // Sort by count desc, take top 8
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    const labels = sorted.map(([k]) => k)
    const values = sorted.map(([, v]) => v)

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: CHART_COLORS.slice(0, labels.length),
        borderColor: 'rgba(6, 6, 11, 1)',
        borderWidth: 3,
        hoverOffset: 8,
      }],
    }
  }, [data, catCol])

  if (!chartData) return <div className="no-chart">No categorical data available</div>

  return (
    <Doughnut
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: { legend: { display: true, position: 'bottom' }, tooltip: tooltipConfig },
      }}
    />
  )
}

// Dynamic Pie Chart (different categorical column)
function DynamicPieChart({ data, catCol }) {
  const chartData = useMemo(() => {
    if (!data || !catCol) return null

    const counts = {}
    data.forEach(row => {
      const val = row[catCol] || 'Unknown'
      counts[val] = (counts[val] || 0) + 1
    })

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8)
    const labels = sorted.map(([k]) => k)
    const values = sorted.map(([, v]) => v)

    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: CHART_COLORS.slice(0, labels.length),
        borderColor: 'rgba(6, 6, 11, 1)',
        borderWidth: 3,
        hoverOffset: 6,
      }],
    }
  }, [data, catCol])

  if (!chartData) return <div className="no-chart">No categorical data available</div>

  return (
    <Pie
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: true, position: 'bottom' }, tooltip: tooltipConfig },
      }}
    />
  )
}

// AI Insights dynamically generated from data
function DynamicInsightsPanel({ data, columns, numericCols, categoricalCols }) {
  const insights = useMemo(() => {
    if (!data || data.length === 0) return []

    const result = []

    // Total rows insight
    result.push({
      icon: '📊',
      title: 'Dataset Overview',
      text: `Your dataset contains ${data.length.toLocaleString()} rows and ${columns.length} columns (${numericCols.length} numeric, ${categoricalCols.length} categorical).`,
      type: 'info',
    })

    // Numeric column insights
    numericCols.slice(0, 3).forEach(col => {
      const values = getNumericValues(data, col)
      if (values.length === 0) return

      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const max = Math.max(...values)
      const min = Math.min(...values)
      const range = max - min
      const sorted = [...values].sort((a, b) => a - b)
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]

      result.push({
        icon: '📈',
        title: `${col} Analysis`,
        text: `Mean: ${mean.toFixed(2)}, Median: ${median.toFixed(2)}, Range: ${min.toFixed(2)} – ${max.toFixed(2)} (spread: ${range.toFixed(2)}).`,
        type: 'positive',
      })

      // Outlier detection (simple IQR method)
      const q1 = sorted[Math.floor(sorted.length * 0.25)]
      const q3 = sorted[Math.floor(sorted.length * 0.75)]
      const iqr = q3 - q1
      const outliers = values.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr)
      if (outliers.length > 0) {
        result.push({
          icon: '⚠️',
          title: `${col} Outliers Detected`,
          text: `Found ${outliers.length} potential outlier${outliers.length > 1 ? 's' : ''} in "${col}" (values outside IQR bounds). Consider investigating rows with extreme values.`,
          type: 'warning',
        })
      }
    })

    // Categorical insights
    categoricalCols.slice(0, 2).forEach(col => {
      const counts = {}
      data.forEach(row => {
        const val = row[col] || 'Unknown'
        counts[val] = (counts[val] || 0) + 1
      })
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
      const topCategory = sorted[0]
      const uniqueCount = sorted.length

      result.push({
        icon: '🎯',
        title: `${col} Distribution`,
        text: `${uniqueCount} unique values found. Top category: "${topCategory[0]}" appears ${topCategory[1]} times (${((topCategory[1] / data.length) * 100).toFixed(1)}% of data).`,
        type: 'info',
      })
    })

    // Missing data check
    const missingCols = columns.filter(col => {
      const missingCount = data.filter(row => row[col] === '' || row[col] === null || row[col] === undefined).length
      return missingCount > 0
    })
    if (missingCols.length > 0) {
      result.push({
        icon: '💡',
        title: 'Missing Data Recommendation',
        text: `${missingCols.length} column${missingCols.length > 1 ? 's have' : ' has'} missing values (${missingCols.slice(0, 3).join(', ')}${missingCols.length > 3 ? '...' : ''}). Consider imputation or removal for cleaner analysis.`,
        type: 'suggestion',
      })
    }

    return result
  }, [data, columns, numericCols, categoricalCols])

  if (insights.length === 0) return null

  return (
    <div className="insights-panel">
      <h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
        </svg>
        AI-Generated Insights from Your Data
      </h3>
      <div className="insights-list">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            className={`insight-item ${insight.type}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
          >
            <span className="insight-icon">{insight.icon}</span>
            <div className="insight-content">
              <h5>{insight.title}</h5>
              <p>{insight.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// Empty state when no data uploaded
function NoDataState() {
  const navigate = useNavigate()
  return (
    <motion.div
      className="no-data-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="no-data-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      </div>
      <h2>No Data to Visualize</h2>
      <p>Upload a CSV or Excel file first to see interactive charts and AI-powered insights based on your data.</p>
      <button className="btn-hero-primary" onClick={() => navigate('/upload')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        Upload a File
      </button>
    </motion.div>
  )
}

export default function Visualization() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { uploadedData, uploadedColumns, uploadedFileName, uploadedStats } = useData()

  // Derived column types
  const numericCols = useMemo(() =>
    uploadedData ? getNumericColumns(uploadedData, uploadedColumns) : [], [uploadedData, uploadedColumns])
  const categoricalCols = useMemo(() =>
    uploadedData ? getCategoricalColumns(uploadedData, uploadedColumns) : [], [uploadedData, uploadedColumns])

  // Auto-select columns for charts
  const [selectedBarNum, setSelectedBarNum] = useState('')
  const [selectedBarCat, setSelectedBarCat] = useState('')

  // Auto-select when data arrives
  React.useEffect(() => {
    if (numericCols.length > 0 && !selectedBarNum) setSelectedBarNum(numericCols[0])
    if (categoricalCols.length > 0 && !selectedBarCat) setSelectedBarCat(categoricalCols[0])
  }, [numericCols, categoricalCols])

  const hasData = uploadedData && uploadedData.length > 0

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} currentPath="/visualization" />
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="page-enter">
          <div className="dash-header">
            <div>
              <h1>Visualizations</h1>
              <p>
                {hasData
                  ? `Showing charts generated from "${uploadedFileName}" (${uploadedData.length.toLocaleString()} rows)`
                  : 'Upload a CSV file to see interactive visualizations.'
                }
              </p>
            </div>
            {hasData && (
              <div className="viz-file-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
                {uploadedFileName}
              </div>
            )}
          </div>

          {!hasData ? (
            <NoDataState />
          ) : (
            <>
              {/* Quick Metrics from actual data */}
              <div className="viz-metrics">
                {[
                  { label: 'Total Rows', value: uploadedData.length.toLocaleString(), color: '#6c5ce7' },
                  { label: 'Columns', value: uploadedColumns.length, color: '#00d2ff' },
                  { label: 'Numeric Fields', value: numericCols.length, color: '#00e676' },
                  { label: 'Categories', value: categoricalCols.length, color: '#f72585' },
                ].map((metric, i) => (
                  <motion.div
                    key={i}
                    className="viz-metric glass-card"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -3 }}
                  >
                    <div className="metric-dot" style={{ background: metric.color }} />
                    <span className="metric-label">{metric.label}</span>
                    <span className="metric-value">{metric.value}</span>
                  </motion.div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="viz-grid">
                {/* Bar Chart - configurable */}
                <motion.div
                  className="viz-card glass-card chart-wide"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="viz-card-header">
                    <h3>
                      {selectedBarCat
                        ? `${selectedBarNum} by ${selectedBarCat}`
                        : `${selectedBarNum || 'Select Column'} Distribution`
                      }
                    </h3>
                    <div className="chart-controls">
                      <select
                        value={selectedBarNum}
                        onChange={(e) => setSelectedBarNum(e.target.value)}
                        className="chart-select"
                      >
                        <option value="">Numeric Column</option>
                        {numericCols.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                      <select
                        value={selectedBarCat}
                        onChange={(e) => setSelectedBarCat(e.target.value)}
                        className="chart-select"
                      >
                        <option value="">Group By (optional)</option>
                        {categoricalCols.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="chart-container-lg">
                    <DynamicBarChart
                      data={uploadedData}
                      columns={uploadedColumns}
                      selectedNumCol={selectedBarNum}
                      selectedCatCol={selectedBarCat}
                    />
                  </div>
                </motion.div>

                {/* Line Chart - trend of numeric columns */}
                {numericCols.length > 0 && (
                  <motion.div
                    className="viz-card glass-card chart-wide"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="viz-card-header">
                      <h3>Trend Analysis ({numericCols.slice(0, 3).join(', ')})</h3>
                      <span className="viz-card-badge">Line</span>
                    </div>
                    <div className="chart-container-lg">
                      <DynamicLineChart data={uploadedData} numericCols={numericCols} />
                    </div>
                  </motion.div>
                )}

                {/* Distribution - first categorical column */}
                {categoricalCols.length > 0 && (
                  <motion.div
                    className="viz-card glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="viz-card-header">
                      <h3>{categoricalCols[0]} Distribution</h3>
                      <span className="viz-card-badge">Doughnut</span>
                    </div>
                    <div className="chart-container-md">
                      <DynamicDistributionChart data={uploadedData} catCol={categoricalCols[0]} />
                    </div>
                  </motion.div>
                )}

                {/* Pie chart - second categorical column if available */}
                {categoricalCols.length > 1 && (
                  <motion.div
                    className="viz-card glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="viz-card-header">
                      <h3>{categoricalCols[1]} Breakdown</h3>
                      <span className="viz-card-badge">Pie</span>
                    </div>
                    <div className="chart-container-md">
                      <DynamicPieChart data={uploadedData} catCol={categoricalCols[1]} />
                    </div>
                  </motion.div>
                )}

                {/* If only one or no categorical columns, show another bar */}
                {categoricalCols.length <= 1 && numericCols.length > 1 && (
                  <motion.div
                    className="viz-card glass-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="viz-card-header">
                      <h3>{numericCols[1]} Overview</h3>
                      <span className="viz-card-badge">Bar</span>
                    </div>
                    <div className="chart-container-md">
                      <DynamicBarChart
                        data={uploadedData}
                        columns={uploadedColumns}
                        selectedNumCol={numericCols[1]}
                        selectedCatCol=""
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* AI Insights from actual data */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <DynamicInsightsPanel
                  data={uploadedData}
                  columns={uploadedColumns}
                  numericCols={numericCols}
                  categoricalCols={categoricalCols}
                />
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
