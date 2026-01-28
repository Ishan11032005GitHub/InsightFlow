(function(){
  // ======= CONFIG =======
  const API_BASE = "http://localhost:6001"; // Backend API endpoint
  
  console.log('Dashboard loading...');
  console.log('localStorage keys:', Object.keys(localStorage));

  // ======= AUTH GUARD =======
  const token = localStorage.getItem("token");
  console.log('Token:', token ? 'Present' : 'Missing');
  if(!token){
    console.warn('No token, redirecting to auth');
    window.location.href = "auth.html";
    return;
  }
  console.log('Auth OK, continuing...');

  // ======= THEME =======
  const html = document.documentElement;
  html.setAttribute("data-theme", localStorage.getItem("theme") || "dark");

  const themeToggle = document.getElementById("themeToggle");
  function refreshThemeIcon(){
    themeToggle.innerHTML = html.getAttribute("data-theme")==="dark"
      ? '<i data-lucide="moon"></i>'
      : '<i data-lucide="sun"></i>';
    lucide?.createIcons();
  }
  themeToggle?.addEventListener("click", () => {
    const next = html.getAttribute("data-theme")==="dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    refreshThemeIcon();
  });
  refreshThemeIcon();

  // ======= USER LABEL =======
  const userLabel = document.getElementById("userLabel");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  userLabel.textContent = user.name ? `@${user.name}` : (user.email || "User");

  // ======= LOGOUT =======
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "intro.html";
  });

  // ======= TOAST =======
  function showToast(type, message){
    const container = document.getElementById("toastContainer");
    if(!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i data-lucide="${
      type==="success" ? "check-circle" :
      type==="error" ? "alert-triangle" : "info"
    }"></i><span>${message}</span>`;
    container.appendChild(toast);
    lucide?.createIcons();
    setTimeout(()=> toast.remove(), 3500);
  }

  // ======= VIEWS / NAV =======
  const navItems = document.querySelectorAll(".nav-item");
  const views = {
    analysis: document.getElementById("view-analysis"),
    pdfchat: document.getElementById("view-pdfchat"),
    sessions: document.getElementById("view-sessions")
  };

  const pageTitle = document.getElementById("pageTitle");
  const pageSub = document.getElementById("pageSub");

  function setView(name){
    Object.values(views).forEach(v => v.classList.remove("active"));
    views[name]?.classList.add("active");

    navItems.forEach(b => b.classList.remove("active"));
    document.querySelector(`.nav-item[data-view="${name}"]`)?.classList.add("active");

    if(name==="analysis"){
      pageTitle.textContent = "Data Analysis";
      pageSub.textContent = "Upload CSV or paste numeric values. Export charts and report.";
    } else if(name==="pdfchat"){
      pageTitle.textContent = "Chat with PDF";
      pageSub.textContent = "Upload PDF and chat. UI ready for RAG integration.";
    } else {
      pageTitle.textContent = "Sessions";
      pageSub.textContent = "Local session memory (can be moved to MongoDB later).";
    }
  }

  navItems.forEach(btn => btn.addEventListener("click", () => setView(btn.dataset.view)));

  // ======= SESSIONS (LOCAL) =======
  const sessionKey = "insightflow_sessions";
  const sessionList = document.getElementById("sessionList");

  function loadSessions(){
    return JSON.parse(localStorage.getItem(sessionKey) || "[]");
  }
  function saveSessions(s){
    localStorage.setItem(sessionKey, JSON.stringify(s));
  }
  function renderSessions(){
    const s = loadSessions();
    sessionList.innerHTML = "";
    if(!s.length){
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
        if(item.type==="analysis"){
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
        if(idx >= 0){
          all.splice(idx,1);
          saveSessions(all);
          renderSessions();
          showToast("success","Session deleted.");
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
    showToast("success","New session created.");
  });

  document.getElementById("clearSessionsBtn")?.addEventListener("click", () => {
    localStorage.removeItem(sessionKey);
    renderSessions();
    showToast("success","Sessions cleared.");
  });

  document.getElementById("exportSessionsBtn")?.addEventListener("click", () => {
    const s = loadSessions();
    const blob = new Blob([JSON.stringify(s,null,2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sessions.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  // ======= ANALYSIS MODE =======
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

  function showValidation(type, message){
    validationMessage.classList.remove("hidden","validation-error","validation-success");
    validationMessage.classList.add(type==="error"?"validation-error":"validation-success");
    validationMessage.innerHTML = `<i data-lucide="${type==="error"?"alert-circle":"check-circle"}"></i><span>${message}</span>`;
    lucide?.createIcons();
  }
  function hideValidation(){
    validationMessage.classList.add("hidden");
  }

  function parseCSV(text){
    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if(lines.length < 2) throw new Error("CSV must contain header + at least 1 row.");

    const headers = lines[0].split(",").map(h => h.trim());
    const rows = lines.slice(1).map(line => line.split(",").map(v => Number(v.trim())));
    return { headers, rows };
  }

  function renderPreview(data){
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

  function showSkeleton(){
    tableSkeleton.style.display = "block";
    tableContent.style.display = "none";
  }
  function hideSkeleton(){
    tableSkeleton.style.display = "none";
    tableContent.style.display = "block";
  }

  fileInput?.addEventListener("change", (e) => {
    hideValidation();
    const file = e.target.files[0];
    if(!file) return;

    if(!file.name.toLowerCase().endsWith(".csv")){
      showValidation("error","Upload a valid CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try{
        csvData = parseCSV(ev.target.result);
        renderPreview(csvData);
        showValidation("success","CSV loaded successfully.");
      }catch(err){
        showValidation("error", err.message);
      }
    };
    reader.readAsText(file);
  });

  dataInput?.addEventListener("input", () => {
    hideValidation();
    const input = dataInput.value.trim();
    if(!input) return;

    const valid = /^[0-9,\s.\-]+$/.test(input);
    if(!valid){
      showValidation("error","Only numbers, commas, dot, minus allowed.");
      return;
    }
    csvData = null;
    showValidation("success","Valid numeric input detected.");
  });

  generateBtn?.addEventListener("click", () => {
    hideValidation();

    if(!csvData && !dataInput.value.trim()){
      showValidation("error","Upload CSV or paste numeric values.");
      return;
    }

    showSkeleton();
    loadingSpinner.classList.remove("hidden");
    generateBtn.disabled = true;

    setTimeout(() => {
      try{
        let data = csvData;
        if(!data){
          const values = dataInput.value.split(",").map(v => Number(v.trim()));
          data = { headers:["Values"], rows: values.map(v => [v]) };
        }

        if(data.rows.flat().some(v => !Number.isFinite(v))){
          throw new Error("Data contains invalid numbers.");
        }

        const report = [];
        data.headers.forEach((header, colIndex) => {
          const vals = data.rows.map(r => r[colIndex]);
          const total = vals.reduce((a,b)=>a+b,0);
          const avg = total / vals.length;
          const max = Math.max(...vals);
          const min = Math.min(...vals);
          report.push({ header, total, avg, max, min });
        });

        lastReport = report;
        hideSkeleton();

        // Render report table
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

        // Charts
        const labels = report.map(r => r.header);
        const avgs = report.map(r => r.avg);
        const totals = report.map(r => r.total);

        if(barChart) barChart.destroy();
        if(pieChart) pieChart.destroy();

        const chartsContainer = document.getElementById("chartsContainer");
        chartsContainer.style.display = "grid";

        barChart = new Chart(document.getElementById("barChart"), {
          type: "bar",
          data: { labels, datasets: [{ label:"Average", data: avgs, backgroundColor: 'rgba(124,92,255,0.7)' }] }
        });

        pieChart = new Chart(document.getElementById("pieChart"), {
          type: "pie",
          data: { labels, datasets: [{ data: totals, backgroundColor: ['rgba(124,92,255,0.7)', 'rgba(79,209,255,0.7)', 'rgba(168,85,247,0.7)', 'rgba(236,72,153,0.7)'] }] }
        });

        barDownload.classList.remove("hidden");
        pieDownload.classList.remove("hidden");
        downloadBtn.classList.remove("hidden");

        // Insight (deterministic)
        const avgOfAvgs = report.reduce((s,r)=>s+r.avg,0) / report.length;
        insightText.style.display = "block";
        insightText.textContent = avgOfAvgs >= 75
          ? "Overall dataset performance is strong across numeric columns."
          : "Dataset performance indicates scope for improvement (based on averages).";

        showToast("success","Report generated.");
      }catch(err){
        showValidation("error", err.message);
      }finally{
        loadingSpinner.classList.add("hidden");
        generateBtn.disabled = false;
        hideSkeleton();
      }
    }, 650);
  });

  downloadBtn?.addEventListener("click", () => {
    if(!lastReport) return;
    let csv = "Column,Total,Average,Maximum,Minimum\n";
    lastReport.forEach(r => {
      csv += `${r.header},${r.total},${r.avg.toFixed(2)},${r.max},${r.min}\n`;
    });
    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis_report.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("success","CSV downloaded.");
  });

  function downloadChart(id, name){
    const canvas = document.getElementById(id);
    if(!canvas) return;
    const link = document.createElement("a");
    link.download = name;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  barDownload?.addEventListener("click", () => downloadChart("barChart","bar_chart.png"));
  pieDownload?.addEventListener("click", () => downloadChart("pieChart","pie_chart.png"));

  // ======= PDF CHAT (UI + optional API hook) =======
  const pdfInput = document.getElementById("pdfInput");
  const chatPrompt = document.getElementById("chatPrompt");
  const sendChatBtn = document.getElementById("sendChatBtn");
  const chatArea = document.getElementById("chatArea");
  const clearChatBtn = document.getElementById("clearChatBtn");
  
  // Validate elements exist
  console.log('PDF Chat Elements:');
  console.log('  pdfInput:', pdfInput ? 'Found' : 'MISSING!');
  console.log('  chatPrompt:', chatPrompt ? 'Found' : 'MISSING!');
  console.log('  sendChatBtn:', sendChatBtn ? 'Found' : 'MISSING!');
  console.log('  chatArea:', chatArea ? 'Found' : 'MISSING!');
  console.log('  clearChatBtn:', clearChatBtn ? 'Found' : 'MISSING!');

  let currentPdfName = null;
  let currentDocumentId = null;
  let chatHistory = [];
  let isUploading = false; // Flag to prevent issues during upload
  
  // Restore state from sessionStorage if page was reloaded
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
    
    // Prevent page from leaving during upload
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
      if(!file) {
        console.log('No file selected');
        isUploading = false;
        window.removeEventListener('beforeunload', preventUnload);
        return;
      }
      console.log('✓ File:', file.name);

      console.log('Step 2: Checking file type...');
      if(file.type !== "application/pdf"){
        console.warn('Invalid file type:', file.type);
        showToast("error","Please upload a valid PDF.");
        isUploading = false;
        window.removeEventListener('beforeunload', preventUnload);
        return;
      }
      console.log('✓ File type is PDF');
      
      // Upload PDF to backend
      console.log('Step 3: Creating FormData...');
      const formData = new FormData();
      formData.append("file", file);
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
      
      console.log('Step 7: Validating document ID...');
      if (!data.document?.id) {
        console.error('Document ID missing in response!', data);
        throw new Error('Server returned invalid document ID');
      }
      console.log('✓ Document ID valid:', data.document.id);
      
      console.log('Step 8: Updating state variables...');
      currentDocumentId = data.document.id;
      currentPdfName = data.document.filename || file.name;
      console.log('✓ State updated:', { currentPdfName, currentDocumentId });
      
      // Persist state to sessionStorage in case of page reload
      console.log('Step 9: Persisting to sessionStorage...');
      sessionStorage.setItem('currentPdfName', currentPdfName);
      sessionStorage.setItem('currentDocumentId', currentDocumentId);
      console.log('✓ SessionStorage updated');
      
      console.log('Step 10: Showing success toast...');
      showToast("success", `PDF uploaded: ${currentPdfName}`);
      console.log('✓ Toast shown');
      
      console.log('Step 11: Resetting chat history...');
      chatHistory = [];
      console.log('✓ Chat history reset');
      
      console.log('Step 12: Calling renderChat()...');
      try {
        renderChat();
        console.log('✓ renderChat() completed successfully');
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
      // Clear the file input on error so user can retry
      if (pdfInput) pdfInput.value = '';
    } finally {
      console.log('Step FINAL: Cleanup...');
      isUploading = false;
      window.removeEventListener('beforeunload', preventUnload);
      console.log('✓ Upload flag reset, unload prevention removed');
    }
  });

  function pushMsg(role, text){
    chatHistory.push({ role, text, at: Date.now() });
    renderChat();
  }

  function renderChat(){
    if (!chatArea) {
      console.error('chatArea element not found!');
      return;
    }
    console.log('renderChat called, currentPdfName:', currentPdfName, 'chatArea:', chatArea);
    chatArea.innerHTML = "";
    if(!currentPdfName){
      chatArea.innerHTML = `<div class="placeholder">Upload a PDF and ask a question.</div>`;
      console.log('No PDF - showing placeholder');
      return;
    }
    if(!chatHistory.length){
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
    if(!q){
      showToast("error","Type a question.");
      return;
    }
    if(!currentPdfName){
      showToast("error","Upload a PDF first.");
      return;
    }

    pushMsg("user", q);
    chatPrompt.value = "";

    // Call RAG chat endpoint
    try {
      const res = await fetch(`${API_BASE}/api/rag/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          documentId: currentDocumentId, 
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
    showToast("success","Chat cleared.");
  });

  // ======= PAGE UNLOAD TRACKING =======
  window.addEventListener('beforeunload', (e) => {
    console.log('Page beforeunload event fired');
    console.log('Event:', e);
  });
  
  window.addEventListener('unload', () => {
    console.log('Page unload event fired');
  });
  
  // Catch any unhandled errors
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    console.error('Error message:', event.message);
    console.error('Error stack:', event.error?.stack);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });

  // ======= INIT =======
  console.log('Initializing dashboard...');
  lucide?.createIcons();
  refreshThemeIcon();
  renderSessions();
  setView("pdfchat");
  
  // If we restored PDF state, render the chat
  if (currentPdfName) {
    console.log('Rendering chat with restored PDF state');
    renderChat();
  }
  
  console.log('Dashboard initialized, view set to pdfchat');
})();
