# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

A buildless, static web app that turns a coding-onboarding schedule (Aralinks
Coding Education, "ACE") into square 1080×1080 PNG images that can be posted or
printed — one image per week (a full grid) or one image per day (a card). There's
also a batch mode that zips up every week or every day in one click.

There is no build step, no package.json, no bundler, and no framework/module
syntax. HTML, CSS, and JS are split across plain files, loaded with ordinary
`<link>`/`<script src>` tags (no `import`/`export`, everything is a global
function or const, same as when it was one file):

```
index.html        markup + toolbar only
css/
  styles.css      all styles
js/
  data.js         SCHEDULE, WEEK_DATES, DAY_DATES, DAYS, DAY_ABBR
  render.js       timeKey(), gradeLabel(), eyebrowLogo(),
                  headTop(), renderWeek(), renderDay(), footer()
  export.js       captureHTML(), imagesReady(), canvasToBlob(), single + batch
                  download handlers
  app.js          state, UI wiring (button listeners), render(), initial calls
image/
  ACE-Logo.png    header brand logo (see "Header logo" below)
  bg.png          .capture's full-bleed background image (see "Capture
                  background image" below)
```

Open `index.html` directly in a browser (or `python3 -m http.server` and visit
it) to run it — it's still just static files, only now more than one of them.
There is nothing to install for the *shipped* app; it pulls two libraries from
CDNs at runtime (see below).

### Script load order matters

`index.html` loads the four JS files in this exact order, right before
`</body>`:

```html
<script src="js/data.js"></script>
<script src="js/render.js"></script>
<script src="js/export.js"></script>
<script src="js/app.js"></script>
```

All four are classic (non-module) scripts sharing one global scope, so a
`const`/`function` declared in an earlier file is visible in a later one. The
reverse — a later file's globals (like `state`, `capture`, `exportCapture`,
all declared in `app.js`, which loads *last*) being used by an *earlier* file
(`render.js`, `export.js`) — only works because those earlier files only
reference them **inside function bodies** (`renderWeek()`, `captureHTML()`,
the `downloadBtn.onclick` handler, etc.), which don't run until a button is
clicked or `render()` is called — by which point `app.js` has already
executed and defined them. **Never add top-level (immediately-executing)
code to `data.js`/`render.js`/`export.js` that reads `state`, `capture`, or
`exportCapture`** — it will be `undefined` at load time. This is why
`updateDownloadAllLabel()` is *defined* in `export.js` but *called* from
`app.js`'s initial-calls section, not from within `export.js` itself.

## Runtime dependencies (CDN, not bundled)

Loaded via `<script>` tags in `index.html`'s `<head>`:

- **html2canvas** (`cdnjs.cloudflare.com/.../html2canvas/1.4.1`) — rasterizes the
  export DOM node into a `<canvas>` so it can be saved as a PNG.
- **JSZip** (`cdnjs.cloudflare.com/.../jszip/3.10.1`) — bundles multiple PNGs into
  one `.zip` for the "Download All" batch feature.
- **Google Fonts** — Space Grotesk (headlines), Inter (body/activity names),
  IBM Plex Mono (times, badges, session numbers — the "code editor gutter" motif).

If you test this in a sandboxed/offline environment, these CDN calls will fail
and `html2canvas`/`JSZip` will be `undefined`. That's expected there — it still
works fine for the end user in a normal browser. To test the export/zip logic
offline, `npm install html2canvas jszip` somewhere temporary, copy the two
`dist/*.min.js` files next to `index.html`, and point the `<script src>` tags at
the local copies in a throwaway test copy of the file (never commit that swap).

## Data model

All schedule data is hardcoded in a `SCHEDULE` object at the top of
`js/data.js`:

```js
const SCHEDULE = {
  1: [ ["7:15 - 8:00", "Wednesday", "G7", "Faith (Filipino)", 2], ... ],
  2: [ ... ],
  3: [ ... ]
};
```

