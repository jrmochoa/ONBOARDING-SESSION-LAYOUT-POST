/* ================= SESSION STATUS REPORT =================
   Matrix report: one row per section, one column per session number
   (1-5), rendered as a solid-color heatmap block (green = done, slate =
   upcoming) with the session number inside — no date/time text in the
   cell itself, just the number; full date/day/time is available on
   hover via the title tooltip (see tooltipFor()). Session 1 is always
   the shared online kickoff (June 29, before the tracked in-person
   schedule even starts — see session-breakdown.html), so it's always
   shown as done. Computed live from SCHEDULE in js/data.js on every
   load — nothing here is hand-typed. Keeps its own small copy of the
   grouping logic rather than loading session-breakdown.js, since that
   file has its own page-specific DOM wiring/init calls (grade tabs,
   theme toggle) that don't apply to this simpler page and would error
   if run here. */
const ONLINE_SESSION = { G7: { time: "8:00 - 9:00 AM" }, G9: { time: "10:00 - 11:00 AM" } };
const ONLINE_DATE = "June 29";

function buildSessionStatus(){
  const grades = {};
  Object.entries(SCHEDULE).forEach(([week, rows])=>{
    rows.forEach(([time, day, grade, act, num, status])=>{
      if(num === "CANCELLED") return;
      const m = act.match(/^(.*)\s\((.+)\)$/);
      const section = m ? m[1] : act;
      if(!grades[grade]) grades[grade] = {};
      if(!grades[grade][section]) grades[grade][section] = {};
      grades[grade][section][num] = { done: status === "DONE", date: DAY_DATES[week][day], day, time };
    });
  });
  return grades;
}

function gradeNumber(grade){
  return grade.replace("G", "");
}

function tooltipFor(m){
  if(!m.date) return "Not yet scheduled";
  return `${m.day}, ${m.date} · ${m.time}`;
}

function renderReport(){
  const grades = buildSessionStatus();

  const bodyRows = ["G7", "G9"].filter(g=>grades[g]).map(grade=>{
    const divider = `<tr class="grade-divider"><td colspan="6">Grade ${gradeNumber(grade)}</td></tr>`;
    const sectionRows = Object.keys(grades[grade]).sort().map(section=>{
      const data = grades[grade][section];
      const cells = [1,2,3,4,5].map(n=>{
        const m = n === 1
          ? { done: true, date: ONLINE_DATE, day: "Online", time: ONLINE_SESSION[grade].time }
          : (data[n] || { done: false, date: null, day: null, time: null });
        return `<td class="block-cell${m.done ? " done" : ""}" title="${tooltipFor(m)}"><span class="block">${n}</span></td>`;
      }).join("");
      return `<tr><td class="row-label ${grade.toLowerCase()}">${gradeNumber(grade)} ${section.toUpperCase()}</td>${cells}</tr>`;
    }).join("");
    return divider + sectionRows;
  }).join("");

  document.getElementById("reportTable").innerHTML = `
    <table>
      <thead>
        <tr><th class="corner"></th><th colspan="5">ACE Onboarding Session</th></tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}

renderReport();
initThemeToggle("themeToggle", renderReport);
