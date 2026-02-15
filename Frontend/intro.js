/* =========================================
   1. UTILITIES & CONFIG
   ========================================= */
lucide.createIcons();

/* =========================================
   2. AUTH STATE
   ========================================= */
const token = localStorage.getItem("token");
if (token) {
  document.querySelectorAll('a[href="signin.html"]').forEach(btn => {
    btn.href = "dashboard.html";
    btn.textContent = "Dashboard";
  });
  document.querySelectorAll('a[href="signup.html"]').forEach(btn => {
    btn.href = "dashboard.html";
    btn.textContent = "Go to App";
  });
}

/* =========================================
   3. SCROLL & ANIMATIONS
   ========================================= */
/* =========================================
   3. SCROLL & ANIMATIONS - REVEAL SYSTEM
   ========================================= */
window.addEventListener('scroll', () => {
  const topbar = document.getElementById('topbar');
  if (window.scrollY > 50) {
    topbar.classList.add('scrolled');
  } else {
    topbar.classList.remove('scrolled');
  }
});

// Configure Observer
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px" // Trigger slightly before element enters viewport
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal-active');
      observer.unobserve(entry.target); // Only animate once
    }
  });
}, observerOptions);

// Target elements for animation
document.querySelectorAll('section').forEach(section => {
  section.classList.add('reveal'); // Default all sections to fade in
  observer.observe(section);
});

document.querySelectorAll('.glass, .card, .step-card, .feature-card').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

document.querySelectorAll('.stagger-parent').forEach(el => {
  observer.observe(el);
});


/* =========================================
   4. PARTICLE SYSTEM (Canvas)
   ========================================= */
/* =========================================
   4. ADVANCED PARTICLE SYSTEM (Canvas)
   ========================================= */
