/* ================= COURSE LINKS =================
   Shared by class-program.html and teacher-schedule.html. Maps the short
   subject codes used in CLASS_PROGRAM's schedules (e.g. "CLVE", "Fil",
   "TLE (FCS/IA/ICT)") to the full subject names used as keys in
   CLASS_PROGRAM.courses (sourced from g7_g8_courses_full.csv /
   g9_g10_courses_full.csv), then looks up that section's course URL.
   Returns null for anything with no matching course page (HR/L/G, HR/G/L,
   or a grade/section/subject combo missing from the CSVs). */

const SUBJECT_FULL_NAME = {
  "AP": "Social Studies",
  "CLVE": "Christian Living and Values Education",
  "COMP": "Computer",
  "ENG": "English",
  "FIL": "Filipino",
  "MAPEH": "MAPEH",
  "MATH": "Mathematics",
  "SCI": "Science",
  "TLE": "TLE",
};

function subjectFullName(subjectCode){
  const base = subjectCode.replace(/\s*\(.*\)\s*$/, "").trim().toUpperCase();
  return SUBJECT_FULL_NAME[base] || null;
}

function courseLink(grade, section, subjectCode){
  const fullName = subjectFullName(subjectCode);
  if(!fullName) return null;
  const bySection = CLASS_PROGRAM.courses[grade] && CLASS_PROGRAM.courses[grade][section];
  return (bySection && bySection[fullName]) || null;
}
