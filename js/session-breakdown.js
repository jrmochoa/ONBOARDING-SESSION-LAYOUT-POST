/* ================= SESSION BREAKDOWN PAGE =================
   Every section always has exactly 5 sessions: a shared online kickoff
   (Session 1, same date/time for every section within a grade — held
   before the tracked in-person schedule even starts) plus 4 in-person
   sessions (2-5) pulled straight from SCHEDULE. Nothing here is hand-typed
   from a snapshot — this rebuilds itself from js/data.js's SCHEDULE on
   every load, so editing the schedule there is the only thing that needs
   to change for this page to stay correct. */

// Fixed historical fact, not derived from SCHEDULE: both grades' Session 1
// was a single online orientation on June 29, before Week 1 began — Grade 7
// and Grade 9 ran at different times that same day.
const ONLINE_SESSION = {
  G7: { time: "8:00 - 9:00 AM" },
  G9: { time: "10:00 - 11:00 AM" },
};
const ONLINE_DATE = "June 29";

// Groups SCHEDULE into { grade: { section: [ {sessionNum, week, day, date,
// time, subject, status}, ... ] } }, sorted 2->5, with the shared online
// Session 1 prepended to every section. Cancelled entries hold no session
// number (see CLAUDE.md's numbering rule) and aren't "one of the 5" — they
// were rescheduled elsewhere and appear there under their real number
// instead, so they're skipped here.
function buildBreakdown(){
  const grades = {};
  Object.entries(SCHEDULE).forEach(([week, rows])=>{
    rows.forEach(([time, day, grade, act, num, status])=>{
      if(num === "CANCELLED") return;
      const m = act.match(/^(.*)\s\((.+)\)$/);
      const section = m ? m[1] : act;
      const subject = m ? m[2] : "";
      if(!grades[grade]) grades[grade] = {};
      if(!grades[grade][section]) grades[grade][section] = [];
      grades[grade][section].push({
        sessionNum: num, week: Number(week), day,
        date: DAY_DATES[week][day], time, subject,
        status: status === "DONE" ? "done" : "upcoming",
      });
    });
  });

  Object.entries(grades).forEach(([grade, sections])=>{
    Object.values(sections).forEach(sessions=>{
      sessions.sort((a,b)=>a.sessionNum-b.sessionNum);
      sessions.unshift({
        sessionNum: 1, week: null, day: "Online", date: ONLINE_DATE,
        time: ONLINE_SESSION[grade].time, subject: "Orientation",
        status: "online",
      });
    });
  });

  return grades;
}

function gradeLabel(grade){
  return "Grade " + grade.replace("G", "");
}

const gradeSeg = document.getElementById("gradeSeg");
const sectionsEl = document.getElementById("sections");

let cbState = { grade: "all" };

function statusPill(session){
  if(session.status === "online") return `<span class="status-pill online">ONLINE</span>`;
  if(session.status === "done") return `<span class="status-pill done">DONE</span>`;
  return `<span class="status-pill upcoming">UPCOMING</span>`;
}

function sectionCard(grade, section, sessions){
  const doneCount = sessions.filter(s=>s.status==="done"||s.status==="online").length;
  const rows = sessions.map(s=>`
    <tr class="${s.status==='online' ? 'online' : ''}${s.status==='done' ? ' status-done' : ''}">
      <td><span class="session-num-badge">${s.sessionNum}</span></td>
      <td class="day-cell">${s.date}${s.week ? ` &middot; ${s.day}` : ""}</td>
      <td class="day-cell">${s.time}</td>
      <td><span class="subject-chip">${s.subject}</span></td>
      <td>${statusPill(s)}</td>
    </tr>
  `).join("");

  return `
    <div class="section-card">
      <div class="card-head">
        <h2>${gradeLabel(grade)} — ${section}</h2>
        <span class="completeness">${doneCount}/5 held</span>
      </div>
      <table>
        <thead><tr><th>#</th><th>Date</th><th>Time</th><th>Subject</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderSections(){
  const grades = buildBreakdown();
  const gradeList = Object.keys(grades).sort();
  const showGrades = cbState.grade === "all" ? gradeList : [cbState.grade];

  sectionsEl.innerHTML = showGrades.map(grade=>{
    const sectionNames = Object.keys(grades[grade]).sort();
    const cards = sectionNames.map(section=>sectionCard(grade, section, grades[grade][section])).join("");
    return `<div class="grade-heading">${gradeLabel(grade).toUpperCase()}</div>${cards}`;
  }).join("");
}

function buildGradeTabs(){
  const grades = Object.keys(buildBreakdown()).sort();
  gradeSeg.innerHTML = "";
  const options = ["all", ...grades];
  options.forEach(grade=>{
    const b = document.createElement("button");
    b.textContent = grade === "all" ? "All Grades" : gradeLabel(grade);
    if(grade === cbState.grade) b.classList.add("active");
    b.onclick = ()=>{
      cbState.grade = grade;
      gradeSeg.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      renderSections();
    };
    gradeSeg.appendChild(b);
  });
}

/* ================= INITIAL CALLS ================= */
buildGradeTabs();
renderSections();
initThemeToggle("themeToggle", renderSections);