const canvas = document.getElementById('bg-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];

  // Config - High density for "Space" feel (70% more particles)
  let particleCount = window.innerWidth < 768 ? 100 : 310; // Increased from 60/180
  const connectionDistance = 120; // Slightly reduced connection distance to prevent clutter
  const mouseDistance = 300; // Wider influence range

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particleCount = window.innerWidth < 768 ? 60 : 180;
    initParticles();
  }

  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      // Faster, more chaotic movement
      this.vx = (Math.random() - 0.5) * 1.5;
      this.vy = (Math.random() - 0.5) * 1.5;
      this.size = Math.random() * 2.5 + 1;
      // Brighter, more vibrant palette
      const colors = [
        'rgba(0, 243, 255,',   // Cyan
        'rgba(124, 92, 255,',  // Purple
        'rgba(255, 255, 255,', // White
        'rgba(255, 0, 212,'    // Neon Pink
      ];
      this.colorBase = colors[Math.floor(Math.random() * colors.length)];
      this.opacity = Math.random() * 0.7 + 0.2; // Higher base opacity
      this.pulsateSpeed = 0.02 + Math.random() * 0.03;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Faster Puslation
      this.opacity += this.pulsateSpeed;
      if (this.opacity >= 1 || this.opacity <= 0.1) this.pulsateSpeed *= -1;

      // Wrap around edges
      if (this.x < -20) this.x = width + 20;
      if (this.x > width + 20) this.x = -20;
      if (this.y < -20) this.y = height + 20;
      if (this.y > height + 20) this.y = -20;
    }

    draw() {
      ctx.beginPath();
      // Star shape or simple circle? Let's stick to glowing circles for performance
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.colorBase + this.opacity + ')';

      // Stronger Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.colorBase + '0.8)';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  // Planet Class for Space Effect
  class Planet {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 40 + 10; // 10px to 50px
      this.speedX = (Math.random() - 0.5) * 0.2; // Very slow drift
      this.speedY = (Math.random() - 0.5) * 0.2;

      // Random Planet Colors
      const planetColors = [
        { base: '#ff4b4b', shadow: '#8b0000' }, // Mars-ish
        { base: '#4b9eff', shadow: '#003366' }, // Earth/Neptune-ish
        { base: '#e6e6fa', shadow: '#9370db' }, // Moon-ish
        { base: '#ffa500', shadow: '#8b4500' }  // Jupiter-ish
      ];
      this.color = planetColors[Math.floor(Math.random() * planetColors.length)];

      // Ring?
      this.hasRing = Math.random() > 0.7;
      this.ringColor = 'rgba(255, 255, 255, 0.3)';
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Wrap around
      if (this.x < -100) this.x = width + 100;
      if (this.x > width + 100) this.x = -100;
      if (this.y < -100) this.y = height + 100;
      if (this.y > height + 100) this.y = -100;
    }

    draw() {
      // Draw Planet Body
      const gradient = ctx.createRadialGradient(
        this.x - this.size / 3, this.y - this.size / 3, this.size / 10,
        this.x, this.y, this.size
      );
      gradient.addColorStop(0, this.color.base);
      gradient.addColorStop(1, this.color.shadow);

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.shadowBlur = 20;
      ctx.shadowColor = this.color.base;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw Ring if exists
      if (this.hasRing) {
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.size * 1.8, this.size * 0.4, Math.PI / 6, 0, Math.PI * 2);
        ctx.strokeStyle = this.ringColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  let planets = [];
  function initPlanets() {
    planets = [];
    const planetCount = window.innerWidth < 768 ? 2 : 5; // Few planets to not overcrowd
    for (let i = 0; i < planetCount; i++) {
      planets.push(new Planet());
    }
  }

  // Initial setup
  initParticles();
  initPlanets();

  // Mouse Tracking & Interaction
  let mouse = { x: -1000, y: -1000 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
  });

  // Repel Effect on Click
  window.addEventListener('click', (e) => {
    particles.forEach(p => {
      const dx = p.x - e.clientX;
      const dy = p.y - e.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 300) {
        const force = (300 - dist) / 300;
        p.vx += (dx / dist) * force * 20; // Explosion force
        p.vy += (dy / dist) * force * 20;
      }
    });
  });

  // Handle scroll to add vertical movement
  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const dy = window.scrollY - lastScrollY;
    particles.forEach(p => p.y -= dy * 0.2); // Parallax background scroll
    planets.forEach(p => p.y -= dy * 0.05); // Planets move slower for depth
    lastScrollY = window.scrollY;
  });

  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Draw Planets First (Background Layer)
    planets.forEach(planet => {
      planet.update();
      planet.draw();
    });

    // Draw connections first (behind dots)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.update();

      // Connect to other particles
      for (let j = i; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connectionDistance) {
          ctx.beginPath();
          const opacity = (1 - dist / connectionDistance) * 0.2;
          ctx.strokeStyle = `rgba(100, 100, 255, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Connect to mouse
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < mouseDistance) {
        ctx.beginPath();
        // Stronger connection to mouse
        ctx.strokeStyle = `rgba(0, 243, 255, ${1 - dist / mouseDistance})`;
        ctx.lineWidth = 1.5;
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();

        // Slight attraction to mouse
        p.x -= dx * 0.01;
        p.y -= dy * 0.01;
      }

      p.draw(); // Draw dot on top
    }
    requestAnimationFrame(animate);
  }
  animate();
}

/* =========================================
   5. 3D TILT EFFECT & HERO PARALLAX
   ========================================= */

// Hero Data Core Parallax
const core = document.querySelector('.data-core');
if (core) {
  window.addEventListener('mousemove', (e) => {
    // Calculate rotation based on percentage of screen width/height
    const x = (window.innerWidth / 2 - e.pageX) / 50;
    const y = (window.innerHeight / 2 - e.pageY) / 50;

    // Apply rotation with a smooth transition
    core.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
  });
}

// Glass Card Tilt
document.querySelectorAll('.glass').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg tilt
    const rotateY = ((x - centerX) / centerX) * 5;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

    // Spotlight Effect
    card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    card.style.background = 'rgba(255, 255, 255, 0.03)';
  });
});

/* =========================================
   6. INTERACTIVE REPORT STACK
   ========================================= */
const stackContainer = document.querySelector('.report-stack-container');
let isAnimating2 = false;

if (stackContainer) {
  stackContainer.addEventListener('click', () => {
    if (isAnimating2) return;
    isAnimating2 = true;

    // Get current pages in DOM order
    const pages = Array.from(stackContainer.querySelectorAll('.report-page'));
    const topPage = pages[0]; // The one on top

    // 1. Animate Top Page Out (Fly up and away)
    topPage.style.transition = 'all 0.6s cubic-bezier(0.7, 0, 0.3, 1)';
    topPage.style.transform = 'translateZ(200px) translateY(-300px) rotateX(20deg)';
    topPage.style.opacity = '0';

    // 2. Wait for exit animation
    setTimeout(() => {
      // Move former top page to bottom of stack in DOM
      stackContainer.appendChild(topPage);

      // Re-query to get new order
      const newOrder = Array.from(stackContainer.querySelectorAll('.report-page'));

      // 3. Reset and Reassign Classes
      newOrder.forEach((page, index) => {
        // Temporarily disable transition to snap to new start position
        page.style.transition = 'none';

        // Remove manual styles
        page.style.transform = '';
        page.style.opacity = '';

        // Assign class based on new index (0 -> page-1, 1 -> page-2, etc)
        // We strip existing page-X classes and add the new one
        page.classList.remove('page-1', 'page-2', 'page-3');
        page.classList.add(`page-${index + 1}`);

        // Force Reflow
        void page.offsetWidth;

        // Re-enable transitions for hover effects
        page.style.transition = '';
      });

      isAnimating2 = false;
    }, 500);
  });
}
