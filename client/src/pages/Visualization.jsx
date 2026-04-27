import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
import { PageShell } from './Dashboard'
import { useData } from '../context/DataContext'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
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

// Download chart as PNG
function downloadChartAsPNG(chartRef, title) {
  if (!chartRef?.current) return
  const canvas = chartRef.current.canvas
  const url = canvas.toDataURL('image/png', 1.0)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`
  a.click()
}

// Reusable Chart Card with download button
function ChartCard({ title, badge, description, wide, delay = 0, children, chartRef, controls }) {
  return (
    <motion.div
      className={`viz-card glass-card ${wide ? 'chart-wide' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="viz-card-header">
        <div>
          <h3>{title}</h3>
          {description && <p className="chart-description">{description}</p>}
        </div>
        <div className="viz-card-actions">
          {controls}
          {badge && <span className="viz-card-badge">{badge}</span>}
          {chartRef && (
            <button
              className="chart-download-btn"
              onClick={() => downloadChartAsPNG(chartRef, title)}
              title="Download as PNG"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  )
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

// Scatter Plot for correlation between two numeric columns
function DynamicScatterPlot({ data, xCol, yCol, catCol }) {
  const chartData = useMemo(() => {
    if (!data || !xCol || !yCol) return null

    if (catCol) {
      // Color by category
      const categories = [...new Set(data.map(r => String(r[catCol] || 'Unknown')))].slice(0, 8)
      return {
        datasets: categories.map((cat, idx) => ({
          label: cat,
          data: data
            .filter(r => String(r[catCol] || 'Unknown') === cat)
            .map(r => ({ x: parseFloat(r[xCol]) || 0, y: parseFloat(r[yCol]) || 0 }))
            .filter(p => !isNaN(p.x) && !isNaN(p.y)),
          backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
          pointRadius: 5,
          pointHoverRadius: 8,
        })),
      }
    }

    return {
      datasets: [{
        label: `${xCol} vs ${yCol}`,
        data: data.map(r => ({ x: parseFloat(r[xCol]) || 0, y: parseFloat(r[yCol]) || 0 }))
          .filter(p => !isNaN(p.x) && !isNaN(p.y)),
        backgroundColor: CHART_COLORS[0],
        pointRadius: 5,
        pointHoverRadius: 8,
      }],
    }
  }, [data, xCol, yCol, catCol])

  if (!chartData) return <div className="no-chart">Select two numeric columns</div>

  return (
    <Scatter
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: !!catCol, position: 'top' }, tooltip: tooltipConfig },
        scales: {
          x: { title: { display: true, text: xCol, color: '#6b6b80' }, grid: { color: 'rgba(255,255,255,0.03)' } },
          y: { title: { display: true, text: yCol, color: '#6b6b80' }, grid: { color: 'rgba(255,255,255,0.03)' } },
        },
      }}
    />
  )
}

