(function(){
  // ======= CONFIG =======
  const API_BASE = "http://localhost:5000"; // change if needed

  // ======= AUTH GUARD =======
  const token = localStorage.getItem("token");
  if(!token){
    window.location.href = "auth.html";
    return;
  }

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

  // ======= USER LABEL =======
  const userLabel = document.getElementById("userLabel");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  userLabel.textContent = user.username ? `@${user.username}` : (user.email || "User");

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

        barChart = new Chart(document.getElementById("barChart"), {
          type: "bar",
          data: { labels, datasets: [{ label:"Average", data: avgs }] }
        });

        pieChart = new Chart(document.getElementById("pieChart"), {
          type: "pie",
          data: { labels, datasets: [{ data: totals }] }
        });

        barDownload.classList.remove("hidden");
        pieDownload.classList.remove("hidden");
        downloadBtn.classList.remove("hidden");

        // Insight (deterministic)
        const avgOfAvgs = report.reduce((s,r)=>s+r.avg,0) / report.length;
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

  let currentPdfName = null;
  let chatHistory = [];

  pdfInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if(!file) return;

    if(file.type !== "application/pdf"){
      showToast("error","Please upload a valid PDF.");
      return;
    }
    currentPdfName = file.name;
    showToast("success", `PDF loaded: ${file.name}`);
    renderChat();
  });

  function pushMsg(role, text){
    chatHistory.push({ role, text, at: Date.now() });
    renderChat();
  }

  function renderChat(){
    chatArea.innerHTML = "";
    if(!currentPdfName){
      chatArea.innerHTML = `<div class="placeholder">Upload a PDF and ask a question.</div>`;
      return;
    }
    if(!chatHistory.length){
      chatArea.innerHTML = `<div class="placeholder">PDF ready: ${currentPdfName}. Ask your first question.</div>`;
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

    // UI-only fallback:
    pushMsg("bot", "UI ready. Connect /api/rag/chat to answer with RAG.");

    // OPTIONAL: If your backend is ready, uncomment:
    /*
    try{
      const res = await fetch(`${API_BASE}/api/rag/chat`, {
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ question: q, pdfName: currentPdfName })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.message || "RAG chat failed");
      pushMsg("bot", data.answer || "No answer returned");
    }catch(err){
      pushMsg("bot", `Error: ${err.message}`);
    }
    */
  });

  clearChatBtn?.addEventListener("click", () => {
    chatHistory = [];
    renderChat();
    showToast("success","Chat cleared.");
  });

  // ======= INIT =======
  lucide?.createIcons();
  refreshThemeIcon();
  renderSessions();
  setView("analysis");
})();
