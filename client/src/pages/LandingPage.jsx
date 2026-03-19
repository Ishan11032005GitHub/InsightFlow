import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import './LandingPage.css'

// Particle Canvas Component
function ParticleCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []
    let mouse = { x: null, y: null }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor() {
        this.reset()
      }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.opacity = Math.random() * 0.5 + 0.1
        this.hue = Math.random() > 0.5 ? 258 : 195 // purple or cyan
      }
      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (mouse.x) {
          const dx = mouse.x - this.x
          const dy = mouse.y - this.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            const force = (150 - dist) / 150
            this.x -= (dx / dist) * force * 2
            this.y -= (dy / dist) * force * 2
          }
        }

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.opacity})`
        ctx.fill()
      }
    }

    for (let i = 0; i < 120; i++) {
      particles.push(new Particle())
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(108, 92, 231, ${0.15 * (1 - dist / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
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

    canvas.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    })
    canvas.addEventListener('mouseleave', () => {
      mouse.x = null
      mouse.y = null
    })

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} className="particle-canvas" />
}

// Floating Orb Component
function FloatingOrb({ color, size, x, y, delay }) {
  return (
    <motion.div
      className="floating-orb"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
      animate={{
        y: [0, -30, 10, -20, 0],
        x: [0, 15, -10, 20, 0],
        scale: [1, 1.1, 0.95, 1.05, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    />
  )
}

// Animated Counter
function AnimatedCounter({ value, suffix = '' }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0
          const step = value / 60
          const timer = setInterval(() => {
            start += step
            if (start >= value) {
              setCount(value)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 16)
          observer.disconnect()
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// Feature Card
function FeatureCard({ icon, title, description, delay, gradient }) {
  return (
    <motion.div
      className="feature-card glass-card"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      <div className="feature-icon" style={{ background: gradient }}>
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="feature-glow" style={{ background: gradient }} />
    </motion.div>
  )
}

// Workflow Step
function WorkflowStep({ number, title, description, delay, isActive }) {
  return (
    <motion.div
      className={`workflow-step ${isActive ? 'active' : ''}`}
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="step-number">
        <span>{number}</span>
      </div>
      <div className="step-content">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
    </motion.div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  return (
    <div className="landing-page">
      <ParticleCanvas />

      {/* Floating Orbs */}
      <FloatingOrb color="rgba(108, 92, 231, 0.15)" size={400} x="10%" y="20%" delay={0} />
      <FloatingOrb color="rgba(0, 210, 255, 0.1)" size={300} x="70%" y="10%" delay={2} />
      <FloatingOrb color="rgba(247, 37, 133, 0.08)" size={350} x="80%" y="60%" delay={4} />
      <FloatingOrb color="rgba(0, 245, 212, 0.06)" size={250} x="5%" y="70%" delay={1} />

      {/* Navbar */}
      <motion.nav
        className="landing-nav"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="nav-container">
          <div className="logo">
            <div className="logo-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="url(#logoGrad)" strokeWidth="2" fill="none"/>
                <path d="M14 10L20 13V19L14 22L8 19V13L14 10Z" fill="url(#logoGrad)"/>
                <defs>
                  <linearGradient id="logoGrad" x1="2" y1="2" x2="26" y2="26">
                    <stop stopColor="#6c5ce7"/>
                    <stop offset="1" stopColor="#00d2ff"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text">InsightFlow</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#stats">Stats</a>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn-primary" onClick={() => navigate('/register')}>
              Get Started
              <span className="btn-shine" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section className="hero-section" style={{ opacity: heroOpacity, scale: heroScale }}>
        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <span className="badge-dot" />
            AI-Powered Analytics Platform
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Transform Your Data Into
            <span className="gradient-text-accent"> Intelligent Insights</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Upload CSV files for automated analytics and stunning reports, or drop PDFs
            to have AI-powered conversations with your documents. One platform, infinite possibilities.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
          >
            <button className="btn-hero-primary" onClick={() => navigate('/register')}>
              <span>Start Analyzing Free</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button className="btn-hero-secondary" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>See How It Works</span>
            </button>
          </motion.div>

          {/* Tech Stack Badges */}
          <motion.div
            className="tech-badges"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            {['React', 'Python', 'FAISS', 'LLM', 'Chart.js'].map((tech, i) => (
              <span key={tech} className="tech-badge">{tech}</span>
            ))}
          </motion.div>
        </div>

        {/* Hero Visual */}
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="dashboard-preview">
            <div className="preview-header">
              <div className="preview-dots">
                <span /><span /><span />
              </div>
              <span className="preview-title">InsightFlow Dashboard</span>
            </div>
            <div className="preview-body">
              <div className="preview-sidebar">
                <div className="preview-nav-item active" />
                <div className="preview-nav-item" />
                <div className="preview-nav-item" />
                <div className="preview-nav-item" />
              </div>
              <div className="preview-main">
                <div className="preview-stat-row">
                  <div className="preview-stat-card">
                    <div className="preview-stat-icon purple" />
                    <div className="preview-stat-info">
                      <div className="preview-line short" />
                      <div className="preview-line medium" />
                    </div>
                  </div>
                  <div className="preview-stat-card">
                    <div className="preview-stat-icon cyan" />
                    <div className="preview-stat-info">
                      <div className="preview-line short" />
                      <div className="preview-line medium" />
                    </div>
                  </div>
                  <div className="preview-stat-card">
                    <div className="preview-stat-icon green" />
                    <div className="preview-stat-info">
                      <div className="preview-line short" />
                      <div className="preview-line medium" />
                    </div>
                  </div>
                </div>
                <div className="preview-chart-area">
                  <div className="preview-chart">
                    <div className="chart-bar" style={{ height: '60%' }} />
                    <div className="chart-bar" style={{ height: '80%' }} />
                    <div className="chart-bar" style={{ height: '45%' }} />
                    <div className="chart-bar" style={{ height: '90%' }} />
                    <div className="chart-bar" style={{ height: '70%' }} />
                    <div className="chart-bar" style={{ height: '55%' }} />
                    <div className="chart-bar" style={{ height: '75%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="scroll-indicator"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="scroll-line" />
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-tag">Features</span>
            <h2>Everything You Need for <span className="gradient-text">Data Intelligence</span></h2>
            <p>Powerful tools that transform raw data into actionable insights automatically.</p>
          </motion.div>

          <div className="features-grid">
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <line x1="10" y1="9" x2="8" y2="9"/>
                </svg>
              }
              title="Smart File Detection"
              description="Auto-detects CSV, Excel, and PDF files. Routes them to the right processing pipeline instantly."
              delay={0}
              gradient="linear-gradient(135deg, #6c5ce7, #a29bfe)"
            />
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
              }
              title="Automated Reports"
              description="Generate beautiful PDF reports with charts, statistics, and AI-generated insights from CSV data."
              delay={0.1}
              gradient="linear-gradient(135deg, #00d2ff, #40c4ff)"
            />
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              }
              title="Chat with PDFs"
              description="Upload any PDF and ask questions. Our RAG pipeline delivers accurate answers with source references."
              delay={0.2}
              gradient="linear-gradient(135deg, #f72585, #ff6b9d)"
            />
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              }
              title="Vector Database"
              description="FAISS-powered similarity search for lightning-fast document retrieval and context matching."
              delay={0.3}
              gradient="linear-gradient(135deg, #00e676, #69f0ae)"
            />
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              }
              title="Dynamic Visualizations"
              description="Interactive charts and graphs generated automatically from your data. Export-ready dashboards."
              delay={0.4}
              gradient="linear-gradient(135deg, #ffa726, #ffcc80)"
            />
            <FeatureCard
              icon={
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                </svg>
              }
              title="AI-Powered Insights"
              description="Machine learning algorithms discover patterns, anomalies, and trends humans might miss."
              delay={0.5}
              gradient="linear-gradient(135deg, #7c4dff, #b388ff)"
            />
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="workflow-section" id="workflow">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2>Three Steps to <span className="gradient-text-alt">Intelligence</span></h2>
            <p className="workflow-subtitle">Streamlined architecture for maximum efficiency.</p>
          </motion.div>

          <div className="three-steps-wrapper">
            {/* Step 1 */}
            <motion.div
              className="step-card-new glass-card"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.1, type: "spring", stiffness: 80, damping: 20 }}
              whileHover={{ y: -10, transition: { duration: 0.3, ease: 'easeOut' } }}
            >
              <div className="step-watermark">01</div>
              <div className="step-icon-new">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className="step-title">Ingest Data</h3>
              <p className="step-desc">
                Drag & drop your CSVs, Excel files, or connect directly to your SQL database. We handle the cleaning.
              </p>
            </motion.div>

            {/* Arrow 1 */}
            <motion.div
              className="step-arrow"
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3, type: "spring", stiffness: 150 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="step-card-new glass-card"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 80, damping: 20 }}
              whileHover={{ y: -10, transition: { duration: 0.3, ease: 'easeOut' } }}
            >
              <div className="step-watermark">02</div>
              <div className="step-icon-new">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <line x1="9" y1="1" x2="9" y2="4" />
                  <line x1="15" y1="1" x2="15" y2="4" />
                  <line x1="9" y1="20" x2="9" y2="23" />
                  <line x1="15" y1="20" x2="15" y2="23" />
                  <line x1="20" y1="9" x2="23" y2="9" />
                  <line x1="20" y1="14" x2="23" y2="14" />
                  <line x1="1" y1="9" x2="4" y2="9" />
                  <line x1="1" y1="14" x2="4" y2="14" />
                </svg>
              </div>
              <h3 className="step-title">AI Processing</h3>
              <p className="step-desc">
                Our Neural Engine scans for correlations, anomalies, and forecasting opportunities instantly.
              </p>
            </motion.div>

            {/* Arrow 2 */}
            <motion.div
              className="step-arrow"
              initial={{ opacity: 0, scale: 0.5, x: -20 }}
              whileInView={{ opacity: 1, scale: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 150 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className="step-card-new glass-card"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.3, type: "spring", stiffness: 80, damping: 20 }}
              whileHover={{ y: -10, transition: { duration: 0.3, ease: 'easeOut' } }}
            >
              <div className="step-watermark">03</div>
              <div className="step-icon-new">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <polyline points="9 15 12 18 16 13" />
                </svg>
              </div>
              <h3 className="step-title">Generate Report</h3>
              <p className="step-desc">
                Receive a comprehensive, board-ready PDF report with interactive charts and strategic summaries.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section" id="stats">
        <div className="section-container">
          <div className="stats-grid">
            <motion.div
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="stat-value gradient-text">
                <AnimatedCounter value={10000} suffix="+" />
              </div>
              <div className="stat-label">Files Processed</div>
            </motion.div>
            <motion.div
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="stat-value gradient-text">
                <AnimatedCounter value={99} suffix="%" />
              </div>
              <div className="stat-label">Accuracy Rate</div>
            </motion.div>
            <motion.div
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="stat-value gradient-text">
                <AnimatedCounter value={500} suffix="+" />
              </div>
              <div className="stat-label">Reports Generated</div>
            </motion.div>
            <motion.div
              className="stat-card glass-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="stat-value gradient-text">
                <AnimatedCounter value={50} suffix="ms" />
              </div>
              <div className="stat-label">Avg Response Time</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="integrations-section" id="integrations">
        <div className="section-container">
          <motion.div
            className="integrations-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="integrations-title">
              Connect Your <span className="gradient-text-accent">Data Universe</span>
            </h2>
            <p>Native integrations for every modern data stack.</p>
          </motion.div>

          <motion.div
            className="integrations-card glass-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="integrations-glow" />
            <div className="integrations-row">
              {[
                {
                  name: 'PostgreSQL',
                  color: '#6c5ce7',
                  icon: (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <ellipse cx="12" cy="6" rx="8" ry="3"/>
                      <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6"/>
                      <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>
                    </svg>
                  ),
                },
                {
                  name: 'AWS S3',
                  color: '#ff9800',
                  icon: (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 10 10"/>
                      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                      <path d="M2 12h20"/>
                    </svg>
                  ),
                },
                {
                  name: 'Excel / CSV',
                  color: '#00e676',
                  icon: (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="3" y1="15" x2="21" y2="15"/>
                      <line x1="9" y1="3" x2="9" y2="21"/>
                      <line x1="15" y1="3" x2="15" y2="21"/>
                    </svg>
                  ),
                },
                {
                  name: 'Snowflake',
                  color: '#00d2ff',
                  icon: (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <line x1="12" y1="2" x2="12" y2="22"/>
                      <line x1="4.93" y1="7.5" x2="19.07" y2="16.5"/>
                      <line x1="4.93" y1="16.5" x2="19.07" y2="7.5"/>
                      <line x1="12" y1="2" x2="9" y2="5"/>
                      <line x1="12" y1="2" x2="15" y2="5"/>
                      <line x1="12" y1="22" x2="9" y2="19"/>
                      <line x1="12" y1="22" x2="15" y2="19"/>
                    </svg>
                  ),
                },
                {
                  name: 'Tableau',
                  color: '#ffa726',
                  icon: (
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                      <line x1="3" y1="20" x2="21" y2="20"/>
                    </svg>
                  ),
                },
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  className="integration-item"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                >
                  <div
                    className="integration-icon"
                    style={{
                      color: item.color,
                      boxShadow: `0 0 25px ${item.color}30, 0 0 50px ${item.color}15`,
                      borderColor: `${item.color}35`,
                    }}
                  >
                    {item.icon}
                  </div>
                  <span className="integration-name">{item.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Security Section */}
      <section className="security-section">
        <div className="section-container">
          <div className="security-layout">
            <motion.div
              className="security-content"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="security-title">
                Fortress-Grade<br />
                <span className="security-accent">Security</span>
              </h2>
              <p className="security-desc">
                Your data never leaves our encrypted enclave. We process everything in
                transient memory containers that are wiped instantly after analysis.
              </p>
              <div className="security-features">
                <div className="security-feature">
                  <div className="security-feature-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <span>SOC 2 Type II Certified</span>
                </div>
                <div className="security-feature">
                  <div className="security-feature-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <span>End-to-End AES-256 Encryption</span>
                </div>
                <div className="security-feature">
                  <div className="security-feature-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </div>
                  <span>Private Cloud Deployment Options</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="security-visual"
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="security-card glass-card">
                <div className="shield-glow" />
                <motion.div
                  className="shield-icon"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="cta-glow" />
            <h2>Ready to Transform Your Data?</h2>
            <p>Start analyzing your files with AI-powered insights today. No credit card required.</p>
            <button className="btn-hero-primary" onClick={() => navigate('/register')}>
              <span>Get Started for Free</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-logo">
            <div className="logo-icon footer-logo-icon">
              <svg width="32" height="32" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" stroke="url(#footerGrad2)" strokeWidth="2" fill="none"/>
                <path d="M14 10L20 13V19L14 22L8 19V13L14 10Z" fill="url(#footerGrad2)"/>
                <defs>
                  <linearGradient id="footerGrad2" x1="2" y1="2" x2="26" y2="26">
                    <stop stopColor="#6c5ce7"/>
                    <stop offset="1" stopColor="#00d2ff"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="logo-text footer-logo-text">InsightFlow</span>
          </div>
          <div className="footer-links">
            <a href="#features">Contact</a>
            <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
            <a href="#features">Documentation</a>
            <a href="#features">Terms</a>
            <a href="#features">Privacy Policy</a>
          </div>
          <div className="footer-copyright">
            <p>&copy; 2026 InsightFlow Inc. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