Each row is `[time, day, grade, activity, sessionNumber]`:

- `time` — `"H:MM - H:MM"` (12-hour, no AM/PM shown anywhere — there used to
  be a `meridiem()` display-only AM/PM line under the time in the week grid's
  TIME column; it was removed by request. `timeKey()` still assumes anything
  before 6:00 is PM and adds 12 hours — school days run ~6:50am–2:55pm so this
  heuristic is safe *for this dataset only* — but that's for sort order, not
  display).
- `day` — one of `"Tuesday"…"Friday"`. Monday is intentionally never used;
  there's no Monday column anywhere in the UI. If a future week ever needs
  Monday, you must add it to the `DAYS` array and it will show up everywhere
  (grid columns, day tabs, `DAY_DATES`, etc.).
- `grade` — `"G7"` or `"G9"` exactly (used as a CSS class via `.toLowerCase()`
  and as display text). Don't introduce a third grade without updating the
  grade filter buttons, `gradeLabel()`, and the footer legend logic.
- `activity` — display string, may include a parenthetical subject/room, e.g.
  `"Faith (Filipino)"`.
- `sessionNumber` — a plain integer. **Do not wrap it in brackets** in markup —
  a past revision had `Session [2]`; the user asked for `Session 2` (no
  brackets). Keep it that way.

### Session numbering rule (validated, don't break it)

Every distinct activity name (Faith, Charity, Hope, Love, Joy for G7; Honesty,
Modesty, Integrity, Serenity, Creativity, Loyalty, Industry for G9) numbers
sequentially starting at `2`, in chronological order (week, then day, then
time) across all three weeks — e.g. G7 Faith is `2` in week 1, `3` in week 2,
`4`/`5` across week 3's two Faith sessions. If you edit `SCHEDULE`, re-check
this pattern per activity name; it was hand-verified against the source
schedule image pixel-by-pixel and every activity currently comes out as a
clean `2,3,4,5` run.

### Date maps

```js
const WEEK_DATES = { 1: "July 7–10", 2: "July 14–17", 3: "July 21–24" };
const DAY_DATES  = { 1: { Tuesday: "July 7", ... }, 2: {...}, 3: {...} };
```

These are the real AY 2026–2027 onboarding dates and must stay in sync with
`SCHEDULE`'s week numbers manually — there's no date-math deriving one from
the other. If the school year's dates change, update both maps.

## Architecture

### State

```js
let state = { week: 1, mode: "week", day: "Tuesday", grade: "all" };
```

- `mode`: `"week"` (full grid) or `"day"` (single day card).
- `grade`: `"all" | "G7" | "G9"` — filters what renders **and** what's shown
  in the exported filename.

### Render pipeline

`render()` is the single source of truth for what's on screen. It computes one
HTML string (`renderWeek()` or `renderDay()`, depending on `state.mode`) and
writes it into **two** places:

1. `#capture` — visible, scaled down for on-screen preview.
2. `#exportCapture` — hidden, full native size, used for PNG export.

