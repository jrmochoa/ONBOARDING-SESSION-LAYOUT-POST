/* ================= SESSION STATUS REPORT =================
   Matrix report: one row per section, one column per session number
   (1-5), marked done if that session already happened. Session 1 is
   always the shared online kickoff (June 29, before the tracked
   in-person schedule even starts — see session-breakdown.html), so it's
   always shown as done. Computed live from SCHEDULE in js/data.js on
   every load — nothing here is hand-typed. Keeps its own small copy of
   the grouping logic rather than loading session-breakdown.js, since
   that file has its own page-specific DOM wiring/init calls (grade tabs,
   theme toggle) that don't apply to this simpler page and would error
   if run here. */
function buildSessionStatus(){
  const grades = {};
  Object.entries(SCHEDULE).forEach(([week, rows])=>{
    rows.forEach(([time, day, grade, act, num, status])=>{
      if(num === "CANCELLED") return;
      const m = act.match(/^(.*)\s\((.+)\)$/);
      const section = m ? m[1] : act;
      if(!grades[grade]) grades[grade] = {};
      if(!grades[grade][section]) grades[grade][section] = {};
      grades[grade][section][num] = status === "DONE";
    });
  });
  return grades;
}

function gradeNumber(grade){
  return grade.replace("G", "");
}

function renderReport(){
  const grades = buildSessionStatus();
  const rows = [];
  ["G7", "G9"].filter(g=>grades[g]).forEach(grade=>{
    Object.keys(grades[grade]).sort().forEach(section=>{
      rows.push({ grade, section, done: grades[grade][section] });
    });
  });

  const bodyRows = rows.map(r=>{
    const cells = [1,2,3,4,5].map(n=>{
      const isDone = n === 1 ? true : !!r.done[n];
      return `<td class="mark-cell">${isDone ? "&#10003;" : ""}</td>`;
    }).join("");
    return `<tr><td class="row-label">${gradeNumber(r.grade)} ${r.section.toUpperCase()}</td>${cells}</tr>`;
  }).join("");

  document.getElementById("reportTable").innerHTML = `
    <table>
      <thead>
        <tr><th class="corner"></th><th colspan="5">ACE Onboarding Session</th></tr>
        <tr><th class="corner"></th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th></tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>
  `;
}

renderReport();
