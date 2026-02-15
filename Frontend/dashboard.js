(function () {

  const API_BASE = "http://localhost:6001";

  console.log('Dashboard loading...');
  console.log('localStorage keys:', Object.keys(localStorage));


  const token = localStorage.getItem("token");
  console.log('Token:', token ? 'Present' : 'Missing');
  if (!token) {
    console.warn('No token, redirecting to auth');
    window.location.href = "auth.html";
    return;
  }
  console.log('Auth OK, continuing...');


  const html = document.documentElement;
  html.setAttribute("data-theme", localStorage.getItem("theme") || "dark");

  const themeToggle = document.getElementById("themeToggle");
  function refreshThemeIcon() {
    if (!themeToggle) return;
    themeToggle.innerHTML = html.getAttribute("data-theme") === "dark"
      ? '<i data-lucide="moon"></i>'
      : '<i data-lucide="sun"></i>';
    lucide?.createIcons();
  }
  themeToggle?.addEventListener("click", () => {
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    refreshThemeIcon();
  });
  if (themeToggle) refreshThemeIcon();


  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userNameEl = document.getElementById("userName");
  const userAvatarEl = document.getElementById("userAvatar");

  if (user.name) {
    if (userNameEl) userNameEl.textContent = user.name;
    if (userAvatarEl) userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
  } else if (user.email) {
    const fallbackName = user.email.split('@')[0];
    if (userNameEl) userNameEl.textContent = fallbackName;
    if (userAvatarEl) userAvatarEl.textContent = fallbackName.charAt(0).toUpperCase();
  }


  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "intro.html";
  });


  function showToast(type, message) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i data-lucide="${type === "success" ? "check-circle" :
      type === "error" ? "alert-triangle" : "info"
      }"></i><span>${message}</span>`;
    container.appendChild(toast);
    lucide?.createIcons();

    // Fade out and remove
    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 400); // Match CSS transition
    }, 3100);
  }


  const navItems = document.querySelectorAll(".nav-item");
  const views = {
    analysis: document.getElementById("view-analysis"),
    pdfchat: document.getElementById("view-pdfchat"),
    sessions: document.getElementById("view-sessions"),
    settings: document.getElementById("view-settings")
  };

  const pageTitle = document.getElementById("pageTitle");
  const pageSub = document.getElementById("pageSub");

  function setView(name) {
    // 1. Identify current active view
    const currentActive = document.querySelector('.view.active');

    // 2. Identify target view
    const targetView = views[name];
    if (!targetView) return;
    if (currentActive === targetView) return; // Already there

    // 3. Update Nav
    navItems.forEach(b => b.classList.remove("active"));
    document.querySelector(`.nav-item[data-view="${name}"]`)?.classList.add("active");

    // 4. Update Header Text (Delay slightly to match visual transition if desired, or instant)
    if (name === "analysis") {
      pageTitle.textContent = "Data Analysis";
      pageSub.textContent = "Upload CSV or paste numeric values. Export charts and report.";
    } else if (name === "pdfchat") {
      pageTitle.textContent = "Chat with PDF";
      pageSub.textContent = "Upload PDF and chat. AI powered by RAG.";
    } else if (name === "sessions") {
      pageTitle.textContent = "Sessions";
      pageSub.textContent = "History of your previous interactions.";
    } else if (name === "settings") {
      pageTitle.textContent = "Settings";
      pageSub.textContent = "Manage your preferences and profile.";
    }

    // 5. Transition Logic
    if (currentActive) {
      // Fade out
      currentActive.style.opacity = '0';
      currentActive.style.transform = 'translateY(10px)';

      setTimeout(() => {
        currentActive.classList.remove("active");
        currentActive.style.display = 'none'; // Ensure it's gone

        // Prepare target view for entry
        targetView.style.display = 'block';
        targetView.style.opacity = '0';
        targetView.style.transform = 'translateY(10px)';
        targetView.classList.add("active");

        // Force Reflow
        void targetView.offsetWidth;

        // Fade in
        targetView.style.opacity = '1';
        targetView.style.transform = 'translateY(0)';
      }, 300); // Wait for CSS transition (0.3s)
    } else {
      // First load (instant)
      targetView.classList.add("active");
      targetView.style.opacity = '1';
      targetView.style.transform = 'translateY(0)';
    }
  }

  navItems.forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));


  const sessionKey = "insightflow_sessions";
  const sessionList = document.getElementById("sessionList");

  function loadSessions() {
    return JSON.parse(localStorage.getItem(sessionKey) || "[]");
  }
  function saveSessions(s) {
    localStorage.setItem(sessionKey, JSON.stringify(s));
  }
  function renderSessions() {
    const s = loadSessions();
    sessionList.innerHTML = "";
    if (!s.length) {
      sessionList.innerHTML = `<div class="muted">No sessions yet.</div>`;
      return;
    }

    s.slice().reverse().forEach(item => {
      const div = document.createElement("div");
      div.className = "session-item";
      div.innerHTML = `
        <div class="session-meta">
          <strong>${item.title}</strong>
          <span class="muted tiny">${new Date(item.createdAt).toLocaleString()}</span>
          <span class="muted tiny">${item.type}</span>
        </div>
        <div class="session-actions">
          <button class="btn btn-outline btn-sm" data-action="open">Open</button>
          <button class="btn btn-outline btn-sm" data-action="delete">Delete</button>
        </div>
      `;

      div.querySelector('[data-action="open"]').addEventListener("click", () => {
        if (item.type === "analysis") {
          setView("analysis");
          showToast("info", "Switched to Analysis view.");
        } else {
          setView("pdfchat");
          showToast("info", "Switched to PDF Chat view.");
        }
      });

      div.querySelector('[data-action="delete"]').addEventListener("click", () => {
        const all = loadSessions();
        const idx = all.findIndex(x => x.id === item.id);
        if (idx >= 0) {
          all.splice(idx, 1);
          saveSessions(all);
          renderSessions();
          showToast("success", "Session deleted.");
        }
      });

      sessionList.appendChild(div);
    });
  }

  document.getElementById("newSessionBtn")?.addEventListener("click", () => {
    const all = loadSessions();
    const id = crypto.randomUUID?.() || String(Date.now());
    const activeView = document.querySelector(".nav-item.active")?.dataset.view || "analysis";

    all.push({
      id,
      title: `Session ${all.length + 1}`,
      type: activeView === "pdfchat" ? "pdfchat" : "analysis",
      createdAt: Date.now()
    });
    saveSessions(all);
    renderSessions();
    showToast("success", "New session created.");
  });

  document.getElementById("clearSessionsBtn")?.addEventListener("click", () => {
    localStorage.removeItem(sessionKey);
    renderSessions();
    showToast("success", "Sessions cleared.");
  });

  document.getElementById("exportSessionsBtn")?.addEventListener("click", () => {
    const s = loadSessions();
    const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sessions.json";
    a.click();
    URL.revokeObjectURL(url);
  });


  let csvData = null;
  let lastReport = null;
  let barChart = null;
  let pieChart = null;

  const fileInput = document.getElementById("fileInput");
  const dataInput = document.getElementById("dataInput");
  const generateBtn = document.getElementById("generateBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const validationMessage = document.getElementById("validationMessage");
  const insightText = document.getElementById("insightText");
  const tableContent = document.getElementById("tableContent");
  const tableSkeleton = document.getElementById("tableSkeleton");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const barDownload = document.getElementById("barDownload");
  const pieDownload = document.getElementById("pieDownload");

  function showValidation(type, message) {
    validationMessage.classList.remove("hidden", "validation-error", "validation-success");
    validationMessage.classList.add(type === "error" ? "validation-error" : "validation-success");
    validationMessage.innerHTML = `<i data-lucide="${type === "error" ? "alert-circle" : "check-circle"}"></i><span>${message}</span>`;
    lucide?.createIcons();
  }
  function hideValidation() {
    validationMessage.classList.add("hidden");
  }

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error("CSV must contain header + at least 1 row.");

    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(",").map(v => Number(v.trim())));
    return { headers, rows };
  }

  function renderPreview(data) {
    let html = "<table><tr>";
    data.headers.forEach(h => html += `<th>${h}</th>`);
    html += "</tr>";

    data.rows.slice(0, 25).forEach(row => {
      html += "<tr>";
      row.forEach(cell => html += `<td>${Number.isFinite(cell) ? cell : ""}</td>`);
      html += "</tr>";
    });

    html += "</table>";
    tableContent.innerHTML = html;
  }

  function showSkeleton() {
    tableSkeleton.style.display = "block";
    tableContent.style.display = "none";
  }
  function hideSkeleton() {
    tableSkeleton.style.display = "none";
    tableContent.style.display = "block";
  }

  fileInput?.addEventListener("change", (e) => {
    hideValidation();
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      showValidation("error", "Upload a valid CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        csvData = parseCSV(ev.target.result);
        renderPreview(csvData);
        showValidation("success", "CSV loaded successfully.");
      } catch (err) {
        showValidation("error", err.message);
      }
    };
    reader.readAsText(file);
  });

  dataInput?.addEventListener("input", () => {
    hideValidation();
    const input = dataInput.value.trim();
    if (!input) return;

    const valid = /^[0-9,\s.\-]+$/.test(input);
    if (!valid) {
      showValidation("error", "Only numbers, commas, dot, minus allowed.");
      return;
    }
    csvData = null;
    showValidation("success", "Valid numeric input detected.");
  });

  generateBtn?.addEventListener("click", () => {
    hideValidation();

    if (!csvData && !dataInput.value.trim()) {
      showValidation("error", "Upload CSV or paste numeric values.");
      return;
    }

    showSkeleton();
    loadingSpinner.classList.remove("hidden");
    generateBtn.disabled = true;

    setTimeout(() => {
      try {
        let data = csvData;
        if (!data) {
          const values = dataInput.value.split(",").map(v => Number(v.trim()));
          data = { headers: ["Values"], rows: values.map(v => [v]) };
        }

        if (data.rows.flat().some(v => !Number.isFinite(v))) {
          throw new Error("Data contains invalid numbers.");
        }

        const report = [];
        data.headers.forEach((header, colIndex) => {
          const vals = data.rows.map(r => r[colIndex]);
          const total = vals.reduce((a, b) => a + b, 0);
          const avg = total / vals.length;
          const max = Math.max(...vals);
          const min = Math.min(...vals);
          report.push({ header, total, avg, max, min });
        });

        lastReport = report;
        hideSkeleton();


        let html = "<table><tr><th>Column</th><th>Total</th><th>Average</th><th>Max</th><th>Min</th></tr>";
        report.forEach(r => {
          html += `<tr>
            <td>${r.header}</td>
            <td>${r.total}</td>
            <td>${r.avg.toFixed(2)}</td>
            <td>${r.max}</td>
            <td>${r.min}</td>
          </tr>`;
        });
        html += "</table>";
        tableContent.innerHTML = html;


        const labels = report.map(r => r.header);
        const avgs = report.map(r => r.avg);
        const totals = report.map(r => r.total);

        if (barChart) barChart.destroy();
        if (pieChart) pieChart.destroy();

        const chartsContainer = document.getElementById("chartsContainer");
        chartsContainer.style.display = "grid";

        barChart = new Chart(document.getElementById("barChart"), {
          type: "bar",
          data: { labels, datasets: [{ label: "Average", data: avgs, backgroundColor: 'rgba(124,92,255,0.7)' }] }
        });

        pieChart = new Chart(document.getElementById("pieChart"), {
          type: "pie",
          data: { labels, datasets: [{ data: totals, backgroundColor: ['rgba(124,92,255,0.7)', 'rgba(79,209,255,0.7)', 'rgba(168,85,247,0.7)', 'rgba(236,72,153,0.7)'] }] }
        });

        barDownload.classList.remove("hidden");
        pieDownload.classList.remove("hidden");
        downloadBtn.classList.remove("hidden");


        const avgOfAvgs = report.reduce((s, r) => s + r.avg, 0) / report.length;
        insightText.style.display = "block";
        insightText.textContent = avgOfAvgs >= 75
          ? "Overall dataset performance is strong across numeric columns."
          : "Dataset performance indicates scope for improvement (based on averages).";

        showToast("success", "Report generated.");
      } catch (err) {
        showValidation("error", err.message);
      } finally {
        loadingSpinner.classList.add("hidden");
        generateBtn.disabled = false;
        hideSkeleton();
      }
    }, 650);
  });

  downloadBtn?.addEventListener("click", () => {
    if (!lastReport) return;
    let csv = "Column,Total,Average,Maximum,Minimum\n";
    lastReport.forEach(r => {
      csv += `${r.header},${r.total},${r.avg.toFixed(2)},${r.max},${r.min}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "CSV downloaded.");
  });

  function downloadChart(id, name) {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = name;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  barDownload?.addEventListener("click", () => downloadChart("barChart", "bar_chart.png"));
  pieDownload?.addEventListener("click", () => downloadChart("pieChart", "pie_chart.png"));


  const pdfInput = document.getElementById("pdfInput");
  const chatPrompt = document.getElementById("chatPrompt");
  const sendChatBtn = document.getElementById("sendChatBtn");
  const chatArea = document.getElementById("chatArea");
  const clearChatBtn = document.getElementById("clearChatBtn");


  console.log('PDF Chat Elements:');
  console.log('  pdfInput:', pdfInput ? 'Found' : 'MISSING!');
  console.log('  chatPrompt:', chatPrompt ? 'Found' : 'MISSING!');
  console.log('  sendChatBtn:', sendChatBtn ? 'Found' : 'MISSING!');
  console.log('  chatArea:', chatArea ? 'Found' : 'MISSING!');
  console.log('  clearChatBtn:', clearChatBtn ? 'Found' : 'MISSING!');

  let currentPdfName = null;
  let currentDocumentId = null;
  let chatHistory = [];
  let isUploading = false;



  const savedPdfName = sessionStorage.getItem('currentPdfName');
  const savedDocumentId = sessionStorage.getItem('currentDocumentId');
  if (savedPdfName && savedDocumentId) {
    console.log('Restoring state from sessionStorage');
    currentPdfName = savedPdfName;
    currentDocumentId = savedDocumentId;
    console.log('Restored: PDF=', currentPdfName, 'ID=', currentDocumentId);
  }

  pdfInput?.addEventListener("change", async (e) => {
    console.log('=== PDF INPUT CHANGE EVENT ===');
    if (isUploading) {
      console.warn('Upload already in progress');
      return;
    }
    isUploading = true;
    console.log('Upload started');


    const preventUnload = (evt) => {
      evt.preventDefault();
      evt.returnValue = '';
      console.log('✓ Page unload prevented');
    };
    window.addEventListener('beforeunload', preventUnload);
    console.log('✓ Unload prevention attached');

    try {
      console.log('Step 1: Getting file...');
      const file = e.target.files[0];
      if (!file) {
        console.log('No file selected');
        isUploading = false;
        window.removeEventListener('beforeunload', preventUnload);
        return;
      }
      console.log('✓ File:', file.name);

      console.log('Step 2: Checking file type...');
      if (file.type !== "application/pdf") {
        console.warn('Invalid file type:', file.type);
        showToast("error", "Please upload a valid PDF.");
        isUploading = false;
        window.removeEventListener('beforeunload', preventUnload);
        return;
      }
      console.log('✓ File type is PDF');


      console.log('Step 3: Creating FormData...');
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", "default-rag-project"); // Satisfy older backend versions
      console.log('✓ FormData created');

      console.log('Step 4: Sending fetch request...');
      const res = await fetch(`${API_BASE}/api/rag/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });
      console.log('✓ Fetch response received, status:', res.status);

      console.log('Step 5: Checking response status...');
      if (!res.ok) {
        console.error('Response not OK');
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }
      console.log('✓ Response OK');

      console.log('Step 6: Parsing JSON response...');
      const data = await res.json();
      console.log('✓ JSON parsed:', data);

      // Support both wrapped {document: {id}} and unwrapped {id} responses
      const docData = data.document || data;

      console.log('Step 7: Validating document ID...');
      if (!docData || !docData.id) {
        console.error('Document ID missing in response!', data);
        throw new Error('Server returned invalid document ID. Check backend logs.');
      }
      console.log('✓ Document ID valid:', docData.id);

      console.log('Step 8: Updating state variables...');
      currentDocumentId = docData.id;
      currentPdfName = docData.filename || docData.name || file.name;
      console.log('✓ State updated:', { currentPdfName, currentDocumentId });


      console.log('Step 9: Persisting to sessionStorage...');
      sessionStorage.setItem('currentPdfName', currentPdfName);
      sessionStorage.setItem('currentDocumentId', currentDocumentId);
      console.log('✓ SessionStorage updated');

      showToast("success", `PDF uploaded: ${currentPdfName}`);

      chatHistory = [];
      sessionStorage.removeItem('chatHistory'); // Clear old history for new file

      console.log('Step 12: Calling renderChat()...');
      try {
        renderChat();
        if (pdfInput) pdfInput.value = ''; // Reset to allow re-uploading same file
        console.log('✓ renderChat() completed and input reset');
      } catch (renderErr) {
        console.error('✗ renderChat() threw error:', renderErr);
        console.error('  Error message:', renderErr.message);
        console.error('  Error stack:', renderErr.stack);
        throw renderErr;
      }

      console.log('=== UPLOAD COMPLETE - SUCCESS ===');
    } catch (err) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error type:', err.constructor.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      showToast("error", `Upload error: ${err.message}`);

      if (pdfInput) pdfInput.value = '';
    } finally {
      console.log('Step FINAL: Cleanup...');
      isUploading = false;
      window.removeEventListener('beforeunload', preventUnload);
      console.log('✓ Upload flag reset, unload prevention removed');
    }
  });

  function pushMsg(role, text) {
    chatHistory.push({ role, text, at: Date.now() });
    renderChat();
  }

  function renderChat() {
    if (!chatArea) {
      console.error('chatArea element not found!');
      return;
    }
    console.log('renderChat called, currentPdfName:', currentPdfName, 'chatArea:', chatArea);
    chatArea.innerHTML = "";
    if (!currentPdfName) {
      chatArea.innerHTML = `<div class="placeholder">Upload a PDF and ask a question.</div>`;
      console.log('No PDF - showing placeholder');
      return;
    }
    if (!chatHistory.length) {
      const msg = `PDF ready: ${currentPdfName}. Ask your first question.`;
      chatArea.innerHTML = `<div class="placeholder">${msg}</div>`;
      console.log('PDF ready - showing ready message:', msg);
      return;
    }

    chatHistory.forEach(m => {
      const div = document.createElement("div");
      div.className = `bubble ${m.role === "user" ? "user" : "bot"}`;
      div.textContent = m.text;
      chatArea.appendChild(div);
    });

    chatArea.scrollTop = chatArea.scrollHeight;
  }

  sendChatBtn?.addEventListener("click", async () => {
    const q = chatPrompt.value.trim();
    if (!q) {
      showToast("error", "Type a question.");
      return;
    }
    if (!currentPdfName) {
      showToast("error", "Upload a PDF first.");
      return;
    }

    pushMsg("user", q);
    chatPrompt.value = "";


    try {
      const res = await fetch(`${API_BASE}/api/rag/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: currentDocumentId,
          projectId: "default-rag-project", // Satisfy older backend versions
          message: q
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "RAG chat failed");
      }

      const data = await res.json();
      pushMsg("bot", data.answer || "No answer returned");
    } catch (err) {
      pushMsg("bot", `Error: ${err.message}`);
    }
  });

  clearChatBtn?.addEventListener("click", () => {
    chatHistory = [];
    renderChat();
    showToast("success", "Chat cleared.");
  });


  window.addEventListener('beforeunload', (e) => {
    console.log('Page beforeunload event fired');
    console.log('Event:', e);
  });

  window.addEventListener('unload', () => {
    console.log('Page unload event fired');
  });


  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    console.error('Error message:', event.message);
    console.error('Error stack:', event.error?.stack);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });


  console.log('Initializing dashboard...');
  lucide?.createIcons();
  refreshThemeIcon();
  renderSessions();
  setView("pdfchat");


  if (currentPdfName) {
    console.log('Rendering chat with restored PDF state');
    renderChat();
  }

  /* =========================================
     LIVE SPACE BACKGROUND THEME (Ported from intro.js)
     ========================================= */
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];
    let planets = [];

    // Config - High density for "Space" feel
    let particleCount = window.innerWidth < 768 ? 80 : 250;
    const connectionDistance = 140;
    const mouseDistance = 300;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particleCount = window.innerWidth < 768 ? 80 : 250;
      initParticles();
    }

    window.addEventListener('resize', resize);

    // Shooting Star Class
    class ShootingStar {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height * 0.5; // Start better in top half
        this.len = Math.random() * 80 + 10;
        this.speed = Math.random() * 10 + 6;
        this.size = Math.random() * 1 + 0.1;
        // Angle: 45 degrees mostly
        this.angle = Math.PI / 4;
        this.waitTime = new Date().getTime() + Math.random() * 3000 + 500;
        this.active = false;
      }

      update() {
        if (this.active) {
          this.x -= this.speed;
          this.y += this.speed;
          if (this.x < 0 || this.y >= height) {
            this.active = false;
            this.waitTime = new Date().getTime() + Math.random() * 3000 + 500;
          }
        } else {
          if (this.waitTime < new Date().getTime()) {
            this.active = true;
            this.x = Math.random() * width + 200; // Offset start
            this.y = -50;
          }
        }
      }

      draw() {
        if (this.active) {
          ctx.strokeStyle = "rgba(255, 255, 255, " + Math.random() + ")";
          ctx.lineWidth = this.size;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x + this.len, this.y - this.len);
          ctx.stroke();
        }
      }
    }

    // Particle Class with Depth (Z-axis simulation)
    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 2 + 0.5; // Depth factor (0.5 to 2.5)

        // Closer particles move faster
        this.vx = (Math.random() - 0.5) * (0.5 * this.z);
        this.vy = (Math.random() - 0.5) * (0.5 * this.z);

        // Closer particles are larger
        this.size = (Math.random() * 1.5 + 0.5) * this.z;

        const colors = [
          'rgba(0, 243, 255,',   // Cyan
          'rgba(124, 92, 255,',  // Purple
          'rgba(255, 255, 255,', // White
          'rgba(255, 0, 212,'    // Neon Pink
        ];
        this.colorBase = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = Math.random() * 0.5 + 0.2;
        this.pulsateSpeed = 0.01 + Math.random() * 0.02;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.opacity += this.pulsateSpeed;
        if (this.opacity >= 1 || this.opacity <= 0.1) this.pulsateSpeed *= -1;

        if (this.x < -20) this.x = width + 20;
        if (this.x > width + 20) this.x = -20;
        if (this.y < -20) this.y = height + 20;
        if (this.y > height + 20) this.y = -20;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.colorBase + (this.opacity * (this.z / 2)) + ')'; // Fade distant particles
        ctx.shadowBlur = 10 * this.z; // More glow for closer particles
        ctx.shadowColor = this.colorBase + '0.6)';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Nebula / Space Fog Class
    class Nebula {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 300 + 200;
        this.vx = (Math.random() - 0.5) * 0.1;
        this.vy = (Math.random() - 0.5) * 0.1;

        const colors = [
          'rgba(76, 0, 255, 0.03)',   // Deep Blue/Purple
          'rgba(0, 243, 255, 0.02)',  // Cyan
          'rgba(255, 0, 128, 0.02)'   // Magenta
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = height + this.size;
        if (this.y > height + this.size) this.y = -this.size;
      }

      draw() {
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        g.addColorStop(0, this.color);
        g.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let nebulas = [];
    let shootingStars = [];

    function initNebulas() {
      nebulas = [];
      for (let i = 0; i < 6; i++) {
        nebulas.push(new Nebula());
      }
    }

    function initShootingStars() {
      shootingStars = [];
      for (let i = 0; i < 3; i++) {
        shootingStars.push(new ShootingStar());
      }
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Nebulas
      nebulas.forEach(n => {
        n.update();
        n.draw();
      });

      // 2. Draw Shooting Stars
      shootingStars.forEach(s => {
        s.update();
        s.draw();
      });

      // 3. Draw Particles & Connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update();

        for (let j = i; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            ctx.beginPath();
            const opacity = (1 - dist / connectionDistance) * 0.15;
            ctx.strokeStyle = `rgba(124, 92, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
        p.draw();
      }
      requestAnimationFrame(animate);
    }

    resize();
    initShootingStars();
    initNebulas();
    animate();
  }

  console.log('Dashboard initialized, view set to pdfchat');
})();
