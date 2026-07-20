/* ================= THEME TOGGLE =================
   Shared by class-program.html and teacher-schedule.html. Dark ("Ops
   Dashboard") is the default; light is opt-in and remembered via
   localStorage. Applying the theme is just flipping a data-theme attribute
   on <html> — see the [data-theme="light"] overrides at the top of each
   page's CSS file — but neon accent colors (subject/grade chips) don't
   have enough contrast on white, so pages that use them must also swap
   their own color map based on getTheme(); this file only owns the toggle
   mechanics, not those maps.

   Exception: when the page is loaded inside an iframe (e.g. embedded in a
   Moodle HTML block — see iframe-class-program.html), the *default* (only
   when nothing's been explicitly chosen yet) flips to light instead of
   dark, since a dark Ops Dashboard panel dropped into a plain white LMS
   page reads as visually broken rather than intentional. An explicit
   stored choice (the user clicked the toggle) always wins regardless of
   iframe context — this only changes the untouched default. */
const THEME_KEY = "ace-schedule-theme";

function inIframe(){
  try { return window.self !== window.top; }
  catch(e){ return true; }
}
function defaultTheme(){
  return inIframe() ? "light" : "dark";
}
function getTheme(){
  const stored = localStorage.getItem(THEME_KEY);
  return (stored === "light" || stored === "dark") ? stored : defaultTheme();
}
function applyTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
}
function setTheme(theme){
  applyTheme(theme);
  localStorage.setItem(THEME_KEY, theme);
}

// Cross-origin iframes (this site is on GitHub Pages, embedded into a
// Moodle domain — see iframe-class-program.html) can't be auto-sized from
// the parent side: reading contentWindow.document.body.scrollHeight across
// origins is blocked by the same-origin policy. The fix is a postMessage
// handshake — this page reports its real content height on every change,
// and the parent-side listener script (in iframe-class-program.html)
// resizes the <iframe> to match, eliminating the double-scrollbar look of
// a fixed-height iframe. No-ops outside an iframe. Call this after any
// render that could change page height (initial render, theme toggle,
// periodic re-render, window resize) — it's cheap, safe to call often.
function reportIframeHeight(){
  if(!inIframe()) return;
  const height = document.documentElement.scrollHeight;
  window.parent.postMessage({ source: "ace-schedule-iframe", height: height }, "*");
}
window.addEventListener("resize", reportIframeHeight);

// A one-shot report right after each render isn't enough on its own: Google
// Fonts (Space Grotesk/JetBrains Mono/Inter) load asynchronously and swap
// in after the initial paint, growing the page's real height (different
// line-height/metrics than the fallback font) *after* that report already
// fired — the parent never finds out, so the iframe stays sized to the
// pre-swap height and shows an internal scrollbar. ResizeObserver catches
// this (and any other reflow — images, anything) without having to predict
// every cause by hand; document.fonts.ready is kept alongside it as a
// belt-and-suspenders fallback for engines without ResizeObserver.
if(inIframe()){
  if(typeof ResizeObserver !== "undefined"){
    new ResizeObserver(reportIframeHeight).observe(document.documentElement);
  }
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(reportIframeHeight);
  }
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
