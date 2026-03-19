import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { Sidebar } from './Dashboard'
import { RAGEngine } from '../utils/pdfRagEngine'
import { useData } from '../context/DataContext'
import './ChatWithPDF.css'

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
        <div className="message-text" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
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
  const [pdfFile, setPdfFile] = useState(null)
  const [isIndexing, setIsIndexing] = useState(false)
  const [indexStep, setIndexStep] = useState(-1)
  const [stepMessage, setStepMessage] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [documentInfo, setDocumentInfo] = useState(null)
  const [suggestedQuestions, setSuggestedQuestions] = useState([])
  const [processingError, setProcessingError] = useState(null)
  const chatEndRef = useRef(null)
  const ragEngineRef = useRef(null)
  const location = useLocation()
  const { storeChatHistory } = useData()

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const processFile = useCallback(async (file) => {
    setPdfFile(file)
    setIsIndexing(true)
    setIndexStep(0)
    setProcessingError(null)
    setStepMessage('Starting PDF processing...')

    // Create a fresh RAG engine
    const engine = new RAGEngine()
    ragEngineRef.current = engine

    try {
      const info = await engine.processFile(file, (step, message) => {
        setIndexStep(step)
        setStepMessage(message)
      })

      setDocumentInfo(info)
      setIsIndexing(false)
      setIsReady(true)

      // Get contextual suggested questions
      const questions = engine.getSuggestedQuestions()
      setSuggestedQuestions(questions)

      // Store in global history
      storeChatHistory(file.name, info)

      setMessages([{
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
  }, [])

  // Handle file from navigation state (e.g., uploaded from Dashboard)
  useEffect(() => {
    if (location.state?.file && location.state?.type === 'pdf' && !pdfFile) {
      processFile(location.state.file)
    }
  }, [location.state, processFile, pdfFile])

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
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setIsTyping(true)

    // Query the RAG engine (with slight delay for UX feel)
    setTimeout(() => {
      const engine = ragEngineRef.current
      if (!engine || !engine.isReady) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: 'Please upload and process a PDF document first.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: [],
        }])
        setIsTyping(false)
        return
      }

      const result = engine.query(question)
      const aiMsg = {
        role: 'assistant',
        text: result.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: result.sources,
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 600 + Math.random() * 400)
  }

  const handleReset = () => {
    setPdfFile(null)
    setIsReady(false)
    setMessages([])
    setIndexStep(-1)
    setStepMessage('')
    setDocumentInfo(null)
    setSuggestedQuestions([])
    setProcessingError(null)
    ragEngineRef.current = null
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} currentPath="/chat" />
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="page-enter chat-page">
          {!pdfFile ? (
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
          ) : !isReady ? (
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
                    <h3>Processing: {pdfFile.name}</h3>
                    <p>{(pdfFile.size / 1024).toFixed(1)} KB</p>
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
                    <span>{pdfFile.name}</span>
                  </div>
                  <div className="chat-status">
                    <span className="status-dot" />
                    <span>
                      Indexed — {documentInfo?.numPages} pages, {documentInfo?.numChunks} chunks
                    </span>
                  </div>
                </div>
                <button className="btn-outline" onClick={handleReset}>
                  New PDF
                </button>
              </div>

              {/* Messages Area */}
              <div className="chat-messages">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <ChatMessage key={i} message={msg} isLast={i === messages.length - 1} />
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
              {messages.length <= 1 && suggestedQuestions.length > 0 && (
                <motion.div
                  className="suggested-questions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {suggestedQuestions.map((q, i) => (
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
