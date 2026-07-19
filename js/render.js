/* ================= RENDER ================= */
function timeKey(t){
  let start = t.split(" - ")[0].trim();
  let [h,m] = start.split(":").map(Number);
  if(h < 6) h += 12;
  return h*60+m;
}

function gradeLabel(){
  if(state.grade === "G7") return "Grade 7 only";
  if(state.grade === "G9") return "Grade 9 only";
  return "Grade 7 &amp; Grade 9";
}

// ACE brand logo used in the header eyebrow, in place of a generic icon.
function eyebrowLogo(){
  return `<img class="eyebrow-logo" src="image/ACE-Logo.png" alt="ACE logo">`;
}

// Links a session's grade badge + activity name to that section's own page
// on class-program.html (deep-linked via that page's applyDeepLink(), so it
// opens already selected/highlighted) — AND to that exact day+subject cell
// within the table, which that page highlights distinctly (see
// class-program.js's highlightCellIfRequested()). The onboarding activity
// string is "Section (Subject)" (e.g. "Honesty (AP)") — the base name
// before the parenthetical is exactly the section name class-program.json
// uses, and the parenthetical is exactly the subject code its own periods
// use, so no translation is needed for either piece.
function classProgramLink(grade, day, activity){
  const m = activity.match(/^(.*)\s\((.+)\)$/);
  const section = m ? m[1] : activity;
  const subject = m ? m[2] : "";
  return `class-program.html?grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}`
    + `&day=${encodeURIComponent(day)}&subject=${encodeURIComponent(subject)}`;
}

// Opens class-program.html in a small floating popup instead of navigating
// the onboarding schedule away — clicking a session lets you peek at the
// class program without losing your place here. href is still a real link
// (so middle-click / right-click "open in new tab" keep working); this only
// intercepts a plain left-click. Returning false from the onclick attribute
// cancels the anchor's default navigation.
function openClassProgramWindow(link){
  window.open(link, "classProgramPopup", "width=1100,height=780,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,status=no");
  return false;
}

// Small checkmark badge marking a session as already held. Absolutely
// positioned inset within its parent (never protrudes past its box), so it
// can't inflate row height or get clipped by an ancestor's overflow:hidden.
function doneBadge(){
  return `<span class="done-badge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></span>`;
}

// Eyebrow row ("</> ARALINKS CODING EDUCATION | ONBOARDING SESSION") plus the
// top-right column (the "WEEK X OF 3" pill stacked above a subLabel, e.g.
// "SY 2026–2027 • Grade 7 & Grade 9" or "July 7 • Grade 7 & Grade 9") —
// shared by both renderWeek() and renderDay(). subLabel is pre-built HTML
// (the .sy/.sep/.gr spans) since its content differs between the two.
function headTop(weekNum, subLabel){
  return `
    <div class="head-top">
      <div class="eyebrow-row">
        ${eyebrowLogo()}
        <span class="eyebrow-brand">Aralinks Coding Education</span>
        <span class="eyebrow-divider">|</span>
        <span class="eyebrow-sub">Onboarding Session</span>
      </div>
      <div class="head-top-right">
        <div class="week-pill">WEEK ${weekNum} OF ${Object.keys(SCHEDULE).length}</div>
        <div class="head-sub">${subLabel}</div>
      </div>
    </div>
  `;
}

