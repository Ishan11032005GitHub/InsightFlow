/**
 * File Type Detector & Parser
 * Identifies file types and extracts content
 */

const fs = require('fs');
const path = require('path');

const SUPPORTED_TYPES = {
  CSV: 'csv',
  JSON: 'json',
  EXCEL: 'excel',
  TEXT: 'text',
  PDF: 'pdf'
};

/**
 * Detect file type from filename or content
 * @param {string} filename - Original filename
 * @param {Buffer|string} content - File content
 * @returns {string} - Detected file type
 */
function detectFileType(filename, content) {
  const ext = path.extname(filename).toLowerCase().substring(1);

  // Extension-based detection
  if (['csv'].includes(ext)) return SUPPORTED_TYPES.CSV;
  if (['json'].includes(ext)) return SUPPORTED_TYPES.JSON;
  if (['xlsx', 'xls'].includes(ext)) return SUPPORTED_TYPES.EXCEL;
  if (['txt', 'md'].includes(ext)) return SUPPORTED_TYPES.TEXT;
  if (['pdf'].includes(ext)) return SUPPORTED_TYPES.PDF;

  // Content-based fallback
  if (content && typeof content === 'string') {
    const trimmed = content.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return SUPPORTED_TYPES.JSON;
    }
    if (trimmed.includes(',') && trimmed.includes('\n')) {
      return SUPPORTED_TYPES.CSV;
    }
  }

  return SUPPORTED_TYPES.TEXT;
}

/**
 * Parse CSV content into structured data
 * @param {string} csvContent - CSV text
 * @returns {Object} - { headers, rows, columns }
 */
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [], columns: 0 };

  // Simple CSV parser (handles basic cases)
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return row;
  });

  return {
    headers,
    rows,
    columns: headers.length,
    rowCount: rows.length
  };
}

/**
 * Parse a single CSV line (handles quoted values)
 * @param {string} line - CSV line
 * @returns {Array} - Parsed values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse JSON content into structured data
 * @param {string} jsonContent - JSON text
 * @returns {Object} - Parsed JSON data
 */
function parseJSON(jsonContent) {
  try {
    const parsed = JSON.parse(jsonContent);
    return {
      data: parsed,
      isArray: Array.isArray(parsed),
      itemCount: Array.isArray(parsed) ? parsed.length : 1,
      schema: extractJSONSchema(parsed)
    };
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
}

/**
 * Extract schema from JSON data
 * @param {any} data - JSON data
 * @returns {Object} - Schema description
 */
function extractJSONSchema(data) {
  if (Array.isArray(data) && data.length > 0) {
    return extractJSONSchema(data[0]);
  }
  if (typeof data === 'object' && data !== null) {
    const schema = {};
    for (const key in data) {
      schema[key] = typeof data[key];
    }
    return schema;
  }
  return { type: typeof data };
}

/**
 * Extract text from plain text files
 * @param {string} textContent - Text content
 * @returns {Object} - { content, wordCount, lineCount }
 */
function parseText(textContent) {
  const lines = textContent.split('\n');
  const words = textContent.split(/\s+/).filter(w => w.length > 0);

  return {
    content: textContent,
    wordCount: words.length,
    lineCount: lines.length,
    characterCount: textContent.length
  };
}

/**
 * Generate insights from parsed data
 * @param {Object} data - Parsed data with headers/rows or schema
 * @param {string} fileType - Type of file
 * @returns {Object} - Generated insights
 */
function generateDataInsights(data, fileType) {
  const insights = {
    fileType,
    timestamp: new Date().toISOString(),
    summary: ''
  };

  if (fileType === SUPPORTED_TYPES.CSV) {
    insights.summary = `CSV file with ${data.columns} columns and ${data.rowCount} rows. Columns: ${data.headers.join(', ')}`;
    insights.columns = data.headers;
    insights.sampleData = data.rows.slice(0, 3);
  } else if (fileType === SUPPORTED_TYPES.JSON) {
    insights.summary = `JSON data with ${data.itemCount} item(s). Structure: ${JSON.stringify(data.schema)}`;
    insights.schema = data.schema;
    insights.itemCount = data.itemCount;
  } else if (fileType === SUPPORTED_TYPES.TEXT) {
    insights.summary = `Text document with ${data.wordCount} words and ${data.lineCount} lines`;
    insights.wordCount = data.wordCount;
    insights.lineCount = data.lineCount;
  }

  return insights;
}

module.exports = {
  SUPPORTED_TYPES,
  detectFileType,
  parseCSV,
  parseJSON,
  parseText,
  generateDataInsights
};