**Why two copies exist (important, don't "simplify" this away):** the visible
preview is scaled down with `.scaler { transform: scale(0.518...) }` so a
1080×1080 square fits on screen. html2canvas measures elements incorrectly
when an ancestor has a CSS `transform`, producing broken/undersized exports.
The fix is to keep a second, untransformed, off-screen (`left:-99999px`) copy
of the exact same markup and always capture *that* one. This was a real bug
reported by the user ("fix the downloaded image") — don't reintroduce it by
pointing `html2canvas` back at `#capture`.

### The week grid is a single CSS Grid — not nested flexboxes

`renderWeek()` emits one flat, **row-major** sequence of grid items (gutter
head, 4 day heads, then for each time slot: 1 gutter cell + 4 day cells) into
a single `display:grid` container (`.gridwrap`) with
`grid-template-columns: 130px repeat(4,1fr)` and an inline
`grid-template-rows: 64px repeat(N,1fr)` (N = number of time slots that week).

This used to be nested flexbox columns (one flex column for the time gutter,
one flex row of flex columns for the days), and it had a real bug: each
column sized its own rows independently, so a cell with a two-line tag in one
column wouldn't match the height of the "same" row in another column — cells
drifted out of horizontal alignment. **Keep this as a single grid.** If you
add new markup to a cell, verify alignment by comparing
`getBoundingClientRect().top/bottom` for every cell in a row (see the
Verification section below) — don't just eyeball it.

### Grade + activity on one line in the week grid

Each grid cell's tag (`.tag`) shows:

```
(●7)[Activity name]   <- one line, `.line1` — circular badge + activity
Session N               <- second line
```

The circular grade badge (`.badge-circle`, filled with `var(--g7)`/`var(--g9)`,
just the bare digit `7`/`9` via `grade.slice(1)`) sits inline before the
activity name in a flex row; the activity name itself wraps instead of
getting truncated with an ellipsis if it's long — losing schedule information
silently was judged worse than an occasional two-line cell. If you touch
`.line1`/`.badge-circle`/`.act`, keep the wrap behavior; don't switch to
`white-space:nowrap` + `text-overflow:ellipsis`. The day view's
`.session-badge` uses the same "bare digit in a colored circle" treatment,
just larger (44px vs. 22px).

### Color palette

Base colors sampled directly (via a color histogram, not guessed) from a
reference tarp the user provided (St. Bridget College admissions poster).
The gradient/illustration colors added for the "code-editor poster" restyle
were sampled the same way from a second reference image (a ChatGPT-generated
mock of the target look) using pixel/histogram sampling, not eyeballed hex
guesses — see conversation history for the exact technique
(`PIL.Image.getpixel`/`Counter` mode-color extraction per region).

```css
--ink:      #013491;  /* deep navy — gutter bg, day-view time cells, footer date-pill */
--royal:    #1237B3;  /* bright royal blue */
--gold:     #EDD132;  /* eyebrow brand text, gutter "TIME" accent */
--g7:       #1237B3;  /* Grade 7 accent (royal blue, same as --royal) */
--g7-soft:  #E4E9FB;  /* Grade 7 soft tint — pale ~90%-lightened --g7 */
--g9:       #16A34A;  /* Grade 9 accent (green — chosen to read clearly as
                          white text in the circular badge, and to stay
                          visually distinct from both --col-tue-* (blue) and
                          --col-wed-* (teal), which are close in hue to a
                          weaker/more-teal green) */
--g9-soft:  #E8F6ED;  /* Grade 9 soft tint — pale ~90%-lightened --g9 */

--cyan-light:#9EEBFF;                            /* "SY 2026–2027" / day-date subtitle text */
--col-time-1:#4A7DF2; --col-time-2:#1E4FDD;      /* TIME column header + body gradient */
--col-tue-1:#6F97F6;  --col-tue-2:#4E79EC;       /* Tuesday column header gradient */
--col-wed-1:#3DC8D6;  --col-wed-2:#14A2C2;       /* Wednesday column header gradient */
--col-thu-1:#8B4EF2;  --col-thu-2:#6430E6;       /* Thursday column header gradient */
--col-fri-1:#FB7592;  --col-fri-2:#FC8A57;       /* Friday column header gradient */
--week-pill-1:#2A4EEF; --week-pill-2:#5A1DF3;    /* "WEEK X OF 3" pill gradient */
```

Grade 7 = blue, Grade 9 = green (Grade 9 has been amber/gold and yellow/amber
in earlier revisions — it keeps changing, so don't assume any prior
conversation's color is still current; check `:root` directly). Every
`.tag`, `.session-row`, badge circle, and `.dot` in the legend derives its
color solely from `--g7`/`--g7-soft`/`--g9`/`--g9-soft` — never hardcode a
grade color inline; change these four and everything updates.

If asked to re-theme from a new reference image, sample colors the same way
(histogram/mode-color of a downscaled image, not eyeballed hex guesses) — see
the conversation history for the exact technique.

### The floating white card + background image

`.capture`'s own background is `image/bg.png` (a full-bleed illustrated
navy-to-blue backdrop with a decorative code-editor graphic baked into its
top-right corner), set as a CSS `background-image` — not `--card`/white
(`--card` is still used by the on-page toolbar's `.seg` pills, untouched) and
no longer the flat `--grad-start`→`--grad-end` gradient it replaced (that
gradient and its two `:root` variables are gone; `bg.png` supplied its own
navy→blue backdrop, so layering one under the other would have been
redundant — the image has no transparency, see below). `.head` and `.foot`
sit directly on the image; the grid/day-list content is wrapped in a `.card`
div (white, rounded, box-shadow) so it visually floats over it. `.capture`
is still `display:flex;flex-direction:column` with `.head`
and `.foot` as `flex-shrink:0` and `.card` as `flex:1;min-height:0` — same
sizing mechanism as before, just with one more nesting level (`.gridwrap`/
`.daybody` are now `flex:1` children of `.card` rather than of `.capture`
directly). This nesting doesn't change the CSS Grid alignment guarantee
described above; only colors/wrapper chrome changed.

Each day column header (`.day-head.tuesday/.wednesday/.thursday/.friday`) and
the TIME column (`.gutter-head`, `.gutter-cell`) get their own two-stop
`linear-gradient(135deg, ...)` from the `--col-*` variables above. Only the
outer two corners are rounded (`.gutter-head` top-left, `.day-head.friday`
top-right) to match the card's own `border-radius`.

### Capture background image (`image/bg.png`)

```css
.capture{
  background-image:url('../image/bg.png');
  background-size:cover;
  background-position:center;
  background-repeat:no-repeat;
  ...
}
```

`bg.png` is `1254×1254` RGB with **no alpha channel** (checked with Pillow
before wiring it up) — a square aspect ratio matching `.capture`'s own
1080×1080, so `background-size:cover` scales it down with no cropping. Being
fully opaque settled the "layer over the gradient or replace it" question
from the brief: there was nothing for the old gradient to show through, so
it was deleted rather than layered underneath (dead code makes future
theming confusing — don't keep an unreachable gradient "just in case").

**The image bakes its own decorative code-editor graphic into the top-right
corner** (a browser-panel-with-`</>`, a purple `{}` chip, an orange `</>`
chip — visually the same idea as the inline-SVG/`design_illustration.png`
decorations tried and removed twice before, except now it's pixels inside
the background image itself, not a separate DOM element — so none of the
`.head`-height-inflation concerns from those attempts apply here). That
graphic sits directly behind `.head-top-right` (the WEEK pill + SY/grade
label), and it visibly collided with the label: **`SY 2026–2027`'s text
overlapped the `{}` chip and the browser-panel's edge closely enough to be
illegible.** The WEEK pill itself was fine (it sits mostly over plain blue).
Fixed with a small opaque dark backing on `.head-sub` alone —
`background:rgba(4,10,46,.55); padding:5px 14px; border-radius:999px` —
rather than a full-corner overlay, since only that one line actually needed
it. **If `bg.png` is ever swapped for a different image, re-check this
specific collision** (crop the top-right ~200×150px of an export and look at
it) rather than assuming the existing `.head-sub` backing is still enough,
since a different image's busy region might sit somewhere else entirely (or
nowhere, making the dark backing a redundant leftover).

**Does a CSS `background-image` need the same html2canvas async-load wait as
the `<img>`-based logo/illustration attempts? No — verified, not assumed.**
The theory (background-images are resolved as part of the stylesheet, so
they're loaded well before any capture happens) was stress-tested by
navigating to a fresh page and calling `captureHTML()` **immediately**, with
zero settling delay — the worst-case scenario for a race condition. The
exported PNG still had the full background image, no blank/degraded region.
`captureHTML()` was **not** changed to add an `imagesReady()`-style wait for
CSS backgrounds — only `<img>` elements need that (see "Header logo" above).
If a future background-image ever shows up blank in an export despite this,
don't assume the theory still holds for that case — re-run the same
zero-delay stress test before reaching for a wait.

**`renderWeek()` and `renderDay()` share the gradient/card/badge/footer visual
system — keep them in sync.** Both render into the same `.head`/`.card`/`.foot`
structure (`headTop()` and `footer()` are literally shared functions), and the
day view's `.session-badge` uses the same "bare digit in a colored circle"
treatment as the week grid's `.badge-circle` (just larger, 44px vs 19px).
When you restyle one view, check the other renders correctly too — it's easy
to change `.tag`/`.badge-circle` for the grid and forget `.session-badge`/
`.session-main` needs the same treatment (or vice versa), since they're
separate CSS rules even though they express the same design intent. This
already happened once (day view briefly lagged the week grid's restyle); the
fix was applied but there's no automated check that *guarantees* the two
stay visually equivalent beyond eyeballing both exports — do that on every
change to either.

### Header logo

The eyebrow row's brand mark is `image/ACE-Logo.png` (the actual ACE circular
logo — three overlapping color circles + "ACE" text, real transparency
around the edges), inserted via `eyebrowLogo()` in `render.js`:

```js
function eyebrowLogo(){
  return `<img class="eyebrow-logo" src="image/ACE-Logo.png" alt="ACE logo">`;
}
```

Called from `headTop()`, so it's shared by both `renderWeek()` and
`renderDay()`. Styled by `.eyebrow-logo` in `styles.css` — `height:28px;
width:auto` (explicit CSS height, not an HTML `height` attribute, and not
`position:absolute` — it's a normal inline-flow flex item inside
`.eyebrow-row`, sized to the eyebrow text's rough line height).

This is the **third** thing that's occupied `.head`'s top-right/eyebrow area
(an inline SVG code-editor graphic, then a removed `design_illustration.png`
top-right corner illustration, now this logo replacing what used to be a
generic `</>` SVG icon before "ARALINKS CODING EDUCATION"). Two lessons from
the earlier attempts still apply and were re-verified for this one:

1. **A `position:absolute` element inside `.head` can inflate `.head`'s own
   flow height** if it's sized via HTML `width`/`height` *attributes* rather
   than CSS — this happened with the very first inline-SVG decoration
   (inflated `.head` by ~190px, starving `.card` of space and contributing
   to a cramped-rows regression). Not a risk here since `.eyebrow-logo` is
   normal-flow (not absolute) and sized with plain CSS, but still: **size
   any new header element with CSS `width`/`height`, and re-measure `.head`'s
   `getBoundingClientRect().height` before/after** to confirm it didn't grow.
2. **`<img>` elements need an explicit load-wait before `html2canvas`
   captures them.** `exportCapture.innerHTML = html` creates a *fresh*
   `<img>` node every capture — even a browser-cached image needs to finish
   loading/decoding again, and html2canvas can rasterize before that
   happens, producing a blank logo in the actual downloaded PNG while the
   live preview looks fine (the image "pops in" a moment later, unnoticed).
   Fixed by `imagesReady(container)` in `export.js` (resolves once every
   `<img>` in the container is `.complete` or has fired `load`/`error`),
   awaited in `captureHTML()` alongside the font-ready wait. **Any future
   `<img>` added to the exported markup is automatically covered by this
   same wait** since it walks all `<img>`s in the container — but always
   verify an actual downloaded PNG when adding one, not just a Playwright
   screenshot of the live preview (they can genuinely differ).

### The card/pill/row-cramping regression (read before touching `.card`/`.tag`/`.head` spacing)

The initial restyle shipped three compounding bugs, none of which the
alignment/no-overflow checks below caught:

1. **`.card{margin:28px 56px 0;}`** — three-value shorthand left `margin-bottom`
   at `0`. The card had no visible gap (or shadow, since a shadow needs room
   to fall into) before the footer. Fixed by giving it explicit margin on all
   four sides (`24px 56px 32px` currently).
2. **`.tag` could be flex-stretched shorter than its own two-line content.**
   `.day-cell{align-items:stretch}` sizes each `.tag` to the CSS Grid row's
   `1fr` share, *not* to the tag's content height. With the header illustration
   still inflating `.head` (bug #1 above) there wasn't enough room per row for
   badge + activity + "Session N", so the `.tag`'s pastel background/rounded
   corners only covered as much as fit (usually just the first line) while
   the overflow text — Session N, or the tail of a cramped row — visually
   spilled out **unstyled** onto the plain white cell background below.
   That's what read as "a stray '(' sliver + broken pill": the border-left
   and background were rendering correctly, just on a box far shorter than
   the two lines of text it was supposed to contain.
3. **No test caught it** because `#capture`'s own `scrollHeight === clientHeight`
   check only detects overflow at the *top-level* capture square. Content that
   overflows a `.tag` (or a `.session-row`) bleeds into the row below or gets
   silently clipped by `.card`'s `overflow:hidden` — neither changes
   `#capture`'s own scroll size. **Any new layout check must also assert
   `el.scrollHeight <= el.clientHeight` on the actual content boxes**
   (`.tag`, `.session-row`), not just on `#capture` — see the verification
   script's "no tag content clipped" / "no session-row content clipped" checks.

Fix, besides removing the illustration (above) and the margin fix (#1): the
`.tag`/`.badge-circle`/`.day-cell` paddings and gaps were trimmed (badge
22px→19px, tag padding 8px→6px, gap 3px→2px, day-cell padding 6px→4px) to
build in a safety margin, since even after recovering the header space, week
1's 13-row grid leaves only ~49px per row. **If you add anything to `.tag`
(a third line, a longer badge, more padding), re-run the content-fit checks
across all 3 weeks — week 1 has the most rows (13) and is the tightest fit.**

### Header top row (shared by both view modes)

`headTop(weekNum, subLabel)` renders the whole `.head-top` flex row and is
called from both `renderWeek()` and `renderDay()`:

- Left: the `</> ARALINKS CODING EDUCATION | ONBOARDING SESSION` eyebrow row.
- Right (`.head-top-right`, a right-aligned flex column): the "WEEK X OF 3"
  pill stacked above `subLabel` — plain small cyan/white text (not a pill),
  e.g. `SY 2026–2027 • Grade 7 & Grade 9` for week mode or
  `July 7 • Grade 7 & Grade 9` for day mode. `subLabel` is pre-built HTML
  (the `.sy`/`.sep`/`.gr` spans) passed in by the caller since its content
  differs between the two view modes — `headTop()` itself doesn't know
  about `gradeLabel()`/`WEEK_DATES`/`DAY_DATES`.

This label used to sit left-aligned under the headline (`.headline` +
`.head-sub` as separate siblings in `.head`). It moved into the top-right
column by request; `.headline`'s margin is now `0` (was `22px 0 10px`) —
see the two bugs below for why. Before moving anything in/out of `.head`,
measure the eyebrow row's and `.head-top-right`'s rendered widths
(`getBoundingClientRect()`) to confirm they don't collide — at the current
font sizes there's a ~175px gap between them, but that's not guaranteed to
hold if the eyebrow text, brand name, or label copy changes length.

**Two layout bugs this move introduced, both caught only by actually
measuring/screenshotting the result, not by the checks below:**

1. **`.head-top{align-items:center}` misaligned the eyebrow row against the
   pill.** `.head-top-right` became a *two-row stack* (pill + subLabel) once
   the label moved there, making it taller than the single-line eyebrow row.
   `align-items:center` centers each flex child within the tallest child's
   box, so the short eyebrow row got centered against the now-taller stack
   instead of lining up with the pill's top — it visibly sat lower than the
   pill. Fixed by changing `.head-top` to `align-items:flex-start`. If you
   change what's inside `.head-top-right` again (add a third line, remove
   the label), re-check this alignment — `flex-start` is only "correct"
   because the pill happens to be first in the stack.
2. **`.headline`'s old `margin-top:22px` assumed `.head-top` was still
   single-line-tall.** With `.head-top-right` now 60px tall (pill + gap +
   label) instead of ~35px (pill alone), and the short eyebrow row sitting
   at the top of that taller box, there's already ~40px of dead space below
   the eyebrow row's own text before `.head-top`'s box ends — adding the old
   22px margin on top of that produced a 62px gap between "ONBOARDING
   SESSION" and the headline, visibly too much (reported as "the header is
   off" / "too much gap between text lines"). Fixed by removing the margin
   entirely (`margin:0`), which lands the gap around 40px — close to the
   24px gap already used between the headline and `.card`. **The lesson:
   any margin tuned for one `.head-top` content-height will look wrong if
   `.head-top-right`'s content height changes — re-measure the actual gap
   (`headline.top - eyebrowRow.bottom`) after touching either, don't reuse
   the old margin value.**

The WEEK pill is a deliberate *addition* to day-mode's exported header (the
original day view never showed a week number, only the specific date +
grade) — added for visual consistency between the two modes, using
`weekNum` that was already a parameter of `renderDay()`. None of this
changes any state, filtering, or session data.

### Footer

`footer(weekNum, day)` renders two pills: `.legend-pill` (white, the
Grade 7/9 color-dot legend — same show/hide-by-filter logic as before) and
`.date-pill` (dark navy, gold text, small calendar icon, the date range
upper-cased with `, 2026` appended, e.g. `JULY 7–10, 2026` for week mode or
`JULY 7, 2026` for day mode). This replaced the old `.legend` + `.pageind`
text row; the day-name-plus-date text `.pageind` used to show (e.g.
`Tuesday · July 7`) is no longer duplicated in the footer since the day name
is already the big headline — no information was dropped, just relocated.

### Export / batch download

- **Single download** (`#downloadBtn`): captures the current view
  (`state.mode` + `state.week`/`state.day` + `state.grade`) at 1080×1080,
  2x pixel density (`scale:2` in the html2canvas call → 2160×2160 PNG).
- **Batch download** (`#downloadAllBtn`): loops over all 3 weeks (week mode)
  or all 3×4 = 12 week/day combos (day mode) at the *currently selected grade
  filter*, captures each into `#exportCapture` sequentially (must be
  sequential, not `Promise.all` — only one export node exists), collects
  `Blob`s into a `JSZip`, and downloads one `.zip`.
- Both paths funnel through `captureHTML(html)`, which writes to
  `#exportCapture`, waits on `document.fonts.ready` **and** `imagesReady()`
  (all `<img>`s loaded/decoded — see the "Header logo" note above) + a 50ms
  buffer, so html2canvas doesn't rasterize with fallback fonts or blank
  image placeholders, then calls `html2canvas`. **Reuse this helper for any
  new export feature** rather than calling `html2canvas` directly.
- Both paths call `render()` in their `finally` block to restore the on-screen
  preview, since `captureHTML` overwrites the shared `#exportCapture` node
  (and, for single-download, `state` doesn't change, but the export node's
  content did get clobbered by batch jobs — `render()` puts it back).

## Verification checklist (do this, don't just visually skim)

This app has been through several rounds of "looks fine but isn't" bugs
(misaligned grid rows, broken exports from the transform issue). When you
change layout or export logic, verify programmatically with Playwright rather
than trusting a screenshot:

```python
# Row alignment: every cell in a row must share identical top/bottom
data = page.evaluate('''() => {
  const cells = Array.from(document.querySelectorAll('#capture .gutter-cell, #capture .day-cell'));
  return cells.map(c => { const r = c.getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom)}; });
}''')
rows = [data[i:i+5] for i in range(0, len(data), 5)]  # 5 = gutter + 4 days
assert all(len({c['top'] for c in row}) == 1 and len({c['bottom'] for c in row}) == 1 for row in rows)

# No overflow inside the 1080x1080 square (top-level only — see caveat below)
info = page.evaluate('''() => { const c=document.getElementById('capture'); return {sh:c.scrollHeight, ch:c.clientHeight}; }''')
assert info['sh'] == info['ch'] == 1080

# Content-fit: catches clipping the check above CANNOT see (content clipped by
# a nested overflow:hidden, or bleeding into the next row, never changes
# #capture's own scrollHeight). Check this on every .tag and .session-row,
# not just #capture — this is the check that would have caught the
# card/pill/row-cramping regression documented above.
fit = page.evaluate('''() => Array.from(document.querySelectorAll('#capture .tag, #capture .session-row'))
  .map(el => ({scrollH: el.scrollHeight, clientH: el.clientHeight}))''')
assert all(el['scrollH'] <= el['clientH'] for el in fit)

# Actual export integrity (needs local html2canvas/JSZip copies, see above)
with page.expect_download() as dl: page.click('#downloadBtn')
# then open the PNG with Pillow and check size == (2160,2160) and std() > ~50 (not a blank canvas)

# Header logo specifically: crop just that region and check it has real
# variance, not just gradient background — catches the html2canvas+<img>
# load-race bug (logo present in a live-preview screenshot, blank in the
# actual downloaded PNG). .eyebrow-logo is native (56,44)-(85.5,72);
# at 2x export scale that's roughly (112,88)-(171,144).
logo_region = np.array(downloaded_png.crop((105, 80, 180, 150)).convert("L"), dtype=float)
assert logo_region.std() > 15

# .capture's background-image similarly: a textured region left of the card
# (bottom-left glow, avoiding any text) should show real variance, not a flat
# fallback color, in case the background-image ever silently fails to load.
bg_region = np.array(downloaded_png.crop((0, 1700, 250, 1900)).convert("L"), dtype=float)
assert bg_region.std() > 20
```

Run these across all 3 weeks, all 4 days, and all 3 grade filters when
changing anything layout- or export-related — that's 3 + 12 = 15 view states
× 3 grade filters = 45 combinations if you're being thorough; at minimum
spot-check week 1/2/3 and one day per week. Week 1 (13 unique time slots) is
the tightest fit for the content-fit check — always include it.

## Things intentionally NOT built

- No backend, no persistence, no database — it's a static file.
- No Monday column (data never uses it).
- No localStorage/sessionStorage (would break inside the artifact preview
  environment this was originally built in — keep everything in JS memory /
  the DOM).
- No build tooling, no bundler, no npm scripts, no framework, no
  `import`/`export` module syntax. The project is split into files for
  editability, but it must stay double-click-to-open (or one static-file
  server) simple — a non-developer end user (a school coding facilitator)
  runs this, not a dev environment. If you're tempted to add a bundler or
  convert the scripts to ES modules, check with the user first.

## Style conventions

- Vanilla JS, template literals for HTML generation, no framework.
- CSS custom properties in `:root` for the whole palette — never hardcode a
  hex color inline in new markup; add/reuse a `--variable`.
- Font roles are fixed: Space Grotesk = display/headlines, Inter = body/labels,
  IBM Plex Mono = anything time-, code-, or number-flavored (times, badges,
  session counts, the eyebrow label). Keep new UI consistent with this.
