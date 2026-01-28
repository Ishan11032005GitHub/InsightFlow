/**
 * Simple PDF text extraction
 * Note: For production use, consider more robust solutions like pdf2json or pdfrw
 */

const pdfParse = require('pdf-parse');

async function extractPdfText(buffer) {
  try {
    const data = await pdfParse(buffer);
    // Combine all text from all pages
    const text = data.text || '';
    return text.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    // Return placeholder if parsing fails
    return '[Unable to extract text from PDF]';
  }
}

module.exports = { extractPdfText };
