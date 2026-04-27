import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Sidebar } from './Dashboard'
import { RAGEngine } from '../utils/pdfRagEngine'
import { useData } from '../context/DataContext'
import './ChatWithPDF.css'

// Convert markdown-style formatting to clean HTML
function formatMessage(text) {
  if (!text) return ''
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    // Bullet lists
    .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    // Fix nested <ul> from consecutive replacements
    .replace(/<\/ul>\s*<ul>/g, '')
    // Numbered lists
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr/>')
    // Line breaks (but not inside pre/code blocks)
    .replace(/\n/g, '<br/>')
    // Clean up excessive <br/> around block elements
    .replace(/<br\/?>\s*(<\/?(?:h[2-4]|ul|ol|li|pre|hr)>)/g, '$1')
    .replace(/(<\/?(?:h[2-4]|ul|ol|li|pre|hr)>)\s*<br\/?>/g, '$1')
  return html
}

// Typing animation component
function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span />
      <span />
      <span />
    </div>
  )
}

// Chat Message Component
function ChatMessage({ message, isLast }) {
  return (
    <motion.div
      className={`chat-message ${message.role}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="message-avatar">
        {message.role === 'user' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        )}
      </div>
      <div className="message-content">
        <div className="message-header">
          <span className="message-sender">{message.role === 'user' ? 'You' : 'InsightFlow AI'}</span>
          <span className="message-time">{message.time}</span>
        </div>
        <div className="message-text" dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} />
        {message.sources && message.sources.length > 0 && (
          <div className="message-sources">
            <span className="sources-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              </svg>
              Sources
            </span>
            {message.sources.map((src, i) => (
              <span key={i} className="source-tag">{src}</span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// PDF Processing Pipeline
function PDFPipeline({ step, isProcessing, stepMessage }) {
  const steps = [
    { label: 'Text Extraction', icon: '📝' },
    { label: 'Chunking', icon: '✂️' },
    { label: 'Embedding Generation', icon: '🔢' },
    { label: 'Vector Indexing (TF-IDF)', icon: '🗄️' },
    { label: 'Ready for Questions', icon: '✅' },
  ]

  return (
    <div className="pdf-pipeline">
      {steps.map((s, i) => {
        const status = i < step ? 'done' : i === step && isProcessing ? 'active' : 'pending'
        return (
          <motion.div
            key={i}
            className={`pdf-pipeline-step ${status}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="pdf-step-dot">
              {status === 'done' ? '✓' : status === 'active' ? <div className="mini-spinner" /> : ''}
            </div>
            <span className="pdf-step-icon">{s.icon}</span>
            <span className="pdf-step-label">{s.label}</span>
          </motion.div>
        )
      })}
      {stepMessage && (
        <motion.p
          className="pipeline-status-msg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {stepMessage}
        </motion.p>
      )}
    </div>
  )
}

