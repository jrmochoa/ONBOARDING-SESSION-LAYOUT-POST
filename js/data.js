/* ================= DATA ================= */
const SCHEDULE = {
  1: [
    ["7:15 - 8:00","Wednesday","G7","Faith (Filipino)",2,"DONE"],
    ["7:55 - 8:35","Tuesday","G9","Honesty (AP)",2,"DONE"],
    ["7:55 - 8:35","Thursday","G9","Integrity (MAPEH)",2,"DONE"],
    ["7:55 - 8:35","Friday","G9","Honesty (CLVE)","CANCELLED"],
    ["8:35 - 9:15","Wednesday","G9","Modesty (Filipino)",2,"DONE"],
    ["9:15 - 10:00","Tuesday","G7","Charity (Science)",2,"DONE"],
    ["10:00 - 10:45","Wednesday","G7","Charity (English)",3,"DONE"],
    ["10:25 - 11:05","Tuesday","G9","Serenity (Math)",2,"DONE"],
    ["9:45 - 10:25","Friday","G9","Modesty (AP)","CANCELLED"],
    ["10:45 - 11:30","Thursday","G7","Hope (CLVE)","CANCELLED"],
    ["11:05 - 11:45","Wednesday","G9","Loyalty (TLE)",2,"DONE"],
    ["1:15 - 2:00","Friday","G7","Love (MAPEH)","CANCELLED"],
    ["1:25 - 2:05","Tuesday","G9","Creativity (MAPEH)",2,"DONE"],
    ["1:25 - 2:05","Thursday","G9","Serenity (Science)",3,"DONE"],
    ["2:00 - 2:45","Thursday","G7","Joy (Math)",2,"DONE"],
    ["2:05 - 2:45","Wednesday","G9","Industry (Science)",2,"DONE"]
  ],
  2: [
    ["7:15 - 7:55","Tuesday","G9","Honesty (MAPEH)",3,"DONE"],
    ["7:15 - 7:55","Thursday","G9","Serenity (Filipino)",4,"DONE"],
    ["7:15 - 8:00","Friday","G7","Love (AP)",2,"DONE"],
    ["7:55 - 8:35","Tuesday","G9","Modesty (Math)",3,"DONE"],
    ["7:55 - 8:35","Wednesday","G9","Creativity (Filipino)",3,"DONE"],
    ["9:45 - 10:25","Wednesday","G9","Loyalty (CLVE)",3,"DONE"],
    ["10:45 - 11:30","Tuesday","G7","Faith (TLE)",3,"DONE"],
    ["10:25 - 11:05","Thursday","G9","Industry (TLE)",3,"DONE"],
    ["10:45 - 11:30","Wednesday","G7","Joy (Science)",4,"DONE"],
    ["10:00 - 10:45","Friday","G7","Hope (Math)",3,"DONE"],
    ["12:30 - 1:15","Wednesday","G7","Charity (Filipino)",4,"DONE"],
    ["1:15 - 2:00","Tuesday","G7","Joy (AP)",3,"DONE"],
    ["1:25 - 2:05","Friday","G9","Industry (AP)",4,"DONE"],
    ["2:00 - 2:45","Thursday","G7","Hope (MAPEH)",2,"DONE"],
    ["1:25 - 2:05","Thursday","G9","Integrity (CLVE)",3,"DONE"]
  ],
  3: [
    ["7:15 - 8:00","Tuesday","G7","Hope (English)",4,"DONE"],
    ["7:15 - 8:00","Friday","G7","Joy (CLVE)",5,"DONE"],
    ["7:55 - 8:35","Tuesday","G9","Loyalty (MAPEH)",4,"DONE"],
    ["8:35 - 9:15","Friday","G9","Creativity (AP)",4,"DONE"],
    ["9:15 - 10:00","Tuesday","G7","Love (English)",3,"DONE"],
    ["10:45 - 11:30","Friday","G7","Charity (AP)",5,"DONE"],
    ["12:45 - 1:25","Tuesday","G9","Industry (Filipino)",5,"DONE"],
    ["12:45 - 1:25","Friday","G9","Serenity (MAPEH)",5,"DONE"]
  ],
  4: [
    ["10:25 - 11:05","Tuesday","G9","Honesty (CLVE)",4],
    ["1:25 - 2:05","Tuesday","G9","Integrity (Science)",4],
    ["2:05 - 2:45","Tuesday","G9","Modesty (AP)",4],
    ["1:15 - 2:00","Wednesday","G7","Love (MAPEH)",5],
    ["8:35 - 9:15","Thursday","G9","Loyalty (English)",5],
    ["7:15 - 7:55","Thursday","G9","Creativity (TLE)",5],
    ["8:00 - 8:45","Wednesday","G7","Faith (Math)",4],
    ["9:45 - 10:25","Wednesday","G9","Modesty (TLE)",5],
    ["1:25 - 2:05","Thursday","G9","Honesty (Math)",5],
    ["12:30 - 1:15","Friday","G7","Faith (CLVE)",5],
    ["10:45 - 11:30","Friday","G7","Hope (CLVE)",5],
    ["7:15 - 8:00","Tuesday","G7","Love (AP)",4],
    ["8:35 - 9:15","Friday","G9","Integrity (Math)",5]
  ]
};
const DAYS = ["Tuesday","Wednesday","Thursday","Friday"];
const DAY_ABBR = {Tuesday:"TUE",Wednesday:"WED",Thursday:"THU",Friday:"FRI"};
const WEEK_DATES = { 1: "July 7–10", 2: "July 14–17", 3: "July 21–24", 4: "July 28–31" };
const DAY_DATES = {
  1: { Tuesday: "July 7", Wednesday: "July 8", Thursday: "July 9", Friday: "July 10" },
  2: { Tuesday: "July 14", Wednesday: "July 15", Thursday: "July 16", Friday: "July 17" },
  3: { Tuesday: "July 21", Wednesday: "July 22", Thursday: "July 23", Friday: "July 24" },
  4: { Tuesday: "July 28", Wednesday: "July 29", Thursday: "July 30", Friday: "July 31" }
};

