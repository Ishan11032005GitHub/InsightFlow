document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const toggle = document.getElementById("themeToggle");
  let dark = true;

  toggle?.addEventListener("click", () => {
    dark = !dark;
    document.body.style.filter = dark ? "none" : "invert(1) hue-rotate(180deg)";
  });
});