export default function ChatWithPDF() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexStep, setIndexStep] = useState(-1)
  const [stepMessage, setStepMessage] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [processingError, setProcessingError] = useState(null)
  const chatEndRef = useRef(null)
  const location = useLocation()
  const {
    storeChatHistory,
    pdfChatMessages, setPdfChatMessages,
    pdfFileName, setPdfFileName,
    pdfDocumentInfo, setPdfDocumentInfo,
    pdfIsReady, setPdfIsReady,
    pdfSuggestedQuestions, setPdfSuggestedQuestions,
    pdfRagEngineRef,
    clearPdfChat,
    addActivity,
  } = useData()
  const hasProcessedLocationPDF = useRef(false)

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [pdfChatMessages, isTyping])

  const processFile = useCallback(async (file) => {
    setPdfFileName(file.name)
    setIsIndexing(true)
    setIndexStep(0)
    setProcessingError(null)
    setStepMessage('Starting PDF processing...')

    // Create a fresh RAG engine
    const engine = new RAGEngine()
    pdfRagEngineRef.current = engine

    try {
      const info = await engine.processFile(file, (step, message) => {
        setIndexStep(step)
        setStepMessage(message)
      })

      setPdfDocumentInfo(info)
      setIsIndexing(false)
      setPdfIsReady(true)

      // Get contextual suggested questions
      const questions = engine.getSuggestedQuestions()
      setPdfSuggestedQuestions(questions)

      // Store in global history
      storeChatHistory(file.name, info)

      setPdfChatMessages([{
        role: 'assistant',
        text: `I've successfully processed "${file.name}"!\n\n📄 Pages: ${info.numPages}\n📦 Chunks indexed: ${info.numChunks}\n📝 Characters extracted: ${info.textLength.toLocaleString()}\n\nThe document has been indexed and I'm ready to answer your questions. Ask me anything about the content!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: [],
      }])
      toast.success('PDF indexed successfully! Start asking questions.')
    } catch (error) {
      console.error('PDF processing error:', error)
      setIsIndexing(false)
      setProcessingError(error.message)
      toast.error(error.message || 'Failed to process PDF')
    }
  }, [storeChatHistory, setPdfChatMessages, setPdfFileName, setPdfDocumentInfo, setPdfIsReady, setPdfSuggestedQuestions, pdfRagEngineRef])

  // Handle file from navigation state (e.g., uploaded from Dashboard)
  useEffect(() => {
    if (location.state?.file && location.state?.type === 'pdf' && !pdfFileName && !hasProcessedLocationPDF.current) {
      hasProcessedLocationPDF.current = true
      processFile(location.state.file)
      // Clear navigation state to prevent re-processing
      window.history.replaceState({}, document.title)
    }
  }, [location.state, processFile, pdfFileName])

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      const file = accepted[0]
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        processFile(file)
      } else {
        toast.error('Please upload a PDF file')
      }
    }
  }, [processFile])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: { 'application/pdf': ['.pdf'] },
  })

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputValue.trim() || isTyping) return

    const question = inputValue.trim()
    const userMsg = {
      role: 'user',
      text: question,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setPdfChatMessages(prev => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)

    // Query the RAG engine (async for Gemini support)
    const queryRAG = async () => {
      const engine = pdfRagEngineRef.current
      if (!engine || !engine.isReady) {
        setPdfChatMessages(prev => [...prev, {
          role: 'assistant',
          text: 'Please upload and process a PDF document first.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: [],
        }])
        setIsTyping(false)
        return
      }

      try {
        const result = await engine.query(question)
        const aiMsg = {
          role: 'assistant',
          text: result.answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: result.sources,
        }
        setPdfChatMessages(prev => [...prev, aiMsg])
        addActivity('pdf', 'PDF Chat question', `${pdfFileName}: ${question.slice(0, 60)}`)
      } catch (err) {
        setPdfChatMessages(prev => [...prev, {
          role: 'assistant',
          text: 'Sorry, something went wrong generating the answer. Please try again.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: [],
        }])
      }
      setIsTyping(false)
    }
    queryRAG()
  }

  const handleReset = () => {
    clearPdfChat()
    setIndexStep(-1)
    setStepMessage('')
    setProcessingError(null)
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} currentPath="/chat" />
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="page-enter chat-page">
          {!pdfFileName ? (
            /* Upload State */
            <div className="chat-upload-state">
              <motion.div
                className="chat-upload-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="chat-hero-icon">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </motion.div>
                </div>
                <h1>Chat with Your PDF</h1>
                <p>Upload any PDF document and ask AI-powered questions. Get accurate answers with page references from the actual content.</p>
              </motion.div>

              <motion.div
                {...getRootProps()}
                className={`pdf-dropzone ${isDragActive ? 'dragging' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <input {...getInputProps()} />
                <div className="pdf-drop-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <h3>{isDragActive ? 'Drop PDF here' : 'Drop your PDF file here'}</h3>
                <p>or click to browse — supports any text-based PDF</p>
                <span className="pdf-badge">.PDF</span>
              </motion.div>

              {/* RAG Pipeline Info */}
              <motion.div
                className="rag-info glass-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h4>RAG Pipeline</h4>
                <div className="rag-steps">
                  <div className="rag-step">
                    <span className="rag-num">01</span>
                    <span>Text Extraction</span>
                  </div>
                  <div className="rag-arrow">→</div>
                  <div className="rag-step">
                    <span className="rag-num">02</span>
                    <span>Chunking</span>
                  </div>
                  <div className="rag-arrow">→</div>
                  <div className="rag-step">
                    <span className="rag-num">03</span>
                    <span>TF-IDF Index</span>
                  </div>
                  <div className="rag-arrow">→</div>
                  <div className="rag-step">
                    <span className="rag-num">04</span>
                    <span>Cosine Search</span>
                  </div>
                  <div className="rag-arrow">→</div>
                  <div className="rag-step">
                    <span className="rag-num">05</span>
                    <span>AI Answers</span>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : !pdfIsReady ? (
            /* Processing State */
            <div className="chat-processing-state">
              <motion.div
                className="processing-card glass-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="processing-header">
                  <div className="processing-file-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div>
                    <h3>Processing: {pdfFileName}</h3>
                    <p>Indexing document...</p>
                  </div>
                </div>
                <PDFPipeline step={indexStep} isProcessing={isIndexing} stepMessage={stepMessage} />
                
                {processingError ? (
                  <motion.div
                    className="processing-error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="error-icon">⚠️</div>
                    <p>{processingError}</p>
                    <button className="btn-outline" onClick={handleReset}>
                      Try Another PDF
                    </button>
                  </motion.div>
                ) : (
                  <div className="processing-progress">
                    <div className="progress-bar">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((indexStep + 1) / 5) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="progress-text">{Math.round(((indexStep + 1) / 5) * 100)}%</span>
                  </div>
                )}
              </motion.div>
            </div>
          ) : (
            /* Chat State */
            <div className="chat-interface">
              {/* Chat Header */}
              <div className="chat-header glass-card">
                <div className="chat-header-left">
                  <div className="chat-file-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    </svg>
                    <span>{pdfFileName}</span>
                  </div>
                  <div className="chat-status">
                    <span className="status-dot" />
                    <span>
                      Indexed — {pdfDocumentInfo?.numPages} pages, {pdfDocumentInfo?.numChunks} chunks
                    </span>
                  </div>
                </div>
                <button className="btn-outline" onClick={handleReset}>
                  New PDF
                </button>
              </div>

              {/* Re-upload notice after page refresh */}
              {pdfIsReady && !pdfRagEngineRef.current && (
                <motion.div
                  className="reupload-notice"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    margin: '0 1rem 0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    background: 'rgba(255, 193, 7, 0.1)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span>⚠️</span>
                  <span>Session refreshed — re-upload the PDF to ask new questions. Your previous chat is preserved above.</span>
                  <button className="btn-outline" onClick={handleReset} style={{ marginLeft: 'auto', fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}>
                    Upload New PDF
                  </button>
                </motion.div>
              )}

              {/* Messages Area */}
              <div className="chat-messages">
                <AnimatePresence>
                  {pdfChatMessages.map((msg, i) => (
                    <ChatMessage key={i} message={msg} isLast={i === pdfChatMessages.length - 1} />
                  ))}
                </AnimatePresence>
                {isTyping && (
                  <motion.div
                    className="chat-message assistant"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="message-avatar">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                      </svg>
                    </div>
                    <div className="message-content">
                      <TypingIndicator />
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggested Questions */}
              {pdfChatMessages.length <= 1 && pdfSuggestedQuestions.length > 0 && (
                <motion.div
                  className="suggested-questions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {pdfSuggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      className="suggested-btn"
                      onClick={() => {
                        setInputValue(q)
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Input Area */}
              <form className="chat-input-area" onSubmit={handleSendMessage}>
                <div className="chat-input-wrapper">
                  <input
                    type="text"
                    placeholder="Ask a question about your document..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    className={`send-btn ${inputValue.trim() && !isTyping ? 'active' : ''}`}
                    disabled={!inputValue.trim() || isTyping}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
                <span className="input-hint">Answers are retrieved directly from your uploaded document using TF-IDF cosine similarity search.</span>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
