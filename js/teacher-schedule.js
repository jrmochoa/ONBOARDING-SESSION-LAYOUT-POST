/* ================= TEACHER SCHEDULE PAGE ================= */

// Parses a single "H:MM" clock string to minutes-since-midnight, using the
// same <6-hour-is-PM convention as render.js's timeKey() (school day runs
// ~6:50am-3:45pm, so any hour below 6 is unambiguously PM).
function parseClock(hm){
  let [h,m] = hm.trim().split(":").map(Number);
  if(h < 6) h += 12;
  return h*60+m;
}
function timeKey(range){
  return parseClock(range.split(" - ")[0]);
}
function periodMinutes(range){
  const [start,end] = range.split(" - ");
  return parseClock(end) - parseClock(start);
}

// Distinct color per grade, used both for a booked cell's chip and the
// grade numbers in the SUBJECT header (e.g. "COMPUTER 7 & 8") — mirrors the
// blue/gold grade coloring seen in teacher-sample-record2.jpg. Avoids green
// (reserved for the "● LIVE" badge) and cyan (reserved for UI chrome) in
// both variants. Dark uses full neon brightness; light needs its own
// darker set for contrast on white (mirrors class-program.js's
// SUBJECT_COLOR_DARK/LIGHT split).
const GRADE_COLORS_DARK = { G7: "#3D8BFF", G8: "#2DE1C2", G9: "#FF6EC7", G10: "#B967FF" };
const GRADE_COLORS_LIGHT = { G7: "#1D5FD6", G8: "#00897B", G9: "#C2185B", G10: "#7B1FA2" };

// Flattens CLASS_PROGRAM into one list of bookings, one per (teacher, slot).
// A "TLE (FCS/IA/ICT)"-style co-taught period lists multiple teacher names
// separated by "/" — each gets their own booking entry so every teacher's
// page shows that slot.
function buildBookingIndex(){
  const bookings = [];
  Object.entries(CLASS_PROGRAM.sections).forEach(([grade, sections])=>{
    Object.entries(sections).forEach(([sectionName, data])=>{
      CLASS_PROGRAM.meta.days.forEach(day=>{
        (data.schedule[day] || []).forEach(p=>{
          if(p.kind !== "class") return;
          p.teacher.split(/\s*\/\s*/).forEach(teacher=>{
            teacher = teacher.trim();
            if(!teacher) return;
            bookings.push({ teacher, grade, section: sectionName, day, time: p.time, subject: p.subject });
          });
        });
      });
    });
  });
  return bookings;
}

const bookingIndex = buildBookingIndex();

function uniqueTeachers(){
  return Array.from(new Set(bookingIndex.map(b=>b.teacher))).sort();
}

// Groups subjects by identity rather than exact spelling — the class program
// source data has inconsistent casing across grades (e.g. "MATH" in G7/G8 vs
// "Math" in G9/G10, "SCI"/"Sci", "FIL"/"Fil"), and comparing raw strings let
// a teacher's own periods get miscounted as a different subject purely due
// to casing (surfaced as e.g. "Grade 8-Fortitude - Math" showing up as
// off-subject for a Math teacher). subjectFullName() (course-links.js)
// already normalizes the well-known abbreviations; anything it doesn't
// recognize (HR/L/G, etc.) falls back to a trimmed/uppercased raw string.
function canonicalSubject(subject){
  return subjectFullName(subject) || subject.trim().toUpperCase();
}

