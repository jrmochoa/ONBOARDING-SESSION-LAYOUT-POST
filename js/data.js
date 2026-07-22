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
    ["7:15 - 8:00","Friday","G7","Joy (CLVE)",5],
    ["7:55 - 8:35","Tuesday","G9","Loyalty (MAPEH)",4,"DONE"],
    ["8:35 - 9:15","Friday","G9","Creativity (AP)",4],
    ["9:15 - 10:00","Tuesday","G7","Love (English)",3,"DONE"],
    ["10:45 - 11:30","Friday","G7","Charity (AP)",5],
    ["12:45 - 1:25","Tuesday","G9","Industry (Filipino)",5,"DONE"],
    ["12:45 - 1:25","Friday","G9","Serenity (MAPEH)",5]
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
