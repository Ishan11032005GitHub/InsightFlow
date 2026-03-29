import React, { createContext, useContext, useState, useEffect } from 'react'

const DataContext = createContext(null)

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

  // Load data when user changes
  useEffect(() => {
    if (user && user.email) {
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
    } else {
      // Clear on logout
      setUploadedData(null)
      setUploadedColumns([])
      setUploadedFileName('')
      setUploadedStats(null)
      setReports([])
    }
  }, [user])

  // Save data when it changes
  useEffect(() => {
    if (user && user.email) {
      localStorage.setItem(`insightflow_data_${user.email}`, JSON.stringify({
        uploadedData,
        uploadedColumns,
        uploadedFileName,
        uploadedStats,
        reports
      }))
    }
  }, [uploadedData, uploadedColumns, uploadedFileName, uploadedStats, reports, user])

  const storeData = (data, columns, fileName, stats) => {
    setUploadedData(data)
    setUploadedColumns(columns)
    setUploadedFileName(fileName)
    setUploadedStats(stats)

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

  const deleteReport = (id) => {
    setReports(prev => (prev || []).filter(r => r.id !== id))
  }

  return (
    <DataContext.Provider value={{
      uploadedData,
      uploadedColumns,
      uploadedFileName,
      uploadedStats,
      reports,
      storeData,
      storeChatHistory,
      clearData,
      deleteReport,
    }}>
      {children}
    </DataContext.Provider>
  )
}
