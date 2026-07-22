/* ================= AUTO-SELECT INITIAL WEEK/DAY =================
   Opening the tool should land on whatever's actually relevant right now,
   not always Week 1 Tuesday: today's day if it still has a session in
   progress or upcoming, otherwise the NEXT day (possibly next week) that
   has any active session at all — skipping empty gap days (e.g. a
   Wednesday with nothing scheduled) and fully-cancelled entries. Mode
   defaults to "day" (Per day) since a single day's card is the natural
   view for "here's today's/next schedule." Falls back to Week 1 Tuesday
   if SCHEDULE is ever completely empty. */
function timeEndKey(t){
  let end = t.split(" - ")[1].trim();
  let [h,m] = end.split(":").map(Number);
  if(h < 6) h += 12;
  return h*60+m;
}
function computeInitialWeekDay(){
  const candidates = [];
  Object.keys(SCHEDULE).map(Number).sort((a,b)=>a-b).forEach(week=>{
    DAYS.forEach(day=>{
      const entries = SCHEDULE[week].filter(e=>e[1]===day && e[4]!=="CANCELLED");
      if(entries.length) candidates.push({ week, day, entries });
    });
  });
  if(!candidates.length) return { week: 1, day: "Tuesday" };

  const now = new Date();
  const pad = n => String(n).padStart(2,"0");
  const todayISO = now.getFullYear() + "-" + pad(now.getMonth()+1) + "-" + pad(now.getDate());
  const nowMinutes = now.getHours()*60 + now.getMinutes();
  const months = {January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12};
  function isoOf(week, day){
    const [monthName, dayNum] = DAY_DATES[week][day].split(" ");
    return now.getFullYear() + "-" + pad(months[monthName]) + "-" + pad(Number(dayNum));
  }

  for(const c of candidates){
    const dateISO = isoOf(c.week, c.day);
    if(dateISO < todayISO) continue; // fully in the past
    if(dateISO > todayISO) return c; // first future day with a schedule
    const lastEnd = Math.max(...c.entries.map(e=>timeEndKey(e[0])));
    if(nowMinutes < lastEnd) return c; // today, still in progress/upcoming
    // today, but every session already ended — keep looking
  }
  return candidates[candidates.length - 1]; // past everything scheduled
}

/* ================= STATE ================= */
const initialWeekDay = computeInitialWeekDay();
let state = { week: initialWeekDay.week, mode: "day", day: initialWeekDay.day, grade: "all" };

/* ================= UI BUILD ================= */
const weekSeg = document.getElementById("weekSeg");
[1,2,3,4].forEach(w=>{
  const b = document.createElement("button");
  b.textContent = "Week " + w;
  b.dataset.week = w;
  if(w===state.week) b.classList.add("active");
  b.onclick = ()=>{ state.week=w; syncActive(weekSeg,b); render(); };
  weekSeg.appendChild(b);
});

const modeSeg = document.getElementById("modeSeg");
modeSeg.querySelectorAll("button").forEach(b=>{
  b.onclick = ()=>{ state.mode=b.dataset.mode; syncActive(modeSeg,b); updateDaySegVisibility(); updateDownloadAllLabel(); render(); };
});
// index.html's markup hardcodes "Week grid" as the visually active mode
// button — flip it to match state.mode here instead of there, since the
// default above may now be "day".
{
  const initialModeBtn = Array.from(modeSeg.querySelectorAll("button")).find(b=>b.dataset.mode===state.mode);
  if(initialModeBtn) syncActive(modeSeg, initialModeBtn);
}

const daySeg = document.getElementById("daySeg");
DAYS.forEach(d=>{
  const b = document.createElement("button");
  b.textContent = DAY_ABBR[d];
  b.dataset.day = d;
  if(d===state.day) b.classList.add("active");
  b.onclick = ()=>{ state.day=d; syncActive(daySeg,b); render(); };
  daySeg.appendChild(b);
});

const gradeSeg = document.getElementById("gradeSeg");
gradeSeg.querySelectorAll("button").forEach(b=>{
  b.onclick = ()=>{ state.grade=b.dataset.grade; syncActive(gradeSeg,b); render(); };
});

function syncActive(container, activeBtn){
  container.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
  activeBtn.classList.add("active");
}
function updateDaySegVisibility(){
  daySeg.style.display = state.mode === "day" ? "inline-flex" : "none";
}

/* ================= RENDER WIRING ================= */
const capture = document.getElementById("capture");
const exportCapture = document.getElementById("exportCapture");

function render(){
  const html = state.mode === "week" ? renderWeek(state.week) : renderDay(state.week, state.day);
  capture.innerHTML = html;
  exportCapture.innerHTML = html;
}

/* ================= INITIAL CALLS ================= */
updateDaySegVisibility();
render();
updateDownloadAllLabel();
