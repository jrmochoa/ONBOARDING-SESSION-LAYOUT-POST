/* ================= EXPORT ================= */
const downloadBtn = document.getElementById("downloadBtn");
const downloadAllBtn = document.getElementById("downloadAllBtn");
const downloadAllLabel = document.getElementById("downloadAllLabel");

function gradeSuffix(){
  return state.grade === "all" ? "" : `_${state.grade}`;
}

const fontsReady = () => (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();

// Waits for every <img> inside a container to finish loading (or fail).
// exportCapture.innerHTML = html creates fresh <img> nodes each capture, so
// even an already-cached image needs this — html2canvas can otherwise
// rasterize before a freshly-inserted <img> has decoded, capturing blank
// space where the image belongs (see CLAUDE.md's header-logo note).
function imagesReady(container){
  const imgs = Array.from(container.querySelectorAll("img"));
  return Promise.all(imgs.map(img => img.complete
    ? Promise.resolve()
    : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })
  ));
}

// Renders the given HTML into the hidden, untransformed export clone and
// captures it at native 1080x1080 (2x pixel density). Returns a canvas.
function captureHTML(html){
  exportCapture.innerHTML = html;
  return fontsReady()
    .then(() => imagesReady(exportCapture))
    .then(() => new Promise(r => setTimeout(r, 50)))
    .then(() => html2canvas(exportCapture, {
      width: 1080,
      height: 1080,
      windowWidth: 1080,
      windowHeight: 1080,
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true
    }));
}

function canvasToBlob(canvas){
  return new Promise(resolve => canvas.toBlob(resolve, "image/png"));
}

downloadBtn.onclick = () => {
  const filename = state.mode === "week"
    ? `ACE_Onboarding_Week${state.week}${gradeSuffix()}.png`
    : `ACE_Onboarding_Week${state.week}_${state.day}${gradeSuffix()}.png`;

  downloadBtn.disabled = true;
  downloadAllBtn.disabled = true;
  const originalText = downloadBtn.innerHTML;
  downloadBtn.innerHTML = "Preparing image…";

  const html = state.mode === "week" ? renderWeek(state.week) : renderDay(state.week, state.day);

  captureHTML(html).then(canvas => {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }).catch(err => {
    console.error("Export failed:", err);
    alert("Sorry, the image export failed. Please try again.");
  }).finally(() => {
    downloadBtn.disabled = false;
    downloadAllBtn.disabled = false;
    downloadBtn.innerHTML = originalText;
    render(); // restore the on-screen preview (captureHTML overwrote the shared export clone)
  });
};

function updateDownloadAllLabel(){
  const weekCount = Object.keys(SCHEDULE).length;
  downloadAllLabel.textContent = state.mode === "week"
    ? `Download All (${weekCount} Weeks)`
    : `Download All (${weekCount * DAYS.length} Days)`;
}

downloadAllBtn.onclick = () => {
  downloadAllBtn.disabled = true;
  downloadBtn.disabled = true;
  const originalLabel = downloadAllLabel.textContent;

  const jobs = [];
  const weekNums = Object.keys(SCHEDULE).map(Number);
  if(state.mode === "week"){
    weekNums.forEach(w => jobs.push({
      name: `ACE_Onboarding_Week${w}${gradeSuffix()}.png`,
      html: renderWeek(w)
    }));
  } else {
    weekNums.forEach(w => DAYS.forEach(d => jobs.push({
      name: `ACE_Onboarding_Week${w}_${d}${gradeSuffix()}.png`,
      html: renderDay(w, d)
    })));
  }

  const zip = new JSZip();
  let i = 0;

  function next(){
    if(i >= jobs.length){
      downloadAllLabel.textContent = "Zipping…";
      return zip.generateAsync({ type: "blob" }).then(blob => {
        const zipName = state.mode === "week"
          ? `ACE_Onboarding_AllWeeks${gradeSuffix()}.zip`
          : `ACE_Onboarding_AllDays${gradeSuffix()}.zip`;
        const link = document.createElement("a");
        link.download = zipName;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 4000);
      });
    }
    const job = jobs[i];
    downloadAllLabel.textContent = `Generating ${i+1} of ${jobs.length}…`;
    return captureHTML(job.html)
      .then(canvasToBlob)
      .then(blob => { zip.file(job.name, blob); i++; return next(); });
  }

  next().catch(err => {
    console.error("Batch export failed:", err);
    alert("Sorry, the batch export failed. Please try again.");
  }).finally(() => {
    downloadAllBtn.disabled = false;
    downloadBtn.disabled = false;
    downloadAllLabel.textContent = originalLabel;
    render(); // restore the on-screen preview
  });
};
