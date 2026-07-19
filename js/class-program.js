/* ================= CLASS PROGRAM PAGE ================= */
const cpState = { grade: null, section: null };

// Set by applyDeepLink() from the URL's ?grade=&section=&day=&subject=
// params — when day+subject are present, renderSection() marks the one
// cell matching all four as ".deep-link-cell" (see CSS) so "click Tuesday
// Honesty (AP) on the onboarding schedule" lands here with that exact
// period visibly singled out, not just the section tabs selected. Includes
// grade+section (not just day+subject) so the mark doesn't also light up
// on some *other* section that happens to share the same day/subject if
// the user later switches tabs away from the section this was linked to.
let deepLinkCell = null;
let hasScrolledToDeepLink = false;

const gradeSeg = document.getElementById("gradeSeg");
const sectionSeg = document.getElementById("sectionSeg");
const sectionInfo = document.getElementById("sectionInfo");
const scheduleTable = document.getElementById("scheduleTable");
const missingNote = document.getElementById("missingNote");
const nowClock = document.getElementById("nowClock");

// One accent per subject, for the Ops Dashboard theme's bordered subject
// chips. Keyed by uppercased, parenthetical-stripped subject code (e.g.
// "TLE (FCS/IA/ICT)" -> "TLE") since the source data isn't always exactly
// one of these keys verbatim. Dark-mode uses full neon brightness; light
// mode needs its own darker set — the neon values read fine on near-black
// but fail contrast on white (e.g. #39FF14 on #F4F6FB is nearly invisible).
const SUBJECT_COLOR_DARK = {
  FIL:"#39FF14", MATH:"#FF3860", MAPEH:"#00E5FF", AP:"#FF6EC7", TLE:"#FFD23F",
  CLVE:"#7DF9FF", SCI:"#B967FF", ENG:"#FFA53F", COMP:"#5CE1E6", "HR/L/G":"#5f6b85"
};
const SUBJECT_COLOR_LIGHT = {
  FIL:"#2E7D32", MATH:"#C62828", MAPEH:"#00695C", AP:"#AD1457", TLE:"#B8860B",
  CLVE:"#0277BD", SCI:"#6A1B9A", ENG:"#E65100", COMP:"#00838F", "HR/L/G":"#6B7590"
};
function subjectColor(subject){
  const key = subject.replace(/\s*\(.*\)\s*$/, "").trim().toUpperCase();
  const map = getTheme() === "light" ? SUBJECT_COLOR_LIGHT : SUBJECT_COLOR_DARK;
  return map[key] || (getTheme() === "light" ? "#555F7A" : "#8899b8");
}

// The onboarding schedule's deep links (see render.js's classProgramLink())
// write some subjects as full words ("Filipino", "Science", "English") and
// some already abbreviated ("AP", "CLVE", "MAPEH") — normalize both to the
// same short codes class-program's own subjects already use (see
// subjectColor() above), so a deep-linked ?subject= can be matched against
// this page's cells regardless of which form the onboarding activity used.
const ONBOARDING_SUBJECT_ALIAS = {
  FILIPINO:"FIL", SCIENCE:"SCI", ENGLISH:"ENG", MATHEMATICS:"MATH",
};
function canonicalOnboardingSubject(raw){
  const key = raw.replace(/\s*\(.*\)\s*$/, "").trim().toUpperCase();
  return ONBOARDING_SUBJECT_ALIAS[key] || key;
}

// Same <6-hour-is-PM convention used throughout this project (render.js's
// timeKey(), teacher-schedule.js's parseClock()) — school day runs
// ~6:50am-3:45pm, so any hour below 6 in a period's own time label is
// unambiguously PM. Real wall-clock hours from Date don't need this: they're
// already in 24-hour time.
function parseClock(hm){
  let [h,m] = hm.trim().split(":").map(Number);
  if(h < 6) h += 12;
  return h*60+m;
}
function periodRangeMinutes(range){
  const [start,end] = range.split(" - ");
  return [parseClock(start), parseClock(end)];
}

// Real-world "now" — recomputed on every clock tick / re-render, not cached,
// so the highlight tracks the actual current time.
function nowState(){
  const now = new Date();
  return {
    dayName: now.toLocaleDateString("en-US", { weekday: "long" }),
    minutes: now.getHours()*60 + now.getMinutes(),
    label: now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
      + " — " + now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" }),
  };
}
function isPeriodNow(day, range, now){
  if(day !== now.dayName) return false;
  const [s,e] = periodRangeMinutes(range);
  return now.minutes >= s && now.minutes < e;
}

