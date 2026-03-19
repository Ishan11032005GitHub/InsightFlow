/**
 * PDF RAG Engine — Client-side Retrieval-Augmented Generation
 * 
 * This module provides a complete RAG pipeline that runs entirely in the browser:
 * 1. PDF Text Extraction (via pdf.js)
 * 2. Intelligent Text Chunking (with overlap for context continuity)
 * 3. TF-IDF Vectorization & Cosine Similarity Retrieval
 * 4. Semantic Context synthesis and Answer Generation
 */

import * as pdfjsLib from 'pdfjs-dist'

// Configure pdf.js worker — use CDN for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

// ============================================================
// 1. PDF TEXT EXTRACTION
// ============================================================

/**
 * Extract text from a PDF file with page-level metadata
 */
export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    
    // Improved character spacing handling
    let lastY, text = ''
    for (let item of textContent.items) {
      if (lastY !== undefined && Math.abs(item.transform[5] - lastY) > 2) {
        text += '\n'
      } else if (text !== '' && !text.endsWith(' ') && item.str.length > 0) {
        text += ' '
      }
      text += item.str
      lastY = item.transform[5]
    }
    
    const pageText = text.replace(/\s+/g, ' ').trim()
    if (pageText.length > 0) {
      pages.push({ pageNum: i, text: pageText })
    }
  }

  const fullText = pages.map(p => p.text).join('\n\n')
  return { pages, fullText, numPages: pdf.numPages }
}

// ============================================================
// 2. TEXT CHUNKING
// ============================================================

/**
 * Split text into overlapping chunks
 */
export function chunkText(pages, chunkSize = 600, overlap = 150) {
  const chunks = []
  let currentChunk = ''
  let currentPages = []
  let chunkIndex = 0

  for (const page of pages) {
    const sentences = page.text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [page.text]

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (!trimmedSentence) continue

      if (currentChunk.length + trimmedSentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          pageNums: [...new Set(currentPages)],
          chunkIndex: chunkIndex++,
        })

        const overlapText = currentChunk.slice(-overlap)
        currentChunk = overlapText + ' ' + trimmedSentence
        currentPages = [...new Set(currentPages.slice(-1))].concat(page.pageNum)
      } else {
        currentChunk += (currentChunk ? ' ' : '') + trimmedSentence
        if (!currentPages.includes(page.pageNum)) {
          currentPages.push(page.pageNum)
        }
      }
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      pageNums: [...new Set(currentPages)],
      chunkIndex: chunkIndex++,
    })
  }

  return chunks
}

// ============================================================
// 3. TF-IDF VECTORIZER
// ============================================================

class TFIDFVectorizer {
  constructor() {
    this.vocabulary = new Map()
    this.idf = new Map()
    this.documents = []
    this.tfidfMatrix = []
  }

  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !STOP_WORDS.has(word))
  }

  fit(documents) {
    this.documents = documents
    const tokenizedDocs = documents.map(doc => this.tokenize(doc))
    const N = tokenizedDocs.length
    const docFrequency = new Map()
    
    tokenizedDocs.forEach(tokens => {
      const uniqueTokens = new Set(tokens)
      uniqueTokens.forEach(token => {
        docFrequency.set(token, (docFrequency.get(token) || 0) + 1)
      })
    })

    let idx = 0
    for (const [word] of docFrequency) {
      this.vocabulary.set(word, idx++)
    }

    for (const [word, df] of docFrequency) {
      this.idf.set(word, Math.log((N + 1) / (df + 1)) + 1)
    }

    this.tfidfMatrix = tokenizedDocs.map(tokens => {
      const tf = new Map()
      tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1))
      const vector = new Float64Array(this.vocabulary.size)
      for (const [word, count] of tf) {
        const vocabIdx = this.vocabulary.get(word)
        if (vocabIdx !== undefined) {
          vector[vocabIdx] = (count / tokens.length) * (this.idf.get(word) || 0)
        }
      }
      return vector
    })
  }

  transform(query) {
    const tokens = this.tokenize(query)
    const tf = new Map()
    tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1))
    const vector = new Float64Array(this.vocabulary.size)
    for (const [word, count] of tf) {
      const vocabIdx = this.vocabulary.get(word)
      if (vocabIdx !== undefined) {
        vector[vocabIdx] = (count / tokens.length) * (this.idf.get(word) || 0)
      }
    }
    return vector
  }

  cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }
    if (normA === 0 || normB === 0) return 0
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  search(query, topK = 3) {
    const queryVector = this.transform(query)
    const scores = this.tfidfMatrix.map((docVector, index) => ({
      index,
      score: this.cosineSimilarity(queryVector, docVector),
    }))

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((s, i) => s.score > 0 || (i === 0 && scores.length < 10))
  }
}

