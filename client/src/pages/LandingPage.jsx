import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import ThemeToggle from '../components/common/ThemeToggle'
import './LandingPage.css'

/* ================================================
   HELPER COMPONENTS
   ================================================ */

function ParticleCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []
    let mouse = { x: null, y: null }
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.opacity = Math.random() * 0.5 + 0.1
        this.hue = Math.random() > 0.5 ? 258 : 195
      }
      update() {
        this.x += this.speedX; this.y += this.speedY
        if (mouse.x) {
          const dx = mouse.x - this.x, dy = mouse.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) { const f = (150 - dist) / 150; this.x -= (dx / dist) * f * 2; this.y -= (dy / dist) * f * 2 }
        }
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1
      }
      draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.opacity})`; ctx.fill()
      }
    }

    for (let i = 0; i < 120; i++) particles.push(new Particle())

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(108, 92, 231, ${0.15 * (1 - dist / 120)})`; ctx.lineWidth = 0.5; ctx.stroke()
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw() })
      drawConnections()
      animationId = requestAnimationFrame(animate)
    }

    canvas.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY })
    canvas.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null })
    animate()
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationId) }
  }, [])
  return <canvas ref={canvasRef} className="particle-canvas" />
}

function FloatingOrb({ color, size, x, y, delay }) {
  return (
    <motion.div className="floating-orb"
      style={{ width: size, height: size, left: x, top: y, background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
      animate={{ y: [0, -30, 10, -20, 0], x: [0, 15, -10, 20, 0], scale: [1, 1.1, 0.95, 1.05, 1] }}
      transition={{ duration: 8, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  )
}

function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0; const step = value / 60
        const timer = setInterval(() => { start += step; if (start >= value) { setCount(value); clearInterval(timer) } else setCount(Math.floor(start)) }, 16)
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

function FeatureCard({ icon, title, description, delay, gradient }) {
  return (
    <motion.div className="feature-card-premium"
      initial={{ opacity: 0, y: 50, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.7, delay, type: 'spring', stiffness: 80, damping: 18 }}
      whileHover={{ y: -12, transition: { duration: 0.35, ease: 'easeOut' } }}
      style={{ '--feat-grad': gradient }}
    >
      <div className="feat-card-border" />
      <div className="feat-card-glow-bg" style={{ background: `radial-gradient(circle at 30% 30%, ${gradient.match(/#[a-f0-9]+/i)?.[0] || '#6c5ce7'}22, transparent 70%)` }} />
      <div className="feat-icon-premium">
        <div className="feat-icon-ring" style={{ borderColor: `${gradient.match(/#[a-f0-9]+/i)?.[0] || '#6c5ce7'}25` }} />
        <div className="feat-icon-inner" style={{ background: gradient }}>{icon}</div>
      </div>
      <h3 className="feat-title">{title}</h3>
      <p className="feat-desc">{description}</p>
      <div className="feat-bottom-line" style={{ background: gradient }} />
      <div className="feat-shimmer" />
    </motion.div>
  )
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item ${open ? 'open' : ''}`}>
      <button className="faq-question" onClick={() => setOpen(!open)}>
        <span>{question}</span>
        <span className="faq-icon">+</span>
      </button>
      <div className="faq-answer"><p>{answer}</p></div>
    </div>
  )
}

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
)

/* ================================================
   MAIN LANDING PAGE
   ================================================ */

export default function LandingPage() {
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95])

  return (
    <div className="landing-page">
      <ParticleCanvas />
      <FloatingOrb color="rgba(108,92,231,0.15)" size={400} x="10%" y="20%" delay={0} />
      <FloatingOrb color="rgba(0,210,255,0.1)" size={300} x="70%" y="10%" delay={2} />
      <FloatingOrb color="rgba(247,37,133,0.08)" size={350} x="80%" y="60%" delay={4} />
      <FloatingOrb color="rgba(0,245,212,0.06)" size={250} x="5%" y="70%" delay={1} />

      {/* ==================== NAVBAR ==================== */}
      <motion.nav className="landing-nav" initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <div className="nav-container">
          <div className="logo">
            <div className="logo-icon">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L29.8564 10V26L16 34L2.14359 26V10L16 2Z" stroke="url(#logo_g1)" strokeWidth="3" strokeLinejoin="round" fill="rgba(108, 92, 231, 0.05)" />
                <path d="M16 8L22.9282 12V20L16 24L9.0718 20V12L16 8Z" fill="url(#logo_g2)" fillOpacity="0.6">
                  <animate attributeName="fill-opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
                </path>
                <circle cx="16" cy="16" r="3" fill="#fff">
                  <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <defs>
                  <linearGradient id="logo_g1" x1="2" y1="2" x2="30" y2="30">
                    <stop stopColor="#6c5ce7"/><stop offset="1" stopColor="#00d2ff"/>
                  </linearGradient>
                  <linearGradient id="logo_g2" x1="16" y1="8" x2="16" y2="24">
                    <stop stopColor="#a29bfe"/><stop offset="1" stopColor="#6c5ce7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text">InsightFlow</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#prototype">Product</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="nav-actions">
            <ThemeToggle />
            <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn-primary" onClick={() => navigate('/register')}>Get Started<span className="btn-shine" /></button>
          </div>
        </div>
      </motion.nav>

      {/* ==================== HERO ==================== */}
      <motion.section className="hero-section" style={{ opacity: heroOpacity, scale: heroScale }}>
        <div className="hero-content">
          <motion.div className="hero-badge" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <span className="badge-dot" /> AI-Powered Analytics Platform
          </motion.div>
          <motion.h1 className="hero-title" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            Transform Your Data Into<span className="gradient-text-accent"> Intelligent Insights</span>
          </motion.h1>
          <motion.p className="hero-subtitle" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }}>
            Upload CSV files for automated analytics and stunning reports, or drop PDFs to have AI-powered conversations with your documents. One platform, infinite possibilities.
          </motion.p>
          <motion.div className="hero-actions" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }}>
            <button className="btn-hero-primary" onClick={() => navigate('/register')}>
              <span>Start Analyzing Free</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button className="btn-hero-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>See How It Works</span>
            </button>
          </motion.div>

        </div>
        <motion.div className="hero-visual" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          <div className="dashboard-preview">
            <div className="preview-header">
              <div className="preview-dots"><span /><span /><span /></div>
              <span className="preview-title">InsightFlow Dashboard</span>
            </div>
            <div className="preview-body">
              <div className="preview-sidebar">
                <div className="preview-nav-item active" /><div className="preview-nav-item" /><div className="preview-nav-item" /><div className="preview-nav-item" />
              </div>
              <div className="preview-main">
                <div className="preview-stat-row">
                  {['purple', 'cyan', 'green'].map(c => (
                    <div key={c} className="preview-stat-card">
                      <div className={`preview-stat-icon ${c}`} />
                      <div className="preview-stat-info"><div className="preview-line short" /><div className="preview-line medium" /></div>
                    </div>
                  ))}
                </div>
                <div className="preview-chart-area">
                  <div className="preview-chart">
                    {[60, 80, 45, 90, 70, 55, 75].map((h, i) => <div key={i} className="chart-bar" style={{ height: `${h}%` }} />)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        <motion.div className="scroll-indicator" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="scroll-line" />
        </motion.div>
      </motion.section>

      {/* ==================== FEATURES ==================== */}
      <section className="features-section" id="features">
        <div className="section-container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="section-tag">Features</span>
            <h2>Everything You Need for <span className="gradient-text">Data Intelligence</span></h2>
            <p>Powerful tools that transform raw data into actionable insights automatically.</p>
          </motion.div>
          <div className="features-grid">
            {[
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>, title: 'Smart File Detection', desc: 'Auto-detects CSV, Excel, and PDF files. Routes them to the right processing pipeline instantly.', grad: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>, title: 'Automated Reports', desc: 'Generate beautiful PDF reports with charts, statistics, and AI-generated insights from CSV data.', grad: 'linear-gradient(135deg, #00d2ff, #40c4ff)' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>, title: 'Chat with PDFs', desc: 'Upload any PDF and ask questions. Our RAG pipeline delivers accurate answers with source references.', grad: 'linear-gradient(135deg, #f72585, #ff6b9d)' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>, title: 'Vector Database', desc: 'FAISS-powered similarity search for lightning-fast document retrieval and context matching.', grad: 'linear-gradient(135deg, #00e676, #69f0ae)' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, title: 'Dynamic Visualizations', desc: 'Interactive charts and graphs generated automatically from your data. Export-ready dashboards.', grad: 'linear-gradient(135deg, #ffa726, #ffcc80)' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg>, title: 'AI-Powered Insights', desc: 'Machine learning algorithms discover patterns, anomalies, and trends humans might miss.', grad: 'linear-gradient(135deg, #7c4dff, #b388ff)' },
            ].map((f, i) => (
              <FeatureCard key={i} icon={f.icon} title={f.title} description={f.desc} delay={i * 0.1} gradient={f.grad} />
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="workflow-section" id="workflow">
        <div className="workflow-bg-glow" />
        <div className="section-container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="section-tag">How It Works</span>
            <h2>Three Steps to <span className="gradient-text-alt">Intelligence</span></h2>
            <p className="workflow-subtitle">Streamlined architecture for maximum efficiency.</p>
          </motion.div>

          {/* Connecting pipeline line */}
          <div className="workflow-pipeline">
            <motion.div className="pipeline-line" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} />
            <motion.div className="pipeline-pulse" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.2 }} />
          </div>

          <div className="three-steps-wrapper">
            {[
              { num: '01', title: 'Ingest Data', desc: 'Drag & drop your CSVs, Excel files, or connect directly to your SQL database. We handle the cleaning.', color: '#6c5ce7', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
              { num: '02', title: 'AI Processing', desc: 'Our Neural Engine scans for correlations, anomalies, and forecasting opportunities instantly.', color: '#00d2ff', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg> },
              { num: '03', title: 'Generate Report', desc: 'Receive a comprehensive, board-ready PDF report with interactive charts and strategic summaries.', color: '#00e676', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 12 18 16 13"/></svg> },
            ].map((s, i) => (
              <motion.div key={i} className="step-card-premium"
                initial={{ opacity: 0, y: 60, scale: 0.9 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.8, delay: 0.2 + i * 0.2, type: 'spring', stiffness: 80, damping: 18 }}
                whileHover={{ y: -14, transition: { duration: 0.35, ease: 'easeOut' } }}
                style={{ '--step-color': s.color }}
              >
                <div className="step-card-border" />
                <div className="step-card-glow" />
                <div className="step-num-badge">{s.num}</div>
                <div className="step-icon-premium">
                  <div className="step-icon-ring" />
                  <div className="step-icon-ring step-icon-ring-2" />
                  <div className="step-icon-inner">{s.icon}</div>
                </div>
                <h3 className="step-title-premium">{s.title}</h3>
                <p className="step-desc-premium">{s.desc}</p>
                <div className="step-card-shimmer" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRODUCT PROTOTYPE ==================== */}
      <section className="prototype-section" id="prototype">
        <div className="section-container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="section-tag">Live Product</span>
            <h2>Experience the <span className="gradient-text">Dashboard</span></h2>
            <p>A glimpse into the powerful analytics engine that processes your data in real time.</p>
          </motion.div>
        </div>
        <motion.div className="prototype-container"
          initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8 }}
        >
          <div className="prototype-dashboard">
            <div className="proto-topbar">
              <div className="proto-topbar-left">
                <div className="proto-window-dots"><span /><span /><span /></div>
                <span className="proto-breadcrumb">insightflow.ai / dashboard / analytics</span>
              </div>
              <div className="proto-topbar-actions">
                {[1, 2, 3].map(i => <div key={i} className="proto-action-btn"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/></svg></div>)}
              </div>
            </div>
            <div className="proto-body">
              <div className="proto-sidebar">
                {['📊 Dashboard', '📁 Files', '💬 Chat', '📈 Reports', '⚙️ Settings'].map((item, i) => (
                  <div key={i} className={`proto-sidebar-item ${i === 0 ? 'active' : ''}`}>{item}</div>
                ))}
              </div>
              <div className="proto-main">
                <div className="proto-metrics-row">
                  {[
                    { label: 'Total Files', value: '2,847', change: '+12.5%', dir: 'up', color: '#6c5ce7' },
                    { label: 'Insights Found', value: '18,392', change: '+28.3%', dir: 'up', color: '#00d2ff' },
                    { label: 'Reports Gen.', value: '1,204', change: '+8.1%', dir: 'up', color: '#00e676' },
                    { label: 'Avg. Accuracy', value: '99.2%', change: '+0.4%', dir: 'up', color: '#f72585' },
                  ].map((m, i) => (
                    <motion.div key={i} className="proto-metric-card"
                      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    >
                      <div className="proto-metric-label">{m.label}</div>
                      <div className="proto-metric-value" style={{ color: m.color }}>{m.value}</div>
                      <div className={`proto-metric-change ${m.dir}`}>{m.change} this month</div>
                    </motion.div>
                  ))}
                </div>
                <div className="proto-charts-row">
                  <div className="proto-chart-card">
                    <div className="proto-chart-header">
                      <span className="proto-chart-title">Processing Volume</span>
                      <span className="proto-chart-badge">Last 30 days</span>
                    </div>
                    <div className="proto-bar-chart">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                        <div key={i} className="proto-bar" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="proto-chart-card">
                    <div className="proto-chart-header">
                      <span className="proto-chart-title">File Types</span>
                      <span className="proto-chart-badge">Distribution</span>
                    </div>
                    <div className="proto-donut-chart">
                      <div className="proto-donut-ring">
                        <div className="proto-donut-inner">
                          <span className="proto-donut-value">72%</span>
                          <span className="proto-donut-label">CSV Files</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ==================== USE CASES ==================== */}
      <section className="usecases-section">
        <div className="section-container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="section-tag">Use Cases</span>
            <h2>Built for Every <span className="gradient-text">Industry</span></h2>
            <p>From startups to enterprises, InsightFlow adapts to your workflow.</p>
          </motion.div>
          <div className="usecases-grid">
            {[
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>, title: 'Finance & Banking', color: '#00d2ff', bg: 'rgba(0, 210, 255, 0.1)', desc: 'Analyze transaction data, detect anomalies, and generate compliance reports automatically.' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>, title: 'Healthcare', color: '#ff5252', bg: 'rgba(255, 82, 82, 0.1)', desc: 'Process clinical data, patient records, and research papers with AI-powered document intelligence.' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>, title: 'E-Commerce', color: '#ffa726', bg: 'rgba(255, 167, 38, 0.1)', desc: 'Track sales trends, customer behavior, and inventory data with real-time analytics dashboards.' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12l10-5 10 5-10 5-10-5Z"/><path d="M22 12v6"/><path d="M6 14v4a6 6 0 0 0 12 0v-4"/></svg>, title: 'Education', color: '#6c5ce7', bg: 'rgba(108, 92, 231, 0.1)', desc: 'Analyze student performance data, research papers, and generate institutional reports.' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, title: 'Real Estate', color: '#00e676', bg: 'rgba(0, 230, 118, 0.1)', desc: 'Market analysis, property valuations, and trend forecasting from structured datasets.' },
              { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, title: 'SaaS & Tech', color: '#f72585', bg: 'rgba(247, 37, 133, 0.1)', desc: 'Product analytics, user behavior tracking, and automated KPI reporting for growth teams.' },
            ].map((uc, i) => (
              <motion.div key={i} className="usecase-card"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
              >
                <div className="usecase-icon-wrapper" style={{ background: uc.bg, color: uc.color }}>{uc.icon}</div>
                <h3>{uc.title}</h3>
                <p>{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== BENEFITS ==================== */}
      <section className="benefits-section">
        <div className="section-container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="section-tag">Why Choose Us</span>
            <h2>The InsightFlow <span className="gradient-text">Advantage</span></h2>
            <p>Purpose-built for teams that need fast, accurate, and beautiful data intelligence.</p>
          </motion.div>
          <div className="benefits-grid">
            {[
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, title: '10x Faster Analysis', desc: 'What used to take hours now completes in seconds with our AI pipeline.', grad: 'linear-gradient(135deg, #ffa726, #ff6b35)' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, title: '99.2% Accuracy', desc: 'Enterprise-grade ML models ensure your insights are reliable and trustworthy.', grad: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title: 'Bank-Level Security', desc: 'SOC 2 compliant with AES-256 encryption. Your data never leaves our secure enclave.', grad: 'linear-gradient(135deg, #00e676, #69f0ae)' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, title: 'Beautiful Reports', desc: 'Auto-generated PDF reports that are ready for board meetings and stakeholder reviews.', grad: 'linear-gradient(135deg, #00d2ff, #40c4ff)' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>, title: 'AI-First Architecture', desc: 'Built from the ground up with LLMs, RAG pipelines, and vector databases at the core.', grad: 'linear-gradient(135deg, #f72585, #ff6b9d)' },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 22 9 16 9"/><path d="M22 4A10 10 0 0 0 2.2 12"/><polygon points="2 21 2 15 8 15"/><path d="M2 20a10 10 0 0 0 19.8-8"/></svg>, title: 'Zero Setup Required', desc: 'Upload and go. No configuration, no learning curve, no complex onboarding flows.', grad: 'linear-gradient(135deg, #7c4dff, #b388ff)' },
            ].map((b, i) => (
              <motion.div key={i} className="benefit-card"
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <div className="benefit-icon" style={{ background: b.grad }}>{b.icon}</div>
                <div><h4>{b.title}</h4><p>{b.desc}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== STATS ==================== */}
      <section className="stats-section" id="stats">
        <div className="section-container">
          <div className="stats-grid">
            {[
              { val: 10000, suf: '+', label: 'Files Processed' },
              { val: 99, suf: '%', label: 'Accuracy Rate' },
              { val: 500, suf: '+', label: 'Reports Generated' },
              { val: 50, suf: 'ms', label: 'Avg Response Time' },
            ].map((s, i) => (
              <motion.div key={i} className="stat-card glass-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                <div className="stat-value gradient-text"><AnimatedCounter value={s.val} suffix={s.suf} /></div>
                <div className="stat-label">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ==================== FAQ ==================== */}
      <section className="faq-section" id="faq">
        <div className="section-container">
          <motion.div className="section-header" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <span className="section-tag">FAQ</span>
            <h2>Frequently Asked <span className="gradient-text">Questions</span></h2>
            <p>Everything you need to know about InsightFlow.</p>
          </motion.div>
          <div className="faq-grid">
            {[
              { q: 'What file formats do you support?', a: 'InsightFlow supports CSV, Excel (.xlsx, .xls), and PDF files. We automatically detect the file type and route it to the appropriate processing pipeline — CSV/Excel for analytics reports, PDF for AI-powered chat conversations.' },
              { q: 'How does the PDF chat feature work?', a: 'Our RAG (Retrieval Augmented Generation) pipeline powered by FAISS vector search and Google Gemini processes your PDF into semantic chunks. You can then ask natural language questions and receive accurate answers with source citations.' },
              { q: 'Is my data secure?', a: 'Absolutely. We use AES-256 encryption at rest and in transit, process data in ephemeral containers, and are SOC 2 Type II compliant. Your files are never shared or used for model training.' },
              { q: 'Can I try InsightFlow for free?', a: 'Yes! Our Starter plan is completely free with no credit card required. You get 5 file uploads per month, basic reports, and full access to core features.' },
              { q: 'Do you offer an API?', a: 'Yes, our Professional and Enterprise plans include full REST API access with comprehensive documentation, SDKs for Python and JavaScript, and webhook integrations.' },
            ].map((faq, i) => <FAQItem key={i} question={faq.q} answer={faq.a} />)}
          </div>
        </div>
      </section>

      {/* ==================== SECURITY ==================== */}
      <section className="security-section">
        <div className="security-bg-glow" />
        <div className="section-container">
          <div className="security-layout">
            <motion.div className="security-content" initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="security-title">Fortress-Grade<br /><span className="security-accent">Security</span></h2>
              <p className="security-desc">Your data never leaves our encrypted enclave. We process everything in transient memory containers that are wiped instantly after analysis.</p>
              <div className="security-features">
                {[
                  { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, text: 'SOC 2 Type II Certified' },
                  { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, text: 'End-to-End AES-256 Encryption' },
                  { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, text: 'Private Cloud Deployment Options' },
                ].map((f, i) => (
                  <motion.div key={i} className="security-feature"
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }}
                    whileHover={{ x: 8 }}
                  >
                    <div className="security-feature-icon-premium">{f.icon}</div>
                    <span className="security-feature-text">{f.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div className="security-visual" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2 }}>
              <div className="security-card-premium">
                <div className="security-card-border" />
                <div className="security-rings">
                  <div className="sec-ring sec-ring-1" />
                  <div className="sec-ring sec-ring-2" />
                  <div className="sec-ring sec-ring-3" />
                </div>
                <motion.div className="shield-wrapper" animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                  <div className="shield-glow-effect" />
                  <div className="shield-icon-container">
                    <svg className="shield-svg" width="180" height="180" viewBox="0 0 24 24" fill="rgba(0, 230, 118, 0.08)" stroke="#00e676" strokeWidth="1.5">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path className="shield-check" d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="shield-scan-line" />
                  </div>
                </motion.div>
                <div className="security-particle-grid" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="cta-section">
        <div className="section-container">
          <motion.div className="cta-card" initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="cta-glow" />
            <h2>Ready to Transform Your Data?</h2>
            <p>Join thousands of teams using InsightFlow to unlock the full potential of their data. No credit card required.</p>
            <button className="btn-hero-primary" onClick={() => navigate('/register')}>
              <span>Get Started for Free</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <div className="cta-logos">
              {['Trusted by 500+ Companies', '99.9% Uptime SLA', '24/7 Support'].map((t, i) => (
                <span key={i} className="cta-logo-item">{t}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="landing-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-brand-logo">
              <div className="logo-icon">
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                  <path d="M16 2L29.8564 10V26L16 34L2.14359 26V10L16 2Z" stroke="url(#fGrad_new)" strokeWidth="3" strokeLinejoin="round" fill="none" />
                  <path d="M16 8L22.9282 12V20L16 24L9.0718 20V12L16 8Z" fill="url(#fGrad_pulse)" fillOpacity="0.6">
                    <animate attributeName="fill-opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
                  </path>
                  <circle cx="16" cy="16" r="3" fill="#fff">
                    <animate attributeName="r" values="2;3.5;2" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <defs>
                    <linearGradient id="fGrad_new" x1="2" y1="2" x2="30" y2="30">
                      <stop stopColor="#6c5ce7"/><stop offset="1" stopColor="#00d2ff"/>
                    </linearGradient>
                    <linearGradient id="fGrad_pulse" x1="16" y1="8" x2="16" y2="24">
                      <stop stopColor="#a29bfe"/><stop offset="1" stopColor="#6c5ce7"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="logo-text">InsightFlow</span>
            </div>
            <p className="footer-brand-desc">AI-powered analytics platform that transforms raw data into intelligent, actionable insights.</p>
            <div className="footer-newsletter">
              <input type="email" placeholder="Enter your email" />
              <button>Subscribe</button>
            </div>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <Link to="/features">Features</Link><Link to="/solutions">Solutions</Link><Link to="/integrations">Integrations</Link><Link to="/changelog">Changelog</Link>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link to="/docs">Documentation</Link><Link to="/blog">Blog</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About Us</Link><Link to="/contact">Contact</Link>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <Link to="/privacy">Privacy Policy</Link><Link to="/terms">Terms of Service</Link><Link to="/cookies">Cookie Policy</Link><Link to="/security">Security</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-copyright"><p>&copy; 2026 InsightFlow Inc. All rights reserved.</p></div>
          <div className="footer-social">
            {[
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>,
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>,
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>,
            ].map((icon, i) => <div key={i} className="footer-social-icon">{icon}</div>)}
          </div>
        </div>
      </footer>
    </div>
  )
}