// Heatmap-style correlation matrix (using bar chart visualization)
function CorrelationMatrix({ data, numericCols }) {
  const correlations = useMemo(() => {
    if (!data || numericCols.length < 2) return null

    const cols = numericCols.slice(0, 6)
    const values = {}
    cols.forEach(col => {
      values[col] = data.map(r => parseFloat(r[col])).filter(v => !isNaN(v))
    })

    // Compute Pearson correlation
    const results = []
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        const a = values[cols[i]], b = values[cols[j]]
        const n = Math.min(a.length, b.length)
        if (n < 3) continue
        const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n
        const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n
        let num = 0, denA = 0, denB = 0
        for (let k = 0; k < n; k++) {
          const da = a[k] - meanA, db = b[k] - meanB
          num += da * db; denA += da * da; denB += db * db
        }
        const r = denA && denB ? num / Math.sqrt(denA * denB) : 0
        results.push({ pair: `${cols[i]} × ${cols[j]}`, r: +r.toFixed(3) })
      }
    }
    return results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
  }, [data, numericCols])

  if (!correlations || correlations.length === 0) return <div className="no-chart">Need 2+ numeric columns</div>

  const chartData = {
    labels: correlations.map(c => c.pair),
    datasets: [{
      label: 'Correlation (r)',
      data: correlations.map(c => c.r),
      backgroundColor: correlations.map(c =>
        c.r > 0.5 ? 'rgba(0, 230, 118, 0.7)' :
        c.r > 0 ? 'rgba(0, 210, 255, 0.7)' :
        c.r > -0.5 ? 'rgba(255, 167, 38, 0.7)' :
        'rgba(247, 37, 133, 0.7)'
      ),
      borderRadius: 6,
      borderWidth: 0,
    }],
  }

  return (
    <Bar
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: tooltipConfig },
        scales: {
          x: { min: -1, max: 1, grid: { color: 'rgba(255,255,255,0.03)' }, title: { display: true, text: 'Correlation Coefficient', color: '#6b6b80' } },
          y: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
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

// AI-recommended Bar Chart
function AIBarChart({ data, chart }) {
  const chartData = useMemo(() => {
    if (!data || !chart) return null
    const xCol = chart.xColumn
    const yCol = chart.yColumn
    const agg = chart.aggregation || 'avg'

    if (!xCol || !yCol) return null

    // Group by xColumn
    const groups = {}
    data.forEach(row => {
      const cat = String(row[xCol] || 'Unknown').trim()
      const val = parseFloat(row[yCol])
      if (!isNaN(val)) {
        if (!groups[cat]) groups[cat] = { sum: 0, count: 0 }
        groups[cat].sum += val
        groups[cat].count++
      }
    })

    const sorted = Object.entries(groups).sort((a, b) => {
      if (agg === 'count') return b[1].count - a[1].count
      return (b[1].sum / b[1].count) - (a[1].sum / a[1].count)
    })
    const top = sorted.slice(0, 20)
    const labels = top.map(([k]) => k)
    const values = top.map(([, v]) => {
      if (agg === 'sum') return +v.sum.toFixed(2)
      if (agg === 'count') return v.count
      return +(v.sum / v.count).toFixed(2)
    })

    return {
      labels,
      datasets: [{
        label: `${agg === 'sum' ? 'Total' : agg === 'count' ? 'Count' : 'Avg'} ${yCol} by ${xCol}`,
        data: values,
        backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length].replace('0.8', '1')),
        borderWidth: 1,
        borderRadius: 6,
      }],
    }
  }, [data, chart])

  if (!chartData) return <div className="no-chart">Unable to generate chart</div>

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

// AI-recommended Pie Chart
function AIPieChart({ data, chart }) {
  const chartData = useMemo(() => {
    if (!data || !chart) return null
    const catCol = chart.column
    const valCol = chart.valueColumn

    if (!catCol) return null

    if (valCol) {
      // Sum values by category
      const groups = {}
      data.forEach(row => {
        const cat = String(row[catCol] || 'Unknown').trim()
        const val = parseFloat(row[valCol])
        if (!isNaN(val)) {
          groups[cat] = (groups[cat] || 0) + val
        }
      })
      const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 10)
      return {
        labels: sorted.map(([k]) => k),
        datasets: [{
          data: sorted.map(([, v]) => +v.toFixed(2)),
          backgroundColor: CHART_COLORS.slice(0, sorted.length),
          borderColor: 'rgba(6, 6, 11, 1)',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      }
    } else {
      // Count occurrences
      const counts = {}
      data.forEach(row => {
        const val = String(row[catCol] || 'Unknown').trim()
        counts[val] = (counts[val] || 0) + 1
      })
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
      return {
        labels: sorted.map(([k]) => k),
        datasets: [{
          data: sorted.map(([, v]) => v),
          backgroundColor: CHART_COLORS.slice(0, sorted.length),
          borderColor: 'rgba(6, 6, 11, 1)',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      }
    }
  }, [data, chart])

  if (!chartData) return <div className="no-chart">Unable to generate chart</div>

  return (
    <Pie
      data={chartData}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: {
            ...tooltipConfig,
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
                const pct = ((ctx.raw / total) * 100).toFixed(1)
                return `${ctx.label}: ${ctx.raw.toLocaleString()} (${pct}%)`
              }
            }
          }
        },
      }}
    />
  )
}