const STOP_WORDS = new Set(['a', 'an', 'the', 'is', 'it', 'of', 'in', 'to', 'and', 'or', 'for', 'on', 'at', 'by', 'be', 'as', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he', 'she', 'him', 'her', 'his', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'but', 'if', 'with', 'about', 'from', 'up', 'out', 'then', 'also', 'into'])

// ============================================================
// 4. RAG ENGINE 
// ============================================================

export class RAGEngine {
  constructor() {
    this.chunks = []
    this.vectorizer = new TFIDFVectorizer()
    this.isReady = false
    this.documentInfo = null
    this.fullText = ''
    this.wordFreq = {}
  }

  async processFile(file, onProgress) {
    this.isReady = false
    this.fullText = ''

    onProgress?.(0, 'Scanning PDF and extracting high-fidelity text...')
    const { pages, fullText, numPages } = await extractTextFromPDF(file)
    this.fullText = fullText

    if (fullText.trim().length === 0) {
      throw new Error('Could not extract any text. Document might be images-only.')
    }

    onProgress?.(1, 'Building semantic block architecture...')
    this.chunks = chunkText(pages, 600, 150)

    onProgress?.(2, 'Generating Knowledge Map and Search Index...')
    const chunkTexts = this.chunks.map(c => c.text)
    this.vectorizer.fit(chunkTexts)
    
    this.wordFreq = {}
    const tokens = this.vectorizer.tokenize(fullText)
    tokens.forEach(t => this.wordFreq[t] = (this.wordFreq[t] || 0) + 1)

    onProgress?.(3, 'Knowledge Base ready for deep querying!')
    await new Promise(r => setTimeout(r, 400))
    onProgress?.(4, 'Ready to answer your questions.')

    this.isReady = true
    this.documentInfo = { fileName: file.name, numPages, numChunks: this.chunks.length, textLength: fullText.length }
    return this.documentInfo
  }

  query(question, topK = 3) {
    if (!this.isReady) return { answer: 'Please upload a PDF first.', sources: [] }

    const questionLower = question.toLowerCase().trim()
    const isSummaryQuestion = /summarize|summary|overview|main points|key (points|findings|info)|what is (this|it) about/i.test(questionLower)
    
    if (isSummaryQuestion || questionLower.length < 5) {
      return this._generateSmartSummary()
    }

    const queryEntities = question.match(/[A-Z][a-z]+|[0-9]+(?:\.[0-9]+)?%?/g) || []
    let results = this.vectorizer.search(question, 5)
    
    if (queryEntities.length > 0) {
      results = results.map(res => {
        let boost = 0
        queryEntities.forEach(ent => {
          if (this.chunks[res.index].text.includes(ent)) boost += 0.2
        })
        return { ...res, score: res.score + boost }
      }).sort((a, b) => b.score - a.score)
    }

    if (results.length === 0 || results[0].score < 0.05) {
      return this._generateSmartSummary(true)
    }

    const relevantChunks = results.map(r => this.chunks[r.index])
    const sources = Array.from(new Set(relevantChunks.flatMap(c => c.pageNums))).sort((a, b) => a - b).map(p => `Page ${p}`)
    const answer = this._reasonOverContext(question, relevantChunks)

    return { answer, sources, context: relevantChunks.map(c => c.text).join('\n\n') }
  }

  _reasonOverContext(question, chunks) {
    const questionWords = this.vectorizer.tokenize(question)
    const allSentences = chunks.flatMap(c => {
      const texts = c.text.match(/[^.!?]+[.!?]+/g) || [c.text]
      return texts.map(t => ({ text: t.trim(), pageNums: c.pageNums }))
    }).filter(s => s.text.length > 10)

    const scored = allSentences.map(s => {
      let score = 0
      questionWords.forEach(qw => {
        if (s.text.toLowerCase().includes(qw)) {
          score += 1 + (1 / (this.wordFreq[qw] || 1))
        }
      })
      return { ...s, score: score / (Math.log(s.text.length) || 1) }
    }).sort((a, b) => b.score - a.score)

    const bestSentences = scored.slice(0, 5)
    if (bestSentences.length === 0 || bestSentences[0].score === 0) return this._generateSmartSummary(true).answer

    let response = "Based on the document:\n\n"
    bestSentences.forEach((s, i) => {
      const ref = s.pageNums.length > 0 ? ` [Page ${s.pageNums.join(', ')}]` : ''
      response += `${i + 1}. ${s.text}${ref}\n\n`
    })
    return response.trim()
  }

  _generateSmartSummary(isFallback = false) {
    const sentences = this.fullText.match(/[^.!?]+[.!?]+/g) || [this.fullText]
    const scoredSentences = sentences.map(s => {
      const tokens = this.vectorizer.tokenize(s)
      const score = tokens.reduce((acc, t) => acc + (this.wordFreq[t] || 0), 0) / (tokens.length || 1)
      return { text: s.trim(), score }
    }).filter(s => s.text.length > 20).sort((a, b) => b.score - a.score)

    const summarySentences = scoredSentences.slice(0, 5)
    const prefix = isFallback 
      ? "I couldn't find a direct answer, but here is an overview of the most relevant points:\n\n"
      : "Here is a summary of the key findings in the document:\n\n"

    return { 
      answer: prefix + summarySentences.map(s => `• ${s.text}`).join('\n\n'),
      sources: ["Overview"],
      context: summarySentences.map(s => s.text).join(' ')
    }
  }

  getSuggestedQuestions() {
    if (!this.isReady) return ['What is this document about?', 'Summarize key points']
    const suggestions = ['Summarize this document']
    const text = this.fullText.toLowerCase()
    if (/conclusion|finding|result/i.test(text)) suggestions.push('What are the key conclusions?')
    if (/\$|revenue|cost|budget/i.test(text)) suggestions.push('What are the financial details?')
    if (/risk|challenge|issue/i.test(text)) suggestions.push('What risks are identified?')
    return suggestions.slice(0, 4)
  }
}

let _instance = null
export function getRAGEngine() { if (!_instance) _instance = new RAGEngine(); return _instance; }
export function resetRAGEngine() { _instance = new RAGEngine(); return _instance; }
