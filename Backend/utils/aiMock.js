/**
 * Google Gemini AI Integration
 * Uses gemini-flash-latest model for report generation and PDF chat
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

/**
 * Generate a formatted report from structured data using Gemini
 * @param {Object} payload - Data object with title, metrics, findings, notes
 * @returns {Promise<Object>} - Generated report with title and content
 */
async function generateReportFromData(payload) {
  try {
    const prompt = `Generate a professional report based on the following data:

Title: ${payload.title || 'Untitled Report'}

${payload.metrics ? `Metrics:\n${JSON.stringify(payload.metrics, null, 2)}\n` : ''}
${payload.findings ? `Key Findings:\n${payload.findings.join('\n')}\n` : ''}
${payload.notes ? `Additional Notes:\n${payload.notes}\n` : ''}

Please create a well-formatted, professional report with an executive summary, detailed sections, and key takeaways.`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    return {
      title: payload.title || 'Generated Report',
      content: content,
      metadata: { 
        generatedAt: new Date().toISOString(), 
        engine: 'gemini-flash-latest',
        promptTokens: result.response.usageMetadata?.promptTokenCount,
        outputTokens: result.response.usageMetadata?.candidatesTokenCount
      }
    };
  } catch (error) {
    throw new Error(`Failed to generate report: ${error.message}`);
  }
}

/**
 * Chat with PDF content using Gemini
 * @param {string} pdfText - Extracted text from PDF
 * @param {string} message - User's question or message
 * @returns {Promise<Object>} - AI response
 */
async function chatWithPdf(pdfText, message) {
  try {
    if (!pdfText) {
      return { 
        reply: "I don't have the PDF content. Please upload a PDF or provide text content first.",
        metadata: { engine: 'gemini-flash-latest', error: 'No PDF content' }
      };
    }

    const prompt = `You are a helpful assistant analyzing the following PDF document:

---
${pdfText}
---

User Question: ${message}

Please provide a clear, concise answer based on the document content.`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return {
      reply: reply,
      metadata: {
        engine: 'gemini-flash-latest',
        generatedAt: new Date().toISOString(),
        promptTokens: result.response.usageMetadata?.promptTokenCount,
        outputTokens: result.response.usageMetadata?.candidatesTokenCount
      }
    };
  } catch (error) {
    throw new Error(`Failed to generate chat response: ${error.message}`);
  }
}

/**
 * Fallback mock functions (for when Gemini API is unavailable)
 */
function generateReportFromDataMock(payload) {
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
    metadata: { generatedAt: new Date().toISOString(), engine: 'mock' }
  };
}

function chatWithPdfMock(pdfText, message) {
  const lowercase = pdfText ? pdfText.toLowerCase() : '';
  const replyParts = [];

  if (!pdfText) return { reply: "I don't have the PDF content. Upload or provide text.", metadata: { engine: 'mock' } };

  if (lowercase.includes('conclusion')) replyParts.push('I can see a Conclusion section that summarizes the results.');
  if (lowercase.includes('introduction')) replyParts.push('The Introduction explains context and goals.');
  if (lowercase.includes('error') || lowercase.includes('failure')) replyParts.push('I found mentions of errors/failures — consider checking logs and reproducing steps.');

  if (replyParts.length === 0) replyParts.push(`I scanned the document. Here is a short excerpt:\n${pdfText.slice(0, 200)}...`);

  const reply = `You asked: "${message}"\n\n` + replyParts.join('\n');
  return { reply, metadata: { engine: 'mock', generatedAt: new Date().toISOString() } };
}

/**
 * Analyze data from uploaded files
 * @param {Object} payload - Data analysis request
 * @returns {Promise<Object>} - AI analysis results
 */
