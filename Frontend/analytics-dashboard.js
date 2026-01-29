

const API_BASE = localStorage.getItem('apiBase') || 'http://localhost:6001';
const TOKEN = localStorage.getItem('token');
let currentSession = null;
let currentDocument = null;


document.addEventListener('DOMContentLoaded', () => {
  if (!TOKEN) {
    window.location.href = 'auth.html';
    return;
  }

  initializeEventListeners();
  loadSessions();
  applyTheme();
});

function initializeEventListeners() {
  
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.style.background = 'rgba(37, 99, 235, 0.15)';
  });
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.style.background = 'rgba(37, 99, 235, 0.05)';
  });
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.style.background = 'rgba(37, 99, 235, 0.05)';
    handleFileUpload(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) handleFileUpload(e.target.files[0]);
  });

  
  document.getElementById('newSessionBtn').addEventListener('click', () => {
    document.getElementById('newSessionModal').classList.add('active');
  });

  document.getElementById('createSessionBtn').addEventListener('click', createNewSession);
  document.getElementById('cancelSessionBtn').addEventListener('click', () => {
    document.getElementById('newSessionModal').classList.remove('active');
  });

  
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('logoutBtn').addEventListener('click', logout);
}

function switchTab(tabName) {
  
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
}

async function handleFileUpload(file) {
  if (!file) return;

  if (!currentSession) {
    showAlert('Please create a session first', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('sessionId', currentSession.id);

  try {
    showAlert('Uploading and analyzing file...', 'info');
    const response = await fetch(`${API_BASE}/api/analytics/upload?sessionId=${currentSession.id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}` },
      body: formData
    });

    if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);

    const data = await response.json();
    currentDocument = data.document;

    
    document.getElementById('fileInput').value = '';

    
    addMessage('assistant', data.initialAnalysis);

    
    await loadDocuments();
    showAnalysisOptions();

    showAlert(`File uploaded: ${file.name}`, 'success');
  } catch (error) {
    console.error('Upload error:', error);
    showAlert(`Upload failed: ${error.message}`, 'error');
  }
}

async function loadDocuments() {
  if (!currentSession) return;

  try {
    const response = await fetch(`${API_BASE}/api/analytics/sessions/${currentSession.id}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (!response.ok) throw new Error('Failed to load documents');

    const data = await response.json();
    const documentsList = document.getElementById('documentsList');
    documentsList.innerHTML = '';

    if (data.documents.length > 0) {
      document.getElementById('documentsCard').style.display = 'block';

      data.documents.forEach(doc => {
        const html = `
          <div class="document-card">
            <div class="document-name">📄 ${doc.filename}</div>
            <div class="document-meta">Type: ${doc.fileType}</div>
            <div class="document-meta">Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}</div>
            <div class="document-actions">
              <button onclick="analyzeDocument('${doc.id}', '${doc.fileType}')">Analyze</button>
              <button onclick="downloadDocument('${doc.id}')">Download</button>
            </div>
          </div>
        `;
        documentsList.innerHTML += html;
      });
    }
  } catch (error) {
    console.error('Load documents error:', error);
  }
}

function showAnalysisOptions() {
  document.getElementById('analysisCard').style.display = 'block';
  const analysisOptions = document.getElementById('analysisOptions');
  
  const options = [
    { type: 'summary', label: '📊 Summary', description: 'Statistical summary' },
    { type: 'trends', label: '📈 Trends', description: 'Trend analysis' },
    { type: 'correlation', label: '🔗 Correlation', description: 'Find relationships' },
    { type: 'anomalies', label: '⚠️ Anomalies', description: 'Detect outliers' },
    { type: 'grouped', label: '🎯 Grouped', description: 'Group & aggregate' }
  ];

  analysisOptions.innerHTML = options.map(opt => `
    <button class="analysis-btn" onclick="runAnalysis('${opt.type}')">
      <div>${opt.label}</div>
      <div style="font-size: 12px; opacity: 0.7;">${opt.description}</div>
    </button>
  `).join('');
}

async function runAnalysis(analysisType) {
  if (!currentDocument) {
    showAlert('No document selected', 'error');
    return;
  }

  try {
    showAlert(`Running ${analysisType} analysis...`, 'info');

    const response = await fetch(`${API_BASE}/api/analytics/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId: currentDocument.id,
        sessionId: currentSession.id,
        analysisType: analysisType,
        columns: currentDocument.metadata?.headers || []
      })
    });

    if (!response.ok) throw new Error('Analysis failed');

    const result = await response.json();

    
    addMessage('assistant', `**${analysisType.toUpperCase()} Analysis**\n\n${result.aiInsights.summary}`);

    
    displayAnalysisResults(result);

    showAlert('Analysis complete', 'success');
  } catch (error) {
    console.error('Analysis error:', error);
    showAlert(`Analysis failed: ${error.message}`, 'error');
  }
}

