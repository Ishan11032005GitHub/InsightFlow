import React, { createContext, useContext, useState } from 'react'

const DataContext = createContext(null)

export function useData() {
  return useContext(DataContext)
}

export function DataProvider({ children }) {
  // Stores parsed CSV/Excel data
  const [uploadedData, setUploadedData] = useState(null)   // array of row objects
  const [uploadedColumns, setUploadedColumns] = useState([]) // column names
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [uploadedStats, setUploadedStats] = useState(null)  // computed stats
  const [reports, setReports] = useState([])                // history of reports

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
      ...prev,
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
      ...prev,
    ])
  }

  const clearData = () => {
    setUploadedData(null)
    setUploadedColumns([])
    setUploadedFileName('')
    setUploadedStats(null)
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
    }}>
      {children}
    </DataContext.Provider>
  )
}
