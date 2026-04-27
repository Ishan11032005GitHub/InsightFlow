import React, { useState, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import { Toaster } from 'react-hot-toast'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Reports from './pages/Reports'
import ChatWithPDF from './pages/ChatWithPDF'
import AIChat from './pages/AIChat'
import Visualization from './pages/Visualization'
import DataCleaning from './pages/DataCleaning'
import CompareDatasets from './pages/CompareDatasets'
import History from './pages/History'

// Info Pages — Product
import { FeaturesPage, SolutionsPage, PricingPage, IntegrationsPage, ChangelogPage } from './pages/info/ProductPages'
// Info Pages — Company
import { AboutPage, ContactPage } from './pages/info/CompanyPages'
// Info Pages — Resources
import { DocsPage, BlogPage } from './pages/info/ResourcePages'
// Info Pages — Legal
import { PrivacyPage, TermsPage, CookiePolicyPage, SecurityPage } from './pages/info/LegalPages'

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

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation()
  React.useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function getStoredUser() {
  try {
    const saved = localStorage.getItem('insightflow_user')
    return saved ? JSON.parse(saved) : null
  } catch {
    localStorage.removeItem('insightflow_user')
    return null
  }
}

export default function App() {
  const [user, setUser] = useState(getStoredUser)

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('insightflow_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('insightflow_user')
    localStorage.removeItem('insightflow_token')
  }

  // Initialize theme
  React.useEffect(() => {
    const theme = localStorage.getItem('insightflow-theme') || 'dark'
    document.documentElement.setAttribute('data-theme', theme)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <DataProvider user={user}>
        <Router>
          <ScrollToTop />
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
            {/* Main App */}
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
            <Route path="/ai-chat" element={
              <ProtectedRoute><AIChat /></ProtectedRoute>
            } />
            <Route path="/visualization" element={
              <ProtectedRoute><Visualization /></ProtectedRoute>
            } />
            <Route path="/data-cleaning" element={
              <ProtectedRoute><DataCleaning /></ProtectedRoute>
            } />
            <Route path="/compare" element={
              <ProtectedRoute><CompareDatasets /></ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute><History /></ProtectedRoute>
            } />

            {/* Product Pages */}
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/solutions" element={<SolutionsPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/integrations" element={<IntegrationsPage />} />
            <Route path="/changelog" element={<ChangelogPage />} />

            {/* Company Pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Resource Pages */}
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/blog" element={<BlogPage />} />

            {/* Legal Pages */}
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route path="/security" element={<SecurityPage />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthContext.Provider>
  )
}
