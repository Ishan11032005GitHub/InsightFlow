(function(){
  const html = document.documentElement;
  const toggle = document.getElementById("themeToggle");

  const saved = localStorage.getItem("theme") || "dark";
  html.setAttribute("data-theme", saved);

  function refreshIcon(){
    if(!toggle) return;
    toggle.innerHTML = savedTheme() === "dark"
      ? '<i data-lucide="moon"></i>'
      : '<i data-lucide="sun"></i>';
    lucide?.createIcons();
  }

  function savedTheme(){
    return html.getAttribute("data-theme") || "dark";
  }

  toggle?.addEventListener("click", () => {
    const next = savedTheme() === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    refreshIcon();
  });

  // If already logged in, redirect straight to dashboard
  const token = localStorage.getItem("token");
  if(token){
    const btn = document.getElementById("signInBtn");
    if(btn) btn.href = "dashboard.html";
  }

  lucide?.createIcons();
  refreshIcon();
})();
