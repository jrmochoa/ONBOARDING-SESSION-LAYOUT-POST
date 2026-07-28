/* ================= SHORTENED PERIOD SCHEDULE =================
   "Shortened period" days aren't tied to a day-of-week — they're
   announced ad hoc and can land on any weekday (Monday-Friday). Same
   subjects, same order as that day's normal schedule, just compressed
   into shorter time blocks with fewer breaks — see the per-grade
   templates below. Nothing here touches CLASS_PROGRAM's own normal
   weekly data; this is a separate, manually-maintained override layer
   that class-program.js consults only when today's real date is listed.

   SHORTENED_DATES: add one entry whenever a shortened day is announced,
   e.g. "2026-08-07": ["G7","G9"] — no code changes needed beyond this.
   Starts empty. */
const SHORTENED_DATES = {
  "2026-07-29": ["G7", "G9"],
};

// Ordered list of period slots for a shortened day, per grade. Each
// "period" slot consumes the next subject in that day's *normal*
// schedule, in order (see applyShortenedTemplate() in class-program.js)
// — so this only needs times, not subjects/teachers. Some days have
// fewer than 9 subject-periods (Fridays commonly run 8, not 9); the
// trailing "period" slot(s) simply go unused for those days rather than
// assuming every day fills all 9.
// G8 isn't populated yet — a shortened date listed for it simply won't
// render a panel until its template is added here. G10 shares G9's
// template exactly (same times for both grades, per source).
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
    { type: "period", time: "8:30 - 8:55" },
    { type: "break",  time: "8:55 - 9:25" },
    { type: "period", time: "9:25 - 9:50" },
    { type: "period", time: "9:50 - 10:15" },
    { type: "period", time: "10:15 - 10:40" },
    { type: "period", time: "10:40 - 11:05" },
    { type: "period", time: "11:05 - 11:30" },
  ],
  G8: null,
};
SHORTENED_PERIOD_TEMPLATES.G10 = SHORTENED_PERIOD_TEMPLATES.G9;