// A teacher's "primary" subject is whichever subject (by canonical identity)
// appears most often in their bookings (mirrors both sample records:
// Janelle's page is "English" even though she also covers one HR/L/G
// period; Ylagan's is "Computer"). The subject can span more than one grade
// (teacher-sample-record2.jpg shows "COMPUTER 7 & 8") — so grades is every
// distinct grade taught under that primary subject, not just the single
// most common one. The displayed label is the most common *raw* spelling
// within the winning group, so the header still reads like the source data.
function primarySubjectInfo(teacher){
  const rows = bookingIndex.filter(b=>b.teacher===teacher);
  const keyCounts = new Map();
  rows.forEach(b=>{
    const key = canonicalSubject(b.subject);
    keyCounts.set(key, (keyCounts.get(key)||0) + 1);
  });
  let key = "", bestCount = -1;
  keyCounts.forEach((count, k)=>{ if(count > bestCount){ bestCount = count; key = k; } });

  const groupRows = rows.filter(b=>canonicalSubject(b.subject)===key);
  const labelCounts = new Map();
  groupRows.forEach(b=> labelCounts.set(b.subject, (labelCounts.get(b.subject)||0) + 1));
  let subject = "", bestLabelCount = -1;
  labelCounts.forEach((count, s)=>{ if(count > bestLabelCount){ bestLabelCount = count; subject = s; } });

  const grades = Array.from(new Set(groupRows.map(b=>b.grade)))
    .sort((a,b)=> gradeNumber(a) - gradeNumber(b));

  return { subject, key, grades };
}

// Sum of actual clock duration for every booking matching the teacher's
// primary subject (by canonical identity), across the whole week — the
// "weekly on-subject minutes" formula (confirmed against
// teacher-sample-record.jpg: Janelle Aguila's 30 on-subject periods × 45 min
// = 1350, an exact match).
function weeklyOnSubjectMinutes(teacher, primaryKey){
  return bookingIndex
    .filter(b=>b.teacher===teacher && canonicalSubject(b.subject)===primaryKey)
    .reduce((sum,b)=> sum + periodMinutes(b.time), 0);
}

function gradeNumber(grade){
  return Number(grade.replace("G", ""));
}
function gradeColor(grade){
  const map = getTheme() === "light" ? GRADE_COLORS_LIGHT : GRADE_COLORS_DARK;
  return map[grade] || "#111";
}

// Real-world "now" — recomputed on every clock tick / re-render, not
// cached, so the highlight tracks the actual current time. Mirrors
// class-program.js's nowState()/isPeriodNow().
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
  const [start,end] = range.split(" - ");
  return now.minutes >= parseClock(start) && now.minutes < parseClock(end);
}

const teacherSelect = document.getElementById("teacherSelect");
const teacherInfo = document.getElementById("teacherInfo");
const scheduleTable = document.getElementById("scheduleTable");
const nowClock = document.getElementById("nowClock");

function updateClock(){
  const now = nowState();
  const inSchoolDay = CLASS_PROGRAM.meta.days.includes(now.dayName);
  nowClock.classList.toggle("no-school", !inSchoolDay);
  nowClock.innerHTML = `<span class="dot"></span>${now.label}${inSchoolDay ? "" : " — no class today"}`;
}

function buildTeacherOptions(){
  uniqueTeachers().forEach(name=>{
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    teacherSelect.appendChild(opt);
  });
  teacherSelect.onchange = ()=> renderTeacher(teacherSelect.value);
}

function renderTeacherInfo(teacher, primarySubject, grades, minutes){
  const subjectText = primarySubject
    ? `${primarySubject} ${grades.map(g=>`<span style="color:${gradeColor(g)}">${gradeNumber(g)}</span>`).join(" &amp; ")}`
    : "";
  teacherInfo.innerHTML = `
    <div class="item"><span>Teacher</span><b>${teacher}</b></div>
    <div class="item"><span>Subject</span><b>${subjectText}</b></div>
    <div class="item"><span>Number of Hours</span><b>${minutes || "&mdash;"}</b></div>
  `;
}

