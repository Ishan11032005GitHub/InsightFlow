(async function(){
  const html = document.documentElement;
  const toggle = document.getElementById("themeToggle");

  const tabs = document.querySelectorAll(".tab");
  const panes = document.querySelectorAll(".tabpane");
  const msg = document.getElementById("authMsg");

  const signinForm = document.getElementById("signinForm");
  const signupForm = document.getElementById("signupForm");

 
  let API_BASE = null;

  async function detectApiBase() {
    
      const start = 6001;
    const end = 6011;
    for (let p = start; p <= end; p++) {
      const url = `http://localhost:${p}/api/config`;
      try {
        
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!res.ok) continue;
        const data = await res.json().catch(() => null);
        if (data && data.apiBase) return data.apiBase;
        return `http://localhost:${p}`;
      } catch (err) {
        
        continue;
      }
    }
    
      return 'http://localhost:6001';
  }

  API_BASE = await detectApiBase();
  console.info('Detected API_BASE ->', API_BASE);

  
  try {
    const badge = document.createElement('div');
    badge.id = 'api-base-badge';
    badge.style.position = 'fixed';
    badge.style.right = '12px';
    badge.style.bottom = '12px';
    badge.style.background = 'rgba(0,0,0,0.6)';
    badge.style.color = '#fff';
    badge.style.padding = '6px 10px';
    badge.style.borderRadius = '6px';
    badge.style.zIndex = 9999;
    badge.style.fontSize = '12px';
    badge.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
    badge.innerText = `API: ${API_BASE}`;
    document.body.appendChild(badge);
  } catch (e) { /* ignore if DOM not ready */ }

  
  const saved = localStorage.getItem("theme") || "dark";
  html.setAttribute("data-theme", saved);

  function refreshIcon(){
    toggle.innerHTML = html.getAttribute("data-theme") === "dark"
      ? '<i data-lucide="moon"></i>'
      : '<i data-lucide="sun"></i>';
    lucide?.createIcons();
  }
  toggle?.addEventListener("click", () => {
    const next = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    refreshIcon();
  });

  
  tabs.forEach(t => {
    t.addEventListener("click", () => {
      tabs.forEach(x => x.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));
      t.classList.add("active");
      document.querySelector(`[data-pane="${t.dataset.tab}"]`)?.classList.add("active");
      hideMsg();
    });
  });

  function showMsg(type, text){
    msg.classList.remove("hidden","validation-error","validation-success");
    msg.classList.add(type === "error" ? "validation-error":"validation-success");
    msg.innerHTML = `<i data-lucide="${type==="error"?"alert-circle":"check-circle"}"></i><span>${text}</span>`;
    lucide?.createIcons();
  }
  function hideMsg(){
    msg.classList.add("hidden");
  }

 
  if(localStorage.getItem("token")){
    window.location.href = "dashboard.html";
    return;
  }

  
  signinForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg();

    const email = document.getElementById("signinEmail").value.trim();
    const password = document.getElementById("signinPassword").value;

    if(!email || password.length < 6){
      showMsg("error","Enter valid email and password (min 6).");
      return;
    }

    try{
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(()=> ({}));
      if(!res.ok) throw new Error(data.message || "Login failed");

      
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user || { email }));

      showMsg("success","Signed in. Redirecting...");
      setTimeout(()=> window.location.href="dashboard.html", 600);
    }catch(err){
      showMsg("error", err.message);
    }
  });

  
  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideMsg();

    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;

    if(!username || !email || password.length < 6){
      showMsg("error","Fill all fields. Password min 6.");
      return;
    }

    try{
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json().catch(()=> ({}));
      if(!res.ok) throw new Error(data.message || "Signup failed");

      
      if(data.token){
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user || { name: username, email }));
        showMsg("success","Account created. Redirecting...");
        setTimeout(()=> window.location.href="dashboard.html", 600);
      } else {
        showMsg("success","Account created. Please sign in.");
        document.querySelector('.tab[data-tab="signin"]')?.click();
      }
    }catch(err){
      showMsg("error", err.message);
    }
  });

  lucide?.createIcons();
  refreshIcon();
})();
