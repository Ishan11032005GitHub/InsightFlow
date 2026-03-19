import React, { useState, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { Toaster } from 'react-hot-toast'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Reports from './pages/Reports'
import ChatWithPDF from './pages/ChatWithPDF'
import Visualization from './pages/Visualization'

// Auth Context
export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('insightflow_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('insightflow_user')
  }

  // Restore session
  React.useEffect(() => {
    const saved = localStorage.getItem('insightflow_user')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch (e) {
        localStorage.removeItem('insightflow_user')
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <DataProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1a1a2e',
                color: '#f0f0f5',
                border: '1px solid rgba(108, 92, 231, 0.2)',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute><Upload /></ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute><Reports /></ProtectedRoute>
            } />
            <Route path="/chat" element={
              <ProtectedRoute><ChatWithPDF /></ProtectedRoute>
            } />
            <Route path="/visualization" element={
              <ProtectedRoute><Visualization /></ProtectedRoute>
            } />
          </Routes>
        </Router>
      </DataProvider>
    </AuthContext.Provider>
  )
}
