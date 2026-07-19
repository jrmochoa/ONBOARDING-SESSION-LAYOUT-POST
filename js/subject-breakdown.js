/* ================= SUBJECT BREAKDOWN PAGE =================
   How many onboarding sessions exist per subject, per grade level, and
   exactly which sections/weeks/days they land on. Nothing here is
   hand-typed from a snapshot — this rebuilds itself from js/data.js's
   SCHEDULE on every load, same principle as session-breakdown.js.
   Cancelled entries are tallied separately (not counted toward the
   subject's active total) since they were rescheduled elsewhere and
   already show up there under their real subject/section. */

// Groups SCHEDULE into { grade: { subject: { active: [...], cancelled: [...] } } }
// where each entry is { grade, section, week, day, date, time, sessionNum, status }.
function buildSubjectBreakdown(){
  const grades = {};
  Object.entries(SCHEDULE).forEach(([week, rows])=>{
    rows.forEach(([time, day, grade, act, num, status])=>{
      const m = act.match(/^(.*)\s\((.+)\)$/);
      const section = m ? m[1] : act;
      const subject = m ? m[2] : act;
      if(!grades[grade]) grades[grade] = {};
      if(!grades[grade][subject]) grades[grade][subject] = { active: [], cancelled: [] };
      const entry = {
        grade, section, week: Number(week), day,
        date: DAY_DATES[week][day], time,
        sessionNum: num, status: status === "DONE" ? "done" : "upcoming",
      };
      if(num === "CANCELLED") grades[grade][subject].cancelled.push(entry);
      else grades[grade][subject].active.push(entry);
    });
  });
  return grades;
}

// Merges every grade's per-subject entries into one { subject: { active, cancelled } }
// map — G7 + G9 combined, used by the "Combined" tab so subject totals can be
// checked across the whole onboarding schedule at once, not just per grade.
function buildCombinedSubjects(){
  const grades = buildSubjectBreakdown();
  const combined = {};
  Object.values(grades).forEach(subjects=>{
    Object.entries(subjects).forEach(([subject, data])=>{
      if(!combined[subject]) combined[subject] = { active: [], cancelled: [] };
      combined[subject].active.push(...data.active);
      combined[subject].cancelled.push(...data.cancelled);
    });
  });
  return combined;
}

function gradeLabel(grade){
  return "Grade " + grade.replace("G", "");
}

const gradeSeg = document.getElementById("gradeSeg");
const subjectsEl = document.getElementById("subjects");

let sbState = { grade: "all" };

function statusPill(entry){
  if(entry.status === "done") return `<span class="status-pill done">DONE</span>`;
  return `<span class="status-pill upcoming">UPCOMING</span>`;
}

function subjectCard(subject, data, showGrade){
  const { active, cancelled } = data;
  const sorted = [...active].sort((a,b)=>
    (showGrade && a.grade !== b.grade ? a.grade.localeCompare(b.grade) : 0)
    || a.week - b.week || DAYS.indexOf(a.day) - DAYS.indexOf(b.day));

  const rows = sorted.map(e=>`
    <tr class="${e.status==='done' ? 'status-done' : ''}">
      <td><span class="session-num-badge">${e.sessionNum}</span></td>
      ${showGrade ? `<td class="grade-cell">${gradeLabel(e.grade)}</td>` : ""}
      <td class="section-cell">${e.section}</td>
      <td class="day-cell">${e.date} &middot; ${e.day}</td>
      <td class="day-cell">${e.time}</td>
      <td>${statusPill(e)}</td>
    </tr>
  `).join("");

  const cancelledNote = cancelled.length
    ? `<div class="cancelled-note">+ ${cancelled.length} cancelled (rescheduled elsewhere, not counted below): ${cancelled.map(e=>`${showGrade ? gradeLabel(e.grade)+" " : ""}${e.section} Wk${e.week} ${e.day}`).join(", ")}</div>`
    : "";

  return `
    <div class="subject-card">
      <div class="card-head">
        <h2>${subject}</h2>
        <span class="count-badge">${active.length} session${active.length===1?"":"s"}</span>
      </div>
      <table>
        <thead><tr><th>#</th>${showGrade ? "<th>Grade</th>" : ""}<th>Section</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      ${cancelledNote}
    </div>
  `;
}

function subjectSection(heading, subjects, showGrade){
  const subjectNames = Object.keys(subjects).sort((a,b)=>{
    const diff = subjects[b].active.length - subjects[a].active.length;
    return diff !== 0 ? diff : a.localeCompare(b);
  });
  const total = subjectNames.reduce((sum,s)=>sum + subjects[s].active.length, 0);
  const cards = subjectNames.map(subject=>subjectCard(subject, subjects[subject], showGrade)).join("");
  return `<div class="grade-heading">${heading} <span class="grade-total">${total} session${total===1?"":"s"} total</span></div>${cards}`;
}

function renderSubjects(){
  if(sbState.grade === "combined"){
    subjectsEl.innerHTML = subjectSection("G7 + G9 COMBINED", buildCombinedSubjects(), true);
    return;
  }

  const grades = buildSubjectBreakdown();
  const gradeList = Object.keys(grades).sort();
  const showGrades = sbState.grade === "all" ? gradeList : [sbState.grade];

  subjectsEl.innerHTML = showGrades
    .map(grade=>subjectSection(gradeLabel(grade).toUpperCase(), grades[grade], false))
    .join("");
}

function buildGradeTabs(){
  const grades = Object.keys(buildSubjectBreakdown()).sort();
  gradeSeg.innerHTML = "";
  const options = ["all", ...grades, "combined"];
  options.forEach(grade=>{
    const b = document.createElement("button");
    b.textContent = grade === "all" ? "All Grades" : grade === "combined" ? "G7 + G9 Combined" : gradeLabel(grade);
    if(grade === sbState.grade) b.classList.add("active");
    b.onclick = ()=>{
      sbState.grade = grade;
      gradeSeg.querySelectorAll("button").forEach(x=>x.classList.remove("active"));
      b.classList.add("active");
      renderSubjects();
    };
    gradeSeg.appendChild(b);
  });
}

/* ================= INITIAL CALLS ================= */
buildGradeTabs();
renderSubjects();
initThemeToggle("themeToggle", renderSubjects);