async function analyzeData(payload) {
  try {
    const prompt = `You are a data analyst. Analyze the following data file and provide key insights:

File: ${payload.title}
Type: ${payload.type}
Data Summary: ${JSON.stringify(payload.insights, null, 2)}

${payload.data?.headers ? `Columns: ${payload.data.headers.join(', ')}` : ''}
${payload.data?.rowCount ? `Rows: ${payload.data.rowCount}` : ''}

Provide:
1. Key observations
2. Potential patterns or anomalies
3. Recommended analyses`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    return {
      analysis,
      metadata: {
        engine: 'gemini-flash-latest',
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Data analysis error:', error);
    return analyzeDataMock(payload);
  }
}

/**
 * Generate insights from analysis results
 * @param {Object} payload - Analysis results
 * @returns {Promise<Object>} - AI-generated insights
 */
async function generateInsights(payload) {
  try {
    const prompt = `You are a data scientist. Interpret the following analysis results and explain what they mean:

Analysis Type: ${payload.analysisType}
Document: ${payload.documentName}
Results: ${JSON.stringify(payload.data, null, 2)}

Provide:
1. Plain English summary
2. What this tells us
3. Actionable recommendations
4. Confidence level`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return {
      summary,
      recommendations: extractRecommendations(summary),
      metadata: {
        engine: 'gemini-flash-latest',
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Insights error:', error);
    return generateInsightsMock(payload);
  }
}

/**
 * Chat with context from session memory
 * @param {string} message - User message
 * @param {string} context - Previous conversation context
 * @returns {Promise<Object>} - AI response
 */
async function chatWithContext(message, context) {
  try {
    const prompt = `${context}

User: ${message}

Respond as a helpful data analysis assistant. Keep responses concise and actionable.`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return {
      reply,
      metadata: {
        engine: 'gemini-flash-latest',
        generatedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Chat error:', error);
    return chatWithContextMock(message, context);
  }
}

// Mock functions for when API is unavailable

function analyzeDataMock(payload) {
  const keyPoints = [];
  
  if (payload.data?.headers) {
    keyPoints.push(`Dataset contains ${payload.data.headers.length} columns: ${payload.data.headers.join(', ')}`);
  }
  if (payload.data?.rowCount) {
    keyPoints.push(`Total of ${payload.data.rowCount} data points available`);
  }
  
  keyPoints.push('Recommended analyses: statistical summary, trend detection, correlation analysis');

  return {
    analysis: `Analysis of ${payload.title}:\n\n${keyPoints.join('\n')}`,
    metadata: { engine: 'mock', generatedAt: new Date().toISOString() }
  };
}

function generateInsightsMock(payload) {
  const recommendations = [
    'Review data quality and completeness',
    'Validate assumptions against business context',
    'Consider seasonal or external factors'
  ];

  return {
    summary: `${payload.analysisType} analysis shows interesting patterns in ${payload.documentName}. Further investigation recommended.`,
    recommendations,
    metadata: { engine: 'mock', generatedAt: new Date().toISOString() }
  };
}

function chatWithContextMock(message, context) {
  return {
    reply: `Based on our discussion, I understand you're asking about: "${message}". Let me help you with that. Could you provide more specific details?`,
    metadata: { engine: 'mock', generatedAt: new Date().toISOString() }
  };
}

function extractRecommendations(text) {
  const lines = text.split('\n');
  return lines
    .filter(line => line.includes('recommend') || line.includes('suggest') || line.includes('consider'))
    .slice(0, 3)
    .map(line => line.replace(/^[-*•]\s*/, '').trim());
}

/**
 * RAG Chat - Retrieval-Augmented Generation for documents
 * @param {string} documentContext - Extracted document text
 * @param {string} userQuestion - User's question
 * @returns {Promise<Object>} - AI response with RAG
 */
async function ragChat(documentContext, userQuestion) {
  try {
    const prompt = `You are a helpful document assistant. Answer the user's question based ONLY on the provided document content.

Document Content:
${documentContext}

User Question: ${userQuestion}

If the answer is not in the document, say "I could not find this information in the provided document."

Answer:`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return {
      reply: reply,
      metadata: {
        engine: 'gemini-flash-latest',
        generatedAt: new Date().toISOString(),
        method: 'rag',
        promptTokens: result.response.usageMetadata?.promptTokenCount,
        outputTokens: result.response.usageMetadata?.candidatesTokenCount
      }
    };
  } catch (error) {
    console.error('RAG chat error:', error);
    return ragChatMock(documentContext, userQuestion);
  }
}

/**
 * RAG Chat Mock - Fallback for when Gemini is unavailable
 */
function ragChatMock(documentContext, userQuestion) {
  const context = documentContext.toLowerCase();
  const question = userQuestion.toLowerCase();
  
  let answer = '';
  
  // Simple keyword-based responses
  if (question.includes('who') && question.includes('resume')) {
    answer = 'Based on the document provided, I can see resume information. The document appears to contain professional information about a person.';
  } else if (question.includes('experience') || question.includes('background')) {
    if (context.includes('experience') || context.includes('work')) {
      answer = 'The document contains experience information. You may find details about work history and background.';
    } else {
      answer = 'I could not find detailed experience information in the provided document.';
    }
  } else if (question.includes('skill') || question.includes('ability')) {
    if (context.includes('skill') || context.includes('proficient')) {
      answer = 'The document mentions various skills and competencies.';
    } else {
      answer = 'Specific skills information is not clearly mentioned in the document.';
    }
  } else if (question.includes('education') || question.includes('degree')) {
    if (context.includes('education') || context.includes('university') || context.includes('college')) {
      answer = 'The document contains education-related information.';
    } else {
      answer = 'Education details are not found in this document.';
    }
  } else {
    answer = `Based on the provided document, I can help answer questions about its content. Your question was: "${userQuestion}". Please provide more specific details for a better answer.`;
  }

  return {
    reply: answer,
    metadata: {
      engine: 'mock',
      generatedAt: new Date().toISOString(),
      method: 'rag-mock'
    }
  };
}

module.exports = { 
  generateReportFromData, 
  chatWithPdf,
  analyzeData,
  generateInsights,
  chatWithContext,
  ragChat,
  generateReportFromDataMock,
  chatWithPdfMock,
  analyzeDataMock,
  generateInsightsMock,
  chatWithContextMock,
  ragChatMock
};
