import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const DataContext = createContext(null)

const MAX_ROWS_TO_PERSIST = 5000 // Cap rows saved to localStorage to prevent quota errors

function safeSaveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('localStorage save failed (quota likely exceeded):', key, e)
    // Try saving without large data
    try {
      if (value && value.uploadedData) {
        const trimmed = { ...value, uploadedData: value.uploadedData.slice(0, 1000) }
        localStorage.setItem(key, JSON.stringify(trimmed))
      }
    } catch {
      // Give up saving this key
    }
  }
}

export function useData() {
  return useContext(DataContext)
}

export function DataProvider({ children, user }) {
  // Stores parsed CSV/Excel data
  const [uploadedData, setUploadedData] = useState(null)   // array of row objects
  const [uploadedColumns, setUploadedColumns] = useState([]) // column names
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploadedStats, setUploadedStats] = useState(null)  // computed stats
  const [reports, setReports] = useState([])                // history of reports

  // ---- PDF Chat persistent state ----
  const [pdfChatMessages, setPdfChatMessages] = useState([])
  const [pdfFileName, setPdfFileName] = useState(null)
  const [pdfDocumentInfo, setPdfDocumentInfo] = useState(null)
  const [pdfIsReady, setPdfIsReady] = useState(false)
  const [pdfSuggestedQuestions, setPdfSuggestedQuestions] = useState([])
  const pdfRagEngineRef = useRef(null)  // RAG engine instance (not serializable)

  // ---- AI Chat persistent state ----
  const [aiChatMessages, setAiChatMessages] = useState([])

  // ---- Activity History Log ----
  const [activityLog, setActivityLog] = useState([])

  const addActivity = (type, title, details = '') => {
    const entry = {
      id: Date.now() + Math.random(),
      type,       // 'upload' | 'pdf' | 'ai-chat' | 'visualization' | 'report' | 'cleaning' | 'compare' | 'login' | 'export'
      title,
      details,
      timestamp: new Date().toISOString(),
    }
    setActivityLog(prev => [entry, ...prev].slice(0, 200)) // keep last 200
  }

  const clearActivityLog = () => setActivityLog([])

  // Load data when user changes
  useEffect(() => {
    if (user && user.email) {
      // Load CSV/report data
      const stored = localStorage.getItem(`insightflow_data_${user.email}`)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setUploadedData(parsed.uploadedData || null)
          setUploadedColumns(parsed.uploadedColumns || [])
          setUploadedFileName(parsed.uploadedFileName || '')
          setUploadedStats(parsed.uploadedStats || null)
          setReports(parsed.reports || [])
        } catch (e) {
          console.error("Error parsing stored data", e)
        }
      } else {
        setUploadedData(null)
        setUploadedColumns([])
        setUploadedFileName('')
        setUploadedStats(null)
        setReports([])
      }
      // Load chat state
      const chatStored = localStorage.getItem(`insightflow_chat_${user.email}`)
      if (chatStored) {
        try {
          const chatParsed = JSON.parse(chatStored)
          setPdfChatMessages(chatParsed.pdfChatMessages || [])
          setPdfFileName(chatParsed.pdfFileName || null)
          setPdfDocumentInfo(chatParsed.pdfDocumentInfo || null)
          setPdfIsReady(chatParsed.pdfIsReady || false)
          setPdfSuggestedQuestions(chatParsed.pdfSuggestedQuestions || [])
          setAiChatMessages(chatParsed.aiChatMessages || [])
        } catch (e) {
          console.error("Error parsing stored chat data", e)
        }
      } else {
        setPdfChatMessages([])
        setPdfFileName(null)
        setPdfDocumentInfo(null)
        setPdfIsReady(false)
        setPdfSuggestedQuestions([])
        setAiChatMessages([])
      }
      // Load activity log
      const logStored = localStorage.getItem(`insightflow_activity_${user.email}`)
      if (logStored) {
        try { setActivityLog(JSON.parse(logStored)) } catch { setActivityLog([]) }
      } else {
        setActivityLog([])
      }
    } else {
      // Clear on logout
      setUploadedData(null)
      setUploadedColumns([])
      setUploadedFileName('')
      setUploadedStats(null)
      setReports([])
      setPdfChatMessages([])
      setPdfFileName(null)
      setPdfDocumentInfo(null)
      setPdfIsReady(false)
      setPdfSuggestedQuestions([])
      setAiChatMessages([])
      setActivityLog([])
    }
  }, [user])

  // Save CSV/report data when it changes (debounced to avoid blocking UI)
  const saveTimerRef = useRef(null)
  useEffect(() => {
    if (user && user.email) {
      // Debounce saves to avoid blocking the main thread during pipeline animation
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        const dataToSave = uploadedData && uploadedData.length > MAX_ROWS_TO_PERSIST
          ? uploadedData.slice(0, MAX_ROWS_TO_PERSIST)
          : uploadedData
        safeSaveToLocalStorage(`insightflow_data_${user.email}`, {
          uploadedData: dataToSave,
          uploadedColumns,
          uploadedFileName,
          uploadedStats,
          reports
        })
      }, 300)
    }
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [uploadedData, uploadedColumns, uploadedFileName, uploadedStats, reports, user])

  // Save chat state when it changes
  useEffect(() => {
    if (user && user.email) {
      safeSaveToLocalStorage(`insightflow_chat_${user.email}`, {
        pdfChatMessages,
        pdfFileName,
        pdfDocumentInfo,
        pdfIsReady,
        pdfSuggestedQuestions,
        aiChatMessages,
      })
    }
  }, [pdfChatMessages, pdfFileName, pdfDocumentInfo, pdfIsReady, pdfSuggestedQuestions, aiChatMessages, user])

  // Save activity log when it changes
  useEffect(() => {
    if (user && user.email && activityLog.length > 0) {
      safeSaveToLocalStorage(`insightflow_activity_${user.email}`, activityLog)
    }
  }, [activityLog, user])

  const storeData = (data, columns, fileName, stats) => {
    setUploadedData(data)
    setUploadedColumns(columns)
    setUploadedFileName(fileName)
    setUploadedStats(stats)
    addActivity('upload', `Uploaded ${fileName}`, `${data.length} rows, ${columns.length} columns`)

    // Add to reports history
    setReports(prev => [
      {
        id: Date.now(),
        name: fileName.replace(/\.\w+$/, '').replace(/[_-]/g, ' '),
        file: fileName,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rows: data.length,
        columns: columns.length,
        insights: Math.floor(Math.random() * 10) + 5,
        status: 'complete',
        type: fileName.split('.').pop().toLowerCase(),
      },
      ...(prev || []),
    ])
  }

  const storeChatHistory = (fileName, info) => {
    addActivity('pdf', `Indexed PDF: ${fileName}`, `${info.numPages} pages, ${info.numChunks} chunks`)
    // Add PDF chat to reports history
    setReports(prev => [
      {
        id: Date.now(),
        name: fileName.replace(/\.\w+$/, '').replace(/[_-]/g, ' '),
        file: fileName,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        rows: info.numPages,
        columns: info.numChunks,
        insights: 'PDF Chat',
        status: 'indexed',
        type: 'pdf',
      },
      ...(prev || []),
    ])
  }

  const clearData = () => {
    setUploadedData(null)
    setUploadedColumns([])
    setUploadedFileName('')
    setUploadedStats(null)
  }

  const clearPdfChat = () => {
    setPdfChatMessages([])
    setPdfFileName(null)
    setPdfDocumentInfo(null)
    setPdfIsReady(false)
    setPdfSuggestedQuestions([])
    pdfRagEngineRef.current = null
  }

  const deleteReport = (id) => {
    setReports(prev => (prev || []).filter(r => r.id !== id))
  }

  return (
    <DataContext.Provider value={{
      uploadedData,
      setUploadedData,
      uploadedColumns,
      setUploadedColumns,
      uploadedFileName,
      uploadedStats,
      reports,
      storeData,
      storeChatHistory,
      clearData,
      deleteReport,
      // PDF Chat state
      pdfChatMessages, setPdfChatMessages,
      pdfFileName, setPdfFileName,
      pdfDocumentInfo, setPdfDocumentInfo,
      pdfIsReady, setPdfIsReady,
      pdfSuggestedQuestions, setPdfSuggestedQuestions,
      pdfRagEngineRef,
      clearPdfChat,
      // AI Chat state
      aiChatMessages, setAiChatMessages,
      // Activity Log
      activityLog, addActivity, clearActivityLog,
    }}>
      {children}
    </DataContext.Provider>
  )
}