function updateClock(){
  const now = nowState();
  const inSchoolDay = CLASS_PROGRAM.meta.days.includes(now.dayName);
  nowClock.classList.toggle("no-school", !inSchoolDay);
  nowClock.innerHTML = `<span class="dot"></span>${now.label}${inSchoolDay ? "" : " — no class today"}`;
}

function gradeNames(){
  return CLASS_PROGRAM.meta.grades || Object.keys(CLASS_PROGRAM.sections);
}
function gradeLabel(grade){
  return "Grade " + grade.replace("G", "");
}

function sectionNamesFor(grade){
  return Object.keys(CLASS_PROGRAM.sections[grade]);
}

function buildGradeTabs(){
  gradeSeg.innerHTML = "";
  const grades = gradeNames();
  if(!grades.includes(cpState.grade)) cpState.grade = grades[0];
  grades.forEach(grade=>{
    const b = document.createElement("button");
    b.textContent = gradeLabel(grade);
    if(grade === cpState.grade) b.classList.add("active");
    b.onclick = ()=>{
      cpState.grade = grade;
      cpState.section = null;
      syncActive(gradeSeg,b);
      buildSectionTabs();
      renderSection();
    };
    gradeSeg.appendChild(b);
  });
}

function buildSectionTabs(){
  sectionSeg.innerHTML = "";
  const names = sectionNamesFor(cpState.grade);
  if(!names.includes(cpState.section)) cpState.section = names[0];
  names.forEach(name=>{
    const b = document.createElement("button");
    b.textContent = name;
    if(name === cpState.section) b.classList.add("active");
    b.onclick = ()=>{ cpState.section = name; syncActive(sectionSeg,b); renderSection(); };
    sectionSeg.appendChild(b);
  });
}

function syncActive(container, activeBtn){
  container.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
  activeBtn.classList.add("active");
}

function renderSectionInfo(data){
  sectionInfo.innerHTML = `
    <div class="item"><span>Section</span><b>${gradeLabel(cpState.grade)} - ${cpState.section}</b></div>
    <div class="item"><span>Adviser</span><b>${data.adviser}</b></div>
    <div class="item"><span>Room</span><b>${data.room}</b></div>
    <div class="item"><span>Male</span><b>${data.male}</b></div>
    <div class="item"><span>Female</span><b>${data.female}</b></div>
    <div class="item"><span>Total</span><b>${data.total}</b></div>
  `;
}

// Links a subject cell to its LMS course page (courseLink() from
// course-links.js), when that grade/section/subject has one.
function subjectHtml(grade, section, subject){
  const link = courseLink(grade, section, subject);
  return link
    ? `<a href="${link}" target="_blank" rel="noopener">${subject}</a>`
    : subject;
}

// A co-taught period lists multiple teacher names separated by "/" (e.g.
// "Ms. Jane Dinglasan / Mr. Mark David De Chavez") — link each name
// individually to that teacher's page rather than the whole string at once.
function teacherLinks(teacherStr){
  return teacherStr.split(/\s*\/\s*/).map(name=>{
    name = name.trim();
    return `<a href="teacher-schedule.html?teacher=${encodeURIComponent(name)}">${name}</a>`;
  }).join(" / ");
}

// Merges the fixed common routine (Life Session / Advisory / Physical
// Exercise) with the section's own periods into one time-ordered row list.
function buildRows(data){
  const days = CLASS_PROGRAM.meta.days;
  const rowsByTime = new Map();

  CLASS_PROGRAM.meta.commonRoutine.forEach(r=>{
    rowsByTime.set(r.time, { time: r.time, common: r.label });
  });

  days.forEach(day=>{
    data.schedule[day].forEach(p=>{
      if(!rowsByTime.has(p.time)) rowsByTime.set(p.time, { time: p.time, cells: {} });
      const row = rowsByTime.get(p.time);
      if(!row.cells) row.cells = {};
      row.cells[day] = p;
    });
  });

  return Array.from(rowsByTime.values());
}

