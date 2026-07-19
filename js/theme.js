/* ================= THEME TOGGLE =================
   Shared by class-program.html and teacher-schedule.html. Dark ("Ops
   Dashboard") is the default; light is opt-in and remembered via
   localStorage. Applying the theme is just flipping a data-theme attribute
   on <html> — see the [data-theme="light"] overrides at the top of each
   page's CSS file — but neon accent colors (subject/grade chips) don't
   have enough contrast on white, so pages that use them must also swap
   their own color map based on getTheme(); this file only owns the toggle
   mechanics, not those maps. */
const THEME_KEY = "ace-schedule-theme";

function getTheme(){
  return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
}
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
}
function setTheme(theme){
  applyTheme(theme);
  localStorage.setItem(THEME_KEY, theme);
}

// Wires up a toggle button: shows what you'd switch TO, applies the stored
// theme immediately (in case the inline <head> script somehow didn't run),
// and calls onChange after every switch so the page can re-render anything
// that reads getTheme() itself (chip colors, etc).
function initThemeToggle(buttonId, onChange){
  const btn = document.getElementById(buttonId);
  const label = t => t === "light" ? "🌙 Dark" : "☀️ Light";
  applyTheme(getTheme());
  btn.textContent = label(getTheme());
  btn.onclick = () => {
    const next = getTheme() === "light" ? "dark" : "light";
    setTheme(next);
    btn.textContent = label(next);
    if(onChange) onChange();
  };
}