function displayAnalysisResults(result) {
  const resultsList = document.getElementById('resultsList');
  const noResults = document.getElementById('noResults');
  
  noResults.style.display = 'none';

  const html = `
    <div class="result-card">
      <h4>${result.analysisType.toUpperCase()}</h4>
      <p>${result.aiInsights.summary}</p>
      <pre>${JSON.stringify(result.result, null, 2)}</pre>
      <button class="btn btn-primary" style="margin-top: 12px;" onclick="exportResult(this)">Download</button>
    </div>
  `;

  resultsList.innerHTML += html;

  // Switch to results tab
  switchTab('results');
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const message = input.value.trim();

  if (!message) return;
  if (!currentSession) {
    showAlert('Create a session first', 'error');
    return;
  }

  // Add user message
  addMessage('user', message);
  input.value = '';

  try {
    const response = await fetch(`${API_BASE}/api/analytics/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: currentSession.id,
        message: message,
        documentId: currentDocument?.id
      })
    });

    if (!response.ok) throw new Error('Message failed');

    const data = await response.json();
    addMessage('assistant', data.assistantResponse);
  } catch (error) {
    console.error('Message error:', error);
    addMessage('assistant', `Error: ${error.message}`);
  }
}

function addMessage(role, content) {
  const messagesDiv = document.getElementById('chatMessages');
  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;
  messageEl.innerHTML = content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  messagesDiv.appendChild(messageEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function loadSessions() {
  try {
    const response = await fetch(`${API_BASE}/api/analytics/sessions`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (!response.ok) throw new Error('Failed to load sessions');

    const data = await response.json();
    const sessionsList = document.getElementById('sessionsList');
    sessionsList.innerHTML = '';

    if (data.sessions.length === 0) {
      sessionsList.innerHTML = '<p style="color: var(--secondary); font-size: 14px;">No sessions yet</p>';
      return;
    }

    data.sessions.forEach(session => {
      const html = `
        <div class="session-item" onclick="selectSession('${session.id}', '${session.title}')">
          <div class="session-item-title">${session.title}</div>
          <div class="session-item-meta">${session.mode} • ${new Date(session.createdAt).toLocaleDateString()}</div>
        </div>
      `;
      sessionsList.innerHTML += html;
    });
  } catch (error) {
    console.error('Load sessions error:', error);
  }
}

function selectSession(sessionId, title) {
  currentSession = { id: sessionId, title };
  currentDocument = null;
  document.getElementById('chatMessages').innerHTML = '';
  document.getElementById('documentsList').innerHTML = '';
  document.getElementById('analysisCard').style.display = 'none';
  document.getElementById('documentsCard').style.display = 'none';
  
  loadDocuments();
  showAlert(`Session: ${title}`, 'success');
}

async function createNewSession() {
  const title = document.getElementById('sessionTitle').value.trim();
  const mode = document.getElementById('sessionMode').value;
  const description = document.getElementById('sessionDescription').value.trim();

  if (!title) {
    showAlert('Session title is required', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/analytics/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, mode, description })
    });

    if (!response.ok) throw new Error('Failed to create session');

    const data = await response.json();
    currentSession = data.session;

    // Clear form
    document.getElementById('sessionTitle').value = '';
    document.getElementById('sessionDescription').value = '';
    document.getElementById('sessionMode').value = 'data_analysis';
    document.getElementById('newSessionModal').classList.remove('active');

    // Reload sessions
    await loadSessions();
    showAlert(`Session created: ${title}`, 'success');
  } catch (error) {
    console.error('Create session error:', error);
    showAlert(`Failed: ${error.message}`, 'error');
  }
}

function analyzeDocument(documentId, fileType) {
  currentDocument = { id: documentId, fileType };
  showAnalysisOptions();
  showAlert('Select an analysis type', 'info');
}

async function downloadDocument(documentId) {
  try {
    showAlert('Downloading...', 'info');
    // Implementation depends on backend support
    showAlert('Download started', 'success');
  } catch (error) {
    showAlert(`Download failed: ${error.message}`, 'error');
  }
}

function exportResult(btn) {
  const card = btn.closest('.result-card');
  const text = card.innerText;
  
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analysis-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function showAlert(message, type = 'info') {
  const container = document.getElementById('alertContainer');
  const alert = document.createElement('div');
  alert.className = `alert ${type}`;
  alert.innerHTML = `<span>${message}</span>`;
  
  container.appendChild(alert);
  
  if (type !== 'error') {
    setTimeout(() => alert.remove(), 3000);
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
}

function applyTheme() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    document.getElementById('themeToggle').textContent = '☀️';
  }
}

function logout() {
  localStorage.clear();
  window.location.href = 'auth.html';
}