function renderSection(){
  const data = CLASS_PROGRAM.sections[cpState.grade][cpState.section];
  renderSectionInfo(data);

  const days = CLASS_PROGRAM.meta.days;
  const rows = buildRows(data);

  const headerCells = days.map(d=>`<th>${d.toUpperCase()}</th>`).join("");

  const now = nowState();

  const bodyRows = rows.map(row=>{
    if(row.common){
      const isNow = days.some(d=>isPeriodNow(d, row.time, now));
      return `<tr class="break-row${isNow ? " current-row" : ""}"><td class="time-col">${row.time}</td><td colspan="${days.length}">${row.common}</td></tr>`;
    }

    // When every day has the same break/lunch label at this time slot (the
    // normal case — a section's break/lunch periods don't vary by day),
    // collapse the 5 identical cells into one spanning cell instead of
    // repeating "Break"/"Lunch" across the whole row.
    const labels = days.map(day=>{
      const p = row.cells[day];
      return p && p.kind === "break" ? p.label : null;
    });
    const uniformLabel = labels.every(l => l !== null && l === labels[0]) ? labels[0] : null;
    if(uniformLabel){
      const isNow = days.some(d=>isPeriodNow(d, row.time, now));
      return `<tr class="break-row${isNow ? " current-row" : ""}"><td class="time-col">${row.time}</td><td colspan="${days.length}">${uniformLabel}</td></tr>`;
    }

    const cells = days.map(day=>{
      const p = row.cells[day];
      const isNow = isPeriodNow(day, row.time, now);
      if(!p) return `<td></td>`;
      if(p.kind === "break"){
        return `<td class="break-row-cell${isNow ? " current" : ""}">${p.label}</td>`;
      }
      const isDeepLinked = deepLinkCell
        && cpState.grade === deepLinkCell.grade && cpState.section === deepLinkCell.section
        && day === deepLinkCell.day
        && canonicalOnboardingSubject(p.subject) === canonicalOnboardingSubject(deepLinkCell.subject);
      const deepLinkClass = isDeepLinked ? " deep-link-cell" : "";
      return `<td class="class-cell${isNow ? " current" : ""}${deepLinkClass}"><span class="subject" style="color:${subjectColor(p.subject)}">${subjectHtml(cpState.grade, cpState.section, p.subject)}</span><span class="teacher">${teacherLinks(p.teacher)}</span></td>`;
    }).join("");
    return `<tr><td class="time-col">${row.time}</td>${cells}</tr>`;
  }).join("");

  scheduleTable.innerHTML = `
    <table>
      <thead><tr><th>TIME</th>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;

  missingNote.textContent = CLASS_PROGRAM.meta.note;

  // Scroll the deep-linked cell into view once, right after the first
  // render — not on every 30s re-render, or the page would keep jumping
  // back to it while someone's trying to look at something else.
  if(deepLinkCell && !hasScrolledToDeepLink){
    const cell = scheduleTable.querySelector(".deep-link-cell");
    if(cell){
      cell.scrollIntoView({ behavior: "smooth", block: "center" });
      hasScrolledToDeepLink = true;
    }
  }
}

// Deep-linked from index.html's onboarding schedule (a session's grade
// badge + activity name) or teacher-schedule.html's "Grade N-Section"
// labels, e.g. class-program.html?grade=G9&section=Honesty&day=Tuesday
// &subject=AP — pre-selects that grade/section (highlighted via the
// existing .seg button.active styling) and, when day+subject are present
// too, marks that exact cell (see renderSection()'s isDeepLinked / CSS's
// .deep-link-cell). Falls back to defaults if params are missing or don't
// match anything real; day/subject are optional on top of grade/section.
function applyDeepLink(){
  const params = new URLSearchParams(window.location.search);
  const grade = params.get("grade");
  const section = params.get("section");
  const day = params.get("day");
  const subject = params.get("subject");
  const gradeValid = grade && gradeNames().includes(grade);
  if(gradeValid) cpState.grade = grade;
  const sectionValid = gradeValid && section && sectionNamesFor(cpState.grade).includes(section);
  if(sectionValid) cpState.section = section;
  // Only mark a specific cell when the grade+section it belongs to is
  // itself valid — a day/subject with no matching real section shouldn't
  // highlight something in whatever section happens to load by default.
  if(gradeValid && sectionValid && day && subject){
    deepLinkCell = { grade: cpState.grade, section: cpState.section, day, subject };
  }
}

/* ================= INITIAL CALLS ================= */
applyDeepLink();
buildGradeTabs();
buildSectionTabs();
renderSection();
updateClock();
initThemeToggle("themeToggle", renderSection);

// Clock ticks every second for a live feel; the table only needs to
// re-render when the *current period* could have changed, so that runs on
// a coarser 30s interval instead of rebuilding the table every tick.
setInterval(updateClock, 1000);
setInterval(renderSection, 30000);
