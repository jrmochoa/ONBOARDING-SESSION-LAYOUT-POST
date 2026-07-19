/* ================= STATE ================= */
let state = { week: 1, mode: "week", day: "Tuesday", grade: "all" };

/* ================= UI BUILD ================= */
const weekSeg = document.getElementById("weekSeg");
[1,2,3,4].forEach(w=>{
  const b = document.createElement("button");
  b.textContent = "Week " + w;
  b.dataset.week = w;
  if(w===1) b.classList.add("active");
  b.onclick = ()=>{ state.week=w; syncActive(weekSeg,b); render(); };
  weekSeg.appendChild(b);
});

const modeSeg = document.getElementById("modeSeg");
modeSeg.querySelectorAll("button").forEach(b=>{
  b.onclick = ()=>{ state.mode=b.dataset.mode; syncActive(modeSeg,b); updateDaySegVisibility(); updateDownloadAllLabel(); render(); };
});

const daySeg = document.getElementById("daySeg");
DAYS.forEach(d=>{
  const b = document.createElement("button");
  b.textContent = DAY_ABBR[d];
  b.dataset.day = d;
  if(d==="Tuesday") b.classList.add("active");
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
