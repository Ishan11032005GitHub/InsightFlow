import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Sidebar } from './Dashboard'
import { useData } from '../context/DataContext'
import { useAuth } from '../App'
import './AIChat.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001'

const SUGGESTIONS = [
  'Explain Dijkstra\'s algorithm with code',
  'Write a Python script to sort a list',
  'What is machine learning?',
  'Explain REST APIs in simple terms',
  'Write a SQL query to find duplicates',
  'How does React useState work?',
]

function ChatMessage({ message }) {
  return (
    <motion.div
      className={`ai-chat-message ${message.role}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="ai-message-avatar">
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
      <div className="ai-message-content">
        <div className="ai-message-header">
          <span className="ai-message-sender">{message.role === 'user' ? 'You' : 'InsightFlow AI'}</span>
          <span className="ai-message-time">{message.time}</span>
        </div>
        <div className="ai-message-text" dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} />
      </div>
    </motion.div>
  )
}

function formatMessage(text) {
  // Convert markdown-style formatting to HTML
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
    // Line breaks
    .replace(/\n/g, '<br/>')
  return html
}

function TypingIndicator() {
  return (
    <motion.div
      className="ai-chat-message assistant"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="ai-message-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div className="ai-message-content">
        <div className="typing-indicator">
          <span /><span /><span />
        </div>
      </div>
    </motion.div>
  )
}

export default function AIChat() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { aiChatMessages: messages, setAiChatMessages: setMessages, addActivity } = useData()
  const { user } = useAuth()
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text) => {
    if (!text.trim() || isTyping) return

    const userMsg = {
      role: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInputValue('')
    setIsTyping(true)

    try {
      const response = await fetch(`${API_BASE}/api/chat/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, text: m.text })),
          user: user ? { name: user.name, email: user.email } : null
        })
      })
      const data = await response.json()

      if (data.error) throw new Error(data.error)

      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
      addActivity('ai-chat', 'AI Chat question', text.trim().slice(0, 80))
    } catch (err) {
      console.error('AI Chat error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Sorry, something went wrong. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
      toast.error('Failed to get AI response')
    }
    setIsTyping(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleNewChat = () => {
    setMessages([])
    setInputValue('')
  }

  return (
    <div className="app-layout">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} currentPath="/ai-chat" />
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        <div className="page-enter ai-chat-page">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="ai-chat-empty">
              <motion.div
                className="ai-chat-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="ai-hero-icon">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  </motion.div>
                </div>
                <h1>InsightFlow AI</h1>
                <p>Your personal AI assistant. Ask anything — coding, math, science, writing, and more.</p>
              </motion.div>

              <motion.div
                className="ai-suggestions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={i}
                    className="ai-suggestion-card"
                    onClick={() => sendMessage(s)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    <span>{s}</span>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          ) : (
            /* Chat State */
            <div className="ai-chat-interface">
              <div className="ai-chat-header glass-card">
                <div className="ai-chat-header-left">
                  <div className="ai-chat-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                    <span>InsightFlow AI</span>
                  </div>
                  <div className="ai-chat-status">
                    <span className="status-dot" />
                    <span>Online — {messages.filter(m => m.role === 'user').length} messages</span>
                  </div>
                </div>
                <button className="btn-outline" onClick={handleNewChat}>New Chat</button>
              </div>

              <div className="ai-chat-messages">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <ChatMessage key={i} message={msg} />
                  ))}
                </AnimatePresence>
                {isTyping && <TypingIndicator />}
                <div ref={chatEndRef} />
              </div>
            </div>
          )}

          {/* Input Area — always visible */}
          <form className="ai-chat-input-area" onSubmit={handleSubmit}>
            <div className="ai-chat-input-wrapper">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isTyping}
              />
              <button
                type="submit"
                className={`ai-send-btn ${inputValue.trim() ? 'active' : ''}`}
                disabled={!inputValue.trim() || isTyping}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
            <p className="ai-chat-disclaimer">InsightFlow AI can make mistakes. Verify important information.</p>
          </form>
        </div>
      </main>
    </div>
  )
}