/* ================= SHORTENED PERIOD SCHEDULE (index.html copy) =================
   Duplicated from js/shortened-schedule.js (used by class-program.html)
   rather than loaded via a shared <script> tag, since index.html must
   never be edited — this file is the one index.html already loads.
   KEEP THESE THREE THINGS IN SYNC WITH js/shortened-schedule.js WHENEVER
   EITHER CHANGES: SHORTENED_DATES entries, SHORTENED_PERIOD_TEMPLATES
   (G7/G9 times), and this file's own PERIOD_INDEX_BY_TIME below.

   "Shortened period" days aren't tied to a day-of-week — announced ad
   hoc, can land on any weekday. Add one entry here whenever a shortened
   day is announced, e.g. "2026-08-07": ["G7","G9"]. Starts empty. */
const SHORTENED_DATES = {
  // "2026-08-07": ["G7", "G9"],
};

const SHORTENED_PERIOD_TEMPLATES = {
  G7: [
    { type: "period", time: "7:15 - 7:40" },
    { type: "period", time: "7:40 - 8:05" },
    { type: "period", time: "8:05 - 8:30" },
    { type: "break",  time: "8:30 - 8:55" },
    { type: "period", time: "8:55 - 9:20" },
    { type: "period", time: "9:20 - 9:45" },
    { type: "period", time: "9:45 - 10:10" },
    { type: "period", time: "10:10 - 10:35" },
    { type: "period", time: "10:35 - 11:00" },
    { type: "period", time: "11:00 - 11:25" },
  ],
  G9: [
    { type: "period", time: "7:15 - 7:40" },
    { type: "period", time: "7:40 - 8:05" },
    { type: "period", time: "8:05 - 8:30" },
    { type: "period", time: "8:30 - 9:05" },
    { type: "break",  time: "9:05 - 9:25" },
    { type: "period", time: "9:25 - 9:50" },
    { type: "period", time: "9:50 - 10:15" },
    { type: "period", time: "10:15 - 10:40" },
    { type: "period", time: "10:40 - 11:05" },
    { type: "period", time: "11:05 - 11:30" },
  ],
};

// Maps a normal-schedule period's start-end time string to its 1-based
// period number (1st-9th), so an onboarding SCHEDULE entry's stored time
// (which always matches that section's real class period, see CLAUDE.md)
// can be looked up here and re-timed onto SHORTENED_PERIOD_TEMPLATES
// above when the viewed day is a shortened date. Bell times are uniform
// across every section within a grade and identical on every weekday
// (verified against class-program.json — only the subject taught in
// each slot varies by section/day, never the slot boundaries), so one
// flat table per grade covers all sections and all days.
const PERIOD_INDEX_BY_TIME = {
  G7: {
    "7:15 - 8:00": 1, "8:00 - 8:45": 2, "9:15 - 10:00": 3, "10:00 - 10:45": 4,
    "10:45 - 11:30": 5, "12:30 - 1:15": 6, "1:15 - 2:00": 7, "2:00 - 2:45": 8,
    "2:45 - 3:30": 9,
  },
  G9: {
    "7:15 - 7:55": 1, "7:55 - 8:35": 2, "8:35 - 9:15": 3, "9:45 - 10:25": 4,
    "10:25 - 11:05": 5, "11:05 - 11:45": 6, "12:45 - 1:25": 7, "1:25 - 2:05": 8,
    "2:05 - 2:45": 9,
  },
};

// Given a normal SCHEDULE entry's grade/day/time, returns its shortened-
// schedule time if `day`'s real calendar date (week/day -> DAY_DATES) is
// listed in SHORTENED_DATES for that grade and a template exists for it;
// otherwise returns the original time unchanged. periodIndex lookup
// misses (a time with no known period number) also pass through
// unchanged rather than erroring.
function shortenedTimeFor(week, day, grade, time){
  const dateStr = DAY_DATES[week][day];
  if(!dateStr) return time;
  const months = {January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12};
  const [monthName, dayNum] = dateStr.split(" ");
  const pad = n => String(n).padStart(2, "0");
  const dateISO = "2026-" + pad(months[monthName]) + "-" + pad(Number(dayNum));

  const gradesToday = SHORTENED_DATES[dateISO];
  const template = SHORTENED_PERIOD_TEMPLATES[grade];
  if(!gradesToday || !gradesToday.includes(grade) || !template) return time;

  const periodNum = (PERIOD_INDEX_BY_TIME[grade] || {})[time];
  if(!periodNum) return time;

  const periodSlots = template.filter(s => s.type === "period");
  const slot = periodSlots[periodNum - 1];
  return slot ? slot.time : time;
}
