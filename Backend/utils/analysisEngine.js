/**
 * Data Analysis Engine
 * Performs statistical analysis on structured data
 */

/**
 * Generate statistical summary from data
 * @param {Array} data - Array of objects
 * @param {Array} columns - Column names to analyze
 * @returns {Object} - Statistical summary
 */
function generateStatisticalSummary(data, columns) {
  if (!data || data.length === 0) {
    return { error: 'No data provided' };
  }

  const summary = {};

  columns.forEach(column => {
    const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
    
    // Try to parse as numbers
    const numericValues = values
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));

    if (numericValues.length > 0) {
      summary[column] = {
        type: 'numeric',
        count: values.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
        median: getMedian(numericValues),
        stdDev: calculateStdDev(numericValues),
        uniqueValues: new Set(values).size
      };
    } else {
      // Categorical data
      summary[column] = {
        type: 'categorical',
        count: values.length,
        uniqueValues: new Set(values).size,
        mostCommon: getMostCommon(values),
        topValues: getTopValues(values, 5)
      };
    }
  });

  return summary;
}

/**
 * Calculate correlation between numeric columns
 * @param {Array} data - Array of objects
 * @param {Array} columns - Numeric column names
 * @returns {Object} - Correlation matrix
 */
function calculateCorrelations(data, columns) {
  const correlations = {};

  columns.forEach((col1, i) => {
    correlations[col1] = {};
    const values1 = data.map(r => parseFloat(r[col1])).filter(v => !isNaN(v));

    columns.forEach((col2, j) => {
      if (i === j) {
        correlations[col1][col2] = 1.0;
      } else if (i < j) {
        const values2 = data.map(r => parseFloat(r[col2])).filter(v => !isNaN(v));
        correlations[col1][col2] = calculatePearsonCorrelation(values1, values2);
      }
    });
  });

  return correlations;
}

/**
 * Identify trends in data
 * @param {Array} data - Array of objects
 * @param {string} timeColumn - Column name for time/sequence
 * @param {string} valueColumn - Column name for values to analyze
 * @returns {Object} - Trend analysis
 */
function analyzeTrends(data, timeColumn, valueColumn) {
  if (!data || data.length < 2) return { error: 'Insufficient data' };

  const points = data.map(r => ({
    time: r[timeColumn],
    value: parseFloat(r[valueColumn])
  })).filter(p => !isNaN(p.value));

  if (points.length < 2) return { error: 'No numeric values found' };

  const values = points.map(p => p.value);
  const trend = calculateLinearTrend(values);

  return {
    direction: trend.slope > 0 ? 'increasing' : 'decreasing',
    slope: trend.slope,
    startValue: values[0],
    endValue: values[values.length - 1],
    percentChange: ((values[values.length - 1] - values[0]) / values[0] * 100).toFixed(2),
    volatility: calculateVolatility(values)
  };
}

/**
 * Detect anomalies using IQR method
 * @param {Array} data - Array of objects
 * @param {string} column - Column to analyze
 * @returns {Object} - Anomaly detection results
 */
function detectAnomalies(data, column) {
  const values = data
    .map((r, i) => ({ value: parseFloat(r[column]), index: i }))
    .filter(item => !isNaN(item.value));

  if (values.length < 4) return { anomalies: [], method: 'insufficient_data' };

  const sortedValues = values.map(v => v.value).sort((a, b) => a - b);
  const q1 = sortedValues[Math.floor(sortedValues.length * 0.25)];
  const q3 = sortedValues[Math.floor(sortedValues.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const anomalies = values
    .filter(item => item.value < lowerBound || item.value > upperBound)
    .map(item => ({
      index: item.index,
      value: item.value,
      type: item.value < lowerBound ? 'low' : 'high'
    }));

  return {
    anomalies,
    method: 'iqr',
    bounds: { lower: lowerBound, upper: upperBound },
    count: anomalies.length
  };
}

/**
 * Group data and calculate aggregations
 * @param {Array} data - Array of objects
 * @param {string} groupBy - Column to group by
 * @param {Object} aggregations - { column: 'sum'|'avg'|'count'|'min'|'max' }
 * @returns {Array} - Grouped and aggregated data
 */
function groupAndAggregate(data, groupBy, aggregations) {
  const groups = {};

  data.forEach(row => {
    const key = row[groupBy];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(row);
  });

  const results = [];
  for (const [key, rows] of Object.entries(groups)) {
    const result = { [groupBy]: key };

    for (const [column, aggFunc] of Object.entries(aggregations)) {
      const values = rows.map(r => parseFloat(r[column])).filter(v => !isNaN(v));

      switch (aggFunc) {
        case 'sum':
          result[`${column}_sum`] = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          result[`${column}_avg`] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case 'count':
          result[`${column}_count`] = values.length;
          break;
        case 'min':
          result[`${column}_min`] = Math.min(...values);
          break;
        case 'max':
          result[`${column}_max`] = Math.max(...values);
          break;
      }
    }

    results.push(result);
  }

  return results;
}

// Helper functions

function getMedian(values) {
  const sorted = values.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function getMostCommon(values) {
  const counts = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}

function getTopValues(values, limit) {
  const counts = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function calculatePearsonCorrelation(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;

  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let numerator = 0, denomX = 0, denomY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : numerator / denom;
}

function calculateLinearTrend(values) {
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;

  let numerator = 0, denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - meanX) * (values[i] - meanY);
    denominator += (i - meanX) * (i - meanX);
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  return { slope, intercept };
}

function calculateVolatility(values) {
  if (values.length < 2) return 0;
  const changes = [];
  for (let i = 1; i < values.length; i++) {
    changes.push(Math.abs(values[i] - values[i - 1]) / values[i - 1]);
  }
  return changes.reduce((a, b) => a + b, 0) / changes.length;
}

module.exports = {
  generateStatisticalSummary,
  calculateCorrelations,
  analyzeTrends,
  detectAnomalies,
  groupAndAggregate
};