function renderWeek(weekNum){
  const entries = SCHEDULE[weekNum].filter(e => state.grade === "all" || e[2] === state.grade);

  // Only show day columns that actually have a session that week (under the
  // current grade filter) — e.g. a day fully cancelled/moved away leaves no
  // column instead of an empty one. Falls back to the full week if somehow
  // every day is empty, so the grid never collapses to zero columns.
  let activeDays = DAYS.filter(d => entries.some(e => e[1] === d));
  if(activeDays.length === 0) activeDays = DAYS;

  const slots = [...new Set(entries.map(e=>e[0]))].sort((a,b)=>timeKey(a)-timeKey(b));
  const grid = {};
  slots.forEach(t=>activeDays.forEach(d=>grid[t+"|"+d]=[]));
  entries.forEach(([t,d,grade,act,num,status])=>{ grid[t+"|"+d].push([grade,act,num,status]); });

  // Row-major markup: header row (gutter-head + one day-head per active
  // day), then for each time slot one gutter-cell + one day-cell per active
  // day. CSS Grid auto-placement lays these into a (1 + activeDays.length)
  // column grid — set inline below since the column count varies per week —
  // so every row is exactly one height across all columns regardless of how
  // many day columns are showing.
  let headerRow = `<div class="gutter-head"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>TIME</div>` +
    activeDays.map((d,i)=>`<div class="day-head ${d.toLowerCase()}${i===activeDays.length-1 ? " corner" : ""}">${d.toUpperCase()}</div>`).join("");

  let bodyRows = slots.map(t=>{
    let gutter = `<div class="gutter-cell">${t}</div>`;
    let cells = activeDays.map((d,i)=>{
      const items = grid[t+"|"+d];
      const firstDayCls = i===0 ? " first-day" : "";
      if(items.length===0) return `<div class="day-cell${firstDayCls}"></div>`;
      const tags = items.map(([grade,act,num,status])=>{
        const cancelled = num === "CANCELLED";
        const done = status === "DONE";
        const link = classProgramLink(grade, d, act);
        return `
        <a class="tag ${grade.toLowerCase()}${cancelled ? " cancelled" : ""}" href="${link}" onclick="return openClassProgramWindow('${link}')">
          ${done ? doneBadge() : ""}
          <div class="line1"><span class="badge-circle">${grade.slice(1)}</span><span class="act">${act}</span></div>
          <div class="num">${cancelled ? "Cancelled" : `Session ${num}`}</div>
        </a>`;
      }).join("");
      return `<div class="day-cell${firstDayCls}">${tags}</div>`;
    }).join("");
    return gutter + cells;
  }).join("");

  return `
    <div class="head">
      ${headTop(weekNum, `<span class="sy">SY 2026–2027</span><span class="sep">•</span><span class="gr">${gradeLabel()}</span>`)}
      <h1 class="headline">${WEEK_DATES[weekNum]}</h1>
    </div>
    <div class="card">
      <div class="gridwrap" style="grid-template-columns:130px repeat(${activeDays.length},1fr);grid-template-rows:64px repeat(${slots.length},1fr);">
        ${headerRow}
        ${bodyRows}
      </div>
    </div>
    ${footer(weekNum)}
  `;
}

function renderDay(weekNum, day){
  const entries = SCHEDULE[weekNum]
    .filter(e=>e[1]===day && (state.grade === "all" || e[2] === state.grade))
    .sort((a,b)=>timeKey(a[0])-timeKey(b[0]));

  const rows = entries.length ? entries.map(([t,d,grade,act,num,status])=>{
    const cancelled = num === "CANCELLED";
    const done = status === "DONE";
    const link = classProgramLink(grade, d, act);
    return `
    <div class="session-row ${grade.toLowerCase()}${cancelled ? " cancelled" : ""}">
      <div class="session-time">${t}</div>
      <a class="session-main" href="${link}" onclick="return openClassProgramWindow('${link}')">
        ${done ? doneBadge() : ""}
        <span class="session-badge">${grade.slice(1)}</span>
        <span class="session-act">${act}</span>
        <div class="session-num">${cancelled ? "Cancelled" : `Session&nbsp;${num}`}</div>
      </a>
    </div>
  `;
  }).join("") : `<div class="empty-state">No sessions for ${gradeLabel().replace('&amp;','&amp;')} on ${day}.</div>`;

  return `
    <div class="head">
      ${headTop(weekNum, `<span class="sy">${DAY_DATES[weekNum][day]}</span><span class="sep">•</span><span class="gr">${gradeLabel()}</span>`)}
      <h1 class="headline">${day.toUpperCase()}<span class="accent">.</span></h1>
    </div>
    <div class="card">
      <div class="daybody">
        ${rows}
      </div>
    </div>
    ${footer(weekNum, day)}
  `;
}

function footer(weekNum, day){
  const showG7 = state.grade !== "G9";
  const showG9 = state.grade !== "G7";
  const dateText = (day ? DAY_DATES[weekNum][day] : WEEK_DATES[weekNum]).toUpperCase() + ", 2026";
  return `
    <div class="foot">
      <div class="legend-pill">
        ${showG7 ? `<span><span class="dot g7"></span> Grade 7</span>` : ``}
        ${showG9 ? `<span><span class="dot g9"></span> Grade 9</span>` : ``}
      </div>
      <div class="date-pill">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>
        ${dateText}
      </div>
    </div>
  `;
}