function renderTeacher(teacher){
  const rows = bookingIndex.filter(b=>b.teacher===teacher);
  const { subject: primarySubject, key: primaryKey, grades } = primarySubjectInfo(teacher);
  const minutes = weeklyOnSubjectMinutes(teacher, primaryKey);

  renderTeacherInfo(teacher, primarySubject, grades, minutes);

  const days = CLASS_PROGRAM.meta.days;
  const times = Array.from(new Set(rows.map(r=>r.time))).sort((a,b)=>timeKey(a)-timeKey(b));

  const headerCells = days.map(d=>`<th>${d.toUpperCase()}</th>`).join("");

  const now = nowState();

  const routineRows = CLASS_PROGRAM.meta.commonRoutine.map(r=>{
    const isNow = days.some(d=>isPeriodNow(d, r.time, now));
    return `<tr class="routine-row${isNow ? " current-row" : ""}"><td class="time-col">${r.time}</td>${days.map(()=>"<td></td>").join("")}</tr>`;
  }).join("");

  const bodyRows = times.map(time=>{
    const cells = days.map(day=>{
      const matches = rows.filter(r=>r.time===time && r.day===day);
      const isNow = isPeriodNow(day, time, now);
      if(matches.length === 0) return `<td class="empty${isNow ? " current" : ""}"></td>`;
      const cellText = matches.map(m=>{
        const offSubject = canonicalSubject(m.subject) !== primaryKey;
        // "Grade N-Section" always links to that section's own page on
        // class-program.html (deep-linked via applyDeepLink() there, so it
        // opens already selected/highlighted). The " - subject" suffix
        // (off-subject cells only) keeps its own separate link to the LMS
        // course page, when one exists — the two links point at different
        // things, so they stay visually and structurally distinct.
        const sectionLabel = `Grade ${gradeNumber(m.grade)}-${m.section}`;
        let inner = `<a href="class-program.html?grade=${encodeURIComponent(m.grade)}&section=${encodeURIComponent(m.section)}">${sectionLabel}</a>`;
        if(offSubject){
          const link = courseLink(m.grade, m.section, m.subject);
          inner += link
            ? ` - <a href="${link}" target="_blank" rel="noopener">${m.subject}</a>`
            : ` - ${m.subject}`;
        }
        return `<span style="color:${gradeColor(m.grade)}">${inner}</span>`;
      }).join("; ");
      const offSubject = matches.some(m=>canonicalSubject(m.subject) !== primaryKey);
      return `<td class="booked${offSubject ? " offsubject" : ""}${isNow ? " current" : ""}">${cellText}</td>`;
    }).join("");
    return `<tr><td class="time-col">${time}</td>${cells}</tr>`;
  }).join("");

  scheduleTable.innerHTML = `
    <table class="grid">
      <thead>
        <tr><th class="time-head">TIME</th>${headerCells}</tr>
      </thead>
      <tbody>
        ${routineRows}
        ${bodyRows}
      </tbody>
    </table>
  `;

  // See reportIframeHeight() in theme.js — keeps a Moodle-embedded iframe
  // sized to actual content instead of showing an internal scrollbar.
  setTimeout(reportIframeHeight, 0);
}

/* ================= INITIAL CALLS ================= */
buildTeacherOptions();
if(teacherSelect.options.length){
  // Deep-linked from class-program.html's teacher names, e.g.
  // teacher-schedule.html?teacher=Ms.%20Janelle%20Aguila — falls back to
  // the first teacher if the param is missing or doesn't match anyone.
  const requested = new URLSearchParams(window.location.search).get("teacher");
  const names = Array.from(teacherSelect.options).map(o=>o.value);
  teacherSelect.value = names.includes(requested) ? requested : names[0];
  renderTeacher(teacherSelect.value);
}
updateClock();
initThemeToggle("themeToggle", ()=>renderTeacher(teacherSelect.value));

// Clock ticks every second for a live feel; the table only needs to
// re-render when the *current period* could have changed, so that runs on
// a coarser 30s interval instead of rebuilding the table every tick.
setInterval(updateClock, 1000);
setInterval(()=>renderTeacher(teacherSelect.value), 30000);
