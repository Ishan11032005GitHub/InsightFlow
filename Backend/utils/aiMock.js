// Gemini-like mock utilities to simulate report generation and chat-with-pdf.
// These mocks allow frontend integration and local testing without external API keys.

function generateReportFromData(payload) {
  // payload can be any structured data; we produce a human-readable report string.
  const summary = `Report generated for ${payload.title || 'Untitled'} - ${new Date().toISOString()}`;
  const sections = [];
  if (payload.metrics) {
    sections.push('Metrics:\n' + JSON.stringify(payload.metrics, null, 2));
  }
  if (payload.findings) {
    sections.push('Findings:\n' + payload.findings.join('\n'));
  }
  if (payload.notes) {
    sections.push('Notes:\n' + payload.notes);
  }

  return {
    title: payload.title || 'Auto Report',
    content: `${summary}\n\n${sections.join('\n\n')}`,
    metadata: { generatedAt: new Date().toISOString(), engine: 'gemini-mock' }
  };
}

function chatWithPdf(pdfText, message) {
  // Very simple mock: search for keywords in pdfText and craft a reply.
  const lowercase = pdfText ? pdfText.toLowerCase() : '';
  const replyParts = [];

  if (!pdfText) return { reply: "I don't have the PDF content. Upload or provide text.", metadata: { engine: 'gemini-mock' } };

  if (lowercase.includes('conclusion')) replyParts.push('I can see a Conclusion section that summarizes the results.');
  if (lowercase.includes('introduction')) replyParts.push('The Introduction explains context and goals.');
  if (lowercase.includes('error') || lowercase.includes('failure')) replyParts.push('I found mentions of errors/failures — consider checking logs and reproducing steps.');

  // If none matched, provide a fallback using the message and first 200 chars
  if (replyParts.length === 0) replyParts.push(`I scanned the document. Here is a short excerpt:\n${pdfText.slice(0, 200)}...`);

  // incorporate user message to seem conversational
  const reply = `You asked: "${message}"\n\n` + replyParts.join('\n');
  return { reply, metadata: { engine: 'gemini-mock', generatedAt: new Date().toISOString() } };
}

module.exports = { generateReportFromData, chatWithPdf };