// AI Summary Panel
function AISummaryPanel({ summary, loading }) {
  if (loading) {
    return (
      <motion.div className="ai-summary-panel glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="ai-summary-header">
          <span className="ai-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
            AI Analysis
          </span>
          <span className="ai-loading-text">Analyzing your data with AI...</span>
        </div>
        <div className="ai-summary-skeleton">
          <div className="skeleton-line w80" /><div className="skeleton-line w100" /><div className="skeleton-line w60" />
        </div>
      </motion.div>
    )
  }
  if (!summary) return null

  return (
    <motion.div className="ai-summary-panel glass-card" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      <div className="ai-summary-header">
        <span className="ai-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          AI-Powered Summary
        </span>
      </div>
      <p className="ai-summary-text">{summary}</p>
    </motion.div>
  )
}

// Ask AI about data
function AskAIPanel({ columns, sampleData, stats, numericColumns, categoricalColumns, fileName, rowCount }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAsk = async () => {
    if (!question.trim() || loading) return
    setLoading(true)
    setAnswer('')
    try {
      const resp = await fetch('http://localhost:5001/api/datasets/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          columns,
          sampleData: sampleData.slice(0, 50),
          stats,
          numericColumns,
          categoricalColumns,
          fileName,
          rowCount,
        }),
      })
      const data = await resp.json()
      setAnswer(data.answer || data.error || 'No response received.')
    } catch (err) {
      setAnswer('Failed to connect to AI. Please try again.')
    }
    setLoading(false)
  }

  return (
    <motion.div className="ask-ai-panel glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Ask AI About Your Data
      </h3>
      <div className="ask-ai-input-row">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="e.g. What are the top 5 categories by revenue? Which column has the most outliers?"
          disabled={loading}
        />
        <button onClick={handleAsk} disabled={loading || !question.trim()} className={`ai-ask-btn ${question.trim() ? 'active' : ''}`}>
          {loading ? (
            <div className="ask-spinner" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          )}
        </button>
      </div>
      <AnimatePresence>
        {answer && (
          <motion.div className="ask-ai-answer" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <div className="ai-answer-content" dangerouslySetInnerHTML={{ __html: formatMarkdown(answer) }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Simple markdown formatter
function formatMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, m => `<pre><code>${m.slice(3, -3).replace(/^\w+\n/, '')}</code></pre>`)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/^- (.+)$/gm, '• $1<br/>')
    .replace(/^\d+\. (.+)$/gm, (m, p1, offset, str) => `${m.match(/^\d+/)[0]}. ${p1}<br/>`)
    .replace(/\n/g, '<br/>')
}

export default function Visualization() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { uploadedData, uploadedColumns, uploadedFileName, uploadedStats, addActivity } = useData()

  // Derived column types
  const numericCols = useMemo(() =>
    uploadedData ? getNumericColumns(uploadedData, uploadedColumns) : [], [uploadedData, uploadedColumns])
  const categoricalCols = useMemo(() =>
    uploadedData ? getCategoricalColumns(uploadedData, uploadedColumns) : [], [uploadedData, uploadedColumns])

  // Auto-select columns for manual chart
  const [selectedBarNum, setSelectedBarNum] = useState('')
  const [selectedBarCat, setSelectedBarCat] = useState('')

  // Scatter plot column selectors
  const [scatterX, setScatterX] = useState('')
  const [scatterY, setScatterY] = useState('')
  const [scatterCat, setScatterCat] = useState('')

  // Chart refs for PNG download
  const barChartRef = useRef(null)
  const lineChartRef = useRef(null)
  const doughnutChartRef = useRef(null)
  const pieChartRef = useRef(null)
  const scatterChartRef = useRef(null)
  const correlationChartRef = useRef(null)

  // AI analysis state
  const [aiSummary, setAiSummary] = useState('')
  const [aiCharts, setAiCharts] = useState([])
  const [aiInsights, setAiInsights] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // Auto-select when data arrives
  useEffect(() => {
    if (numericCols.length > 0 && !selectedBarNum) setSelectedBarNum(numericCols[0])
    if (categoricalCols.length > 0 && !selectedBarCat) setSelectedBarCat(categoricalCols[0])
    if (numericCols.length > 0 && !scatterX) setScatterX(numericCols[0])
    if (numericCols.length > 1 && !scatterY) setScatterY(numericCols[1])
  }, [numericCols, categoricalCols])

  // Fetch AI analysis when data changes
  const fetchAIAnalysis = useCallback(async () => {
    if (!uploadedData || uploadedData.length === 0) return
    setAiLoading(true)
    setAiError('')
    try {
      const resp = await fetch('http://localhost:5001/api/datasets/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          columns: uploadedColumns,
          sampleData: uploadedData.slice(0, 50),
          stats: uploadedStats,
          numericColumns: numericCols,
          categoricalColumns: categoricalCols,
          fileName: uploadedFileName,
          rowCount: uploadedData.length,
        }),
      })
      const result = await resp.json()
      if (result.error) {
        setAiError(result.error)
      } else {
        setAiSummary(result.summary || '')
        setAiCharts(result.charts || [])
        setAiInsights(result.insights || [])
      }
    } catch (err) {
      setAiError('Failed to connect to AI analysis service.')
    }
    setAiLoading(false)
  }, [uploadedData, uploadedColumns, uploadedStats, uploadedFileName, numericCols, categoricalCols])

  useEffect(() => {
    if (uploadedData && uploadedData.length > 0 && numericCols.length + categoricalCols.length > 0) {
      fetchAIAnalysis()
    }
  }, [uploadedData?.length, uploadedColumns?.length])

  const hasData = uploadedData && uploadedData.length > 0

  // Past analyses state
  const [pastAnalyses, setPastAnalyses] = useState([])
  const [showPastAnalyses, setShowPastAnalyses] = useState(false)
  const [savingAnalysis, setSavingAnalysis] = useState(false)

  const saveAnalysis = useCallback(async () => {
    if (!aiSummary && aiInsights.length === 0) return
    setSavingAnalysis(true)
    try {
      await fetch('http://localhost:5001/api/datasets/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: uploadedFileName,
          summary: aiSummary,
          insights: aiInsights,
          charts: aiCharts,
          rowCount: uploadedData?.length || 0,
          columns: uploadedColumns,
        }),
      })
      toast.success('Analysis saved!')
      addActivity('visualization', 'Saved AI analysis', uploadedFileName)
      loadPastAnalyses()
    } catch { toast.error('Failed to save') }
    setSavingAnalysis(false)
  }, [aiSummary, aiInsights, aiCharts, uploadedFileName, uploadedData, uploadedColumns])

  const loadPastAnalyses = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:5001/api/datasets/analyses')
      const data = await resp.json()
      setPastAnalyses(data)
    } catch {}
  }, [])

  const deletePastAnalysis = useCallback(async (id) => {
    try {
      await fetch(`http://localhost:5001/api/datasets/analyses/${id}`, { method: 'DELETE' })
      setPastAnalyses(prev => prev.filter(a => a._id !== id))
    } catch {}
  }, [])

  useEffect(() => { loadPastAnalyses() }, [])

  // PDF Export
  const [exportingPdf, setExportingPdf] = useState(false)
  const exportToPDF = useCallback(async () => {
    setExportingPdf(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15
      let yPos = 20

      // Title
      pdf.setFontSize(22)
      pdf.setTextColor(108, 92, 231)
      pdf.text('InsightFlow Report', margin, yPos)
      yPos += 10

      pdf.setFontSize(11)
      pdf.setTextColor(100, 100, 120)
      pdf.text(`File: ${uploadedFileName}  |  Rows: ${uploadedData.length}  |  ${new Date().toLocaleDateString()}`, margin, yPos)
      yPos += 12

      // AI Summary
      if (aiSummary) {
        pdf.setFontSize(14)
        pdf.setTextColor(40, 40, 60)
        pdf.text('AI Summary', margin, yPos)
        yPos += 7
        pdf.setFontSize(9)
        pdf.setTextColor(80, 80, 100)
        const summaryLines = pdf.splitTextToSize(aiSummary, pageWidth - margin * 2)
        summaryLines.forEach(line => {
          if (yPos > 270) { pdf.addPage(); yPos = 20 }
          pdf.text(line, margin, yPos)
          yPos += 5
        })
        yPos += 8
      }

      // Add charts as images
      const chartRefs = [
        { ref: barChartRef, label: 'Bar Chart' },
        { ref: lineChartRef, label: 'Line Chart' },
        { ref: scatterChartRef, label: 'Scatter Plot' },
        { ref: correlationChartRef, label: 'Correlation Matrix' },
        { ref: doughnutChartRef, label: 'Doughnut Chart' },
        { ref: pieChartRef, label: 'Pie Chart' },
      ]

      for (const { ref, label } of chartRefs) {
        const chart = ref.current
        if (!chart) continue
        try {
          const canvas = chart.canvas || chart
          const imgData = canvas.toDataURL('image/png', 0.9)
          const imgWidth = pageWidth - margin * 2
          const imgHeight = (canvas.height / canvas.width) * imgWidth

          if (yPos + imgHeight + 12 > 280) { pdf.addPage(); yPos = 20 }

          pdf.setFontSize(12)
          pdf.setTextColor(60, 60, 80)
          pdf.text(label, margin, yPos)
          yPos += 6
          pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight)
          yPos += imgHeight + 10
        } catch {}
      }

      // Data Statistics
      if (uploadedStats) {
        if (yPos > 220) { pdf.addPage(); yPos = 20 }
        pdf.setFontSize(14)
        pdf.setTextColor(40, 40, 60)
        pdf.text('Data Statistics', margin, yPos)
        yPos += 8
        pdf.setFontSize(8)
        pdf.setTextColor(80, 80, 100)
        for (const col of numericCols.slice(0, 10)) {
          const stat = uploadedStats[col]
          if (!stat) continue
          if (yPos > 275) { pdf.addPage(); yPos = 20 }
          pdf.text(`${col}: mean=${stat.mean?.toFixed(2) || 'N/A'}, min=${stat.min?.toFixed(2) || 'N/A'}, max=${stat.max?.toFixed(2) || 'N/A'}, std=${stat.std?.toFixed(2) || 'N/A'}`, margin, yPos)
          yPos += 5
        }
      }

      pdf.save(`InsightFlow_Report_${uploadedFileName.replace(/\.[^.]+$/, '')}.pdf`)
      addActivity('export', 'Exported PDF report', uploadedFileName)
    } catch (err) {
      console.error('PDF export failed:', err)
    }
    setExportingPdf(false)
  }, [uploadedData, uploadedFileName, uploadedStats, aiSummary, numericCols, barChartRef, lineChartRef, scatterChartRef, correlationChartRef, doughnutChartRef, pieChartRef])

  // Separate AI charts by type
  const aiBarCharts = aiCharts.filter(c => c.type === 'bar')
  const aiPieCharts = aiCharts.filter(c => c.type === 'pie')

  return (
    <PageShell currentPath="/visualization" breadcrumb="Visualizations">
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
              <div className="dash-header-actions">
                <button className="btn-outline" onClick={exportToPDF} disabled={exportingPdf}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  {exportingPdf ? 'Exporting...' : 'Export PDF'}
                </button>
                <button className="btn-outline" onClick={saveAnalysis} disabled={savingAnalysis || (!aiSummary && aiInsights.length === 0)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {savingAnalysis ? 'Saving...' : 'Save Analysis'}
                </button>
                <button className="btn-outline" onClick={() => setShowPastAnalyses(!showPastAnalyses)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  History
                </button>
                <button className="btn-outline" onClick={fetchAIAnalysis} disabled={aiLoading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                  {aiLoading ? 'Analyzing...' : 'Re-analyze with AI'}
                </button>
                <div className="viz-file-badge">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                  </svg>
                  {uploadedFileName}
                </div>
              </div>
            )}
          </div>

          {!hasData ? (
            <NoDataState />
          ) : (
            <>
              {/* Past Analyses Panel */}
              <AnimatePresence>
                {showPastAnalyses && (
                  <motion.div
                    className="past-analyses-panel glass-card"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden', marginBottom: '24px', padding: '20px', borderRadius: '16px' }}
                  >
                    <h3 style={{ marginBottom: '12px', fontSize: '1rem', color: 'var(--text-primary)' }}>
                      Past Analyses ({pastAnalyses.length})
                    </h3>
                    {pastAnalyses.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No saved analyses yet.</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                        {pastAnalyses.map(a => (
                          <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{a.fileName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {a.rowCount} rows · {a.columns?.length || 0} cols · {new Date(a.created_at).toLocaleDateString()}
                              </div>
                              {a.summary && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', maxHeight: '40px', overflow: 'hidden' }}>{a.summary.slice(0, 150)}...</div>}
                            </div>
                            <button onClick={() => deletePastAnalysis(a._id)} style={{ padding: '6px', borderRadius: '6px', background: 'rgba(255,82,82,0.1)', color: '#ff5252', border: 'none', cursor: 'pointer' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

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

              {/* AI Summary */}
              <AISummaryPanel summary={aiSummary} loading={aiLoading} />

              {/* AI Error */}
              {aiError && (
                <div className="ai-error glass-card">
                  <span>⚠️ {aiError}</span>
                  <button onClick={fetchAIAnalysis}>Retry</button>
                </div>
              )}

              {/* AI-Recommended Charts */}
              {aiCharts.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <h2 className="section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                    AI-Recommended Charts
                  </h2>
                  <div className="viz-grid">
                    {aiCharts.map((chart, i) => (
                      <motion.div
                        key={i}
                        className={`viz-card glass-card ${i === 0 ? 'chart-wide' : ''}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <div className="viz-card-header">
                          <div>
                            <h3>{chart.title}</h3>
                            <p className="chart-description">{chart.description}</p>
                          </div>
                          <span className="viz-card-badge">{chart.type === 'pie' ? 'Pie' : 'Bar'}</span>
                        </div>
                        <div className={i === 0 ? 'chart-container-lg' : 'chart-container-md'}>
                          {chart.type === 'bar' ? (
                            <AIBarChart data={uploadedData} chart={chart} />
                          ) : (
                            <AIPieChart data={uploadedData} chart={chart} />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Manual Charts Section */}
              <h2 className="section-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
                Custom Charts
              </h2>
              <div className="viz-grid">
                {/* Bar Chart - configurable */}
                <ChartCard
                  title={selectedBarCat ? `${selectedBarNum} by ${selectedBarCat}` : `${selectedBarNum || 'Select Column'} Distribution`}
                  wide
                  delay={0.2}
                  chartRef={barChartRef}
                  controls={
                    <div className="chart-controls">
                      <select value={selectedBarNum} onChange={(e) => setSelectedBarNum(e.target.value)} className="chart-select">
                        <option value="">Numeric Column</option>
                        {numericCols.map(col => <option key={col} value={col}>{col}</option>)}
                      </select>
                      <select value={selectedBarCat} onChange={(e) => setSelectedBarCat(e.target.value)} className="chart-select">
                        <option value="">Group By (optional)</option>
                        {categoricalCols.map(col => <option key={col} value={col}>{col}</option>)}
                      </select>
                    </div>
                  }
                >
                  <div className="chart-container-lg">
                    <DynamicBarChart ref={barChartRef} data={uploadedData} columns={uploadedColumns} selectedNumCol={selectedBarNum} selectedCatCol={selectedBarCat} />
                  </div>
                </ChartCard>

                {/* Line Chart */}
                {numericCols.length > 0 && (
                  <ChartCard title={`Trend Analysis (${numericCols.slice(0, 3).join(', ')})`} badge="Line" wide delay={0.3} chartRef={lineChartRef}>
                    <div className="chart-container-lg">
                      <DynamicLineChart ref={lineChartRef} data={uploadedData} numericCols={numericCols} />
                    </div>
                  </ChartCard>
                )}

                {/* Scatter Plot */}
                {numericCols.length >= 2 && (
                  <ChartCard
                    title={`${scatterX} vs ${scatterY}`}
                    badge="Scatter"
                    wide
                    delay={0.35}
                    chartRef={scatterChartRef}
                    controls={
                      <div className="chart-controls">
                        <select value={scatterX} onChange={(e) => setScatterX(e.target.value)} className="chart-select">
                          {numericCols.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                        <select value={scatterY} onChange={(e) => setScatterY(e.target.value)} className="chart-select">
                          {numericCols.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                        <select value={scatterCat} onChange={(e) => setScatterCat(e.target.value)} className="chart-select">
                          <option value="">Color by...</option>
                          {categoricalCols.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                      </div>
                    }
                  >
                    <div className="chart-container-lg">
                      <Scatter
                        ref={scatterChartRef}
                        data={(() => {
                          if (!scatterX || !scatterY) return { datasets: [] }
                          if (scatterCat) {
                            const cats = [...new Set(uploadedData.map(r => String(r[scatterCat] || 'Unknown')))].slice(0, 8)
                            return {
                              datasets: cats.map((cat, idx) => ({
                                label: cat,
                                data: uploadedData.filter(r => String(r[scatterCat] || 'Unknown') === cat)
                                  .map(r => ({ x: parseFloat(r[scatterX]) || 0, y: parseFloat(r[scatterY]) || 0 })),
                                backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                                pointRadius: 5, pointHoverRadius: 8,
                              })),
                            }
                          }
                          return {
                            datasets: [{
                              label: `${scatterX} vs ${scatterY}`,
                              data: uploadedData.map(r => ({ x: parseFloat(r[scatterX]) || 0, y: parseFloat(r[scatterY]) || 0 })),
                              backgroundColor: CHART_COLORS[0], pointRadius: 5, pointHoverRadius: 8,
                            }],
                          }
                        })()}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          plugins: { legend: { display: !!scatterCat, position: 'top' }, tooltip: tooltipConfig },
                          scales: {
                            x: { title: { display: true, text: scatterX, color: '#6b6b80' }, grid: { color: 'rgba(255,255,255,0.03)' } },
                            y: { title: { display: true, text: scatterY, color: '#6b6b80' }, grid: { color: 'rgba(255,255,255,0.03)' } },
                          },
                        }}
                      />
                    </div>
                  </ChartCard>
                )}

                {/* Correlation Matrix */}
                {numericCols.length >= 2 && (
                  <ChartCard title="Correlation Matrix" badge="Heatmap" wide delay={0.4} chartRef={correlationChartRef}>
                    <div className="chart-container-lg">
                      <CorrelationMatrix ref={correlationChartRef} data={uploadedData} numericCols={numericCols} />
                    </div>
                  </ChartCard>
                )}

                {/* Distribution doughnut */}
                {categoricalCols.length > 0 && (
                  <ChartCard title={`${categoricalCols[0]} Distribution`} badge="Doughnut" delay={0.45} chartRef={doughnutChartRef}>
                    <div className="chart-container-md">
                      <DynamicDistributionChart ref={doughnutChartRef} data={uploadedData} catCol={categoricalCols[0]} />
                    </div>
                  </ChartCard>
                )}

                {/* Pie chart */}
                {categoricalCols.length > 1 && (
                  <ChartCard title={`${categoricalCols[1]} Breakdown`} badge="Pie" delay={0.5} chartRef={pieChartRef}>
                    <div className="chart-container-md">
                      <DynamicPieChart ref={pieChartRef} data={uploadedData} catCol={categoricalCols[1]} />
                    </div>
                  </ChartCard>
                )}
              </div>

              {/* AI Insights */}
              {aiInsights.length > 0 ? (
                <motion.div
                  className="insights-panel"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                    </svg>
                    AI-Generated Insights
                  </h3>
                  <div className="insights-list">
                    {aiInsights.map((insight, i) => (
                      <motion.div
                        key={i}
                        className={`insight-item ${insight.type || 'info'}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                      >
                        <span className="insight-icon">
                          {insight.type === 'positive' ? '📈' : insight.type === 'warning' ? '⚠️' : insight.type === 'suggestion' ? '💡' : '🔍'}
                        </span>
                        <div className="insight-content">
                          <h5>{insight.title}</h5>
                          <p>{insight.text}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <DynamicInsightsPanel
                  data={uploadedData}
                  columns={uploadedColumns}
                  numericCols={numericCols}
                  categoricalCols={categoricalCols}
                />
              )}

              {/* Ask AI about data */}
              <AskAIPanel
                columns={uploadedColumns}
                sampleData={uploadedData}
                stats={uploadedStats}
                numericColumns={numericCols}
                categoricalColumns={categoricalCols}
                fileName={uploadedFileName}
                rowCount={uploadedData.length}
              />
            </>
          )}
    </PageShell>
  )
}
