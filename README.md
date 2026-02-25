# MARS-1 Career Portal

Single-file CV builder web app designed as a **futuristic Mars colony recruitment system** for classroom use.

Live deployment: [https://sergueivp.github.io/mars-1/](https://sergueivp.github.io/mars-1/)

## Project Idea

The project reframes a standard student CV exercise as a mission-critical application workflow:

- A dramatic sci-fi onboarding sequence (`Mission Briefing`)
- A polished SaaS-style multi-step form (LinkedIn-like clarity with dark Mars aesthetic)
- Live progress and profile completeness feedback
- Narrative time pressure via countdown timer
- Cinematic “submission to HQ” sequence
- Professional `.docx` export at the end

Goal: make CV writing engaging while practicing structured self-presentation and technical form design.

## Core Mechanics

## 1) Single-file architecture

- Entire app in `index.html`
- Inline CSS + inline JavaScript
- No backend
- Works locally in modern desktop browsers

## 2) Persistent autosave (localStorage)

Every field and dynamic section is continuously saved.

- App data key: `mars1.portal.data.v1`
- Timer data key: `mars1.portal.timer.v1`
- Save trigger: on any `input` event (plus explicit saves in dynamic builders)
- Reload behavior: restores all form content, current section, and timer state

## 3) Countdown timer narrative

- Starts at `90:00` when user clicks **ACCESS PORTAL**
- Visible at top-right on all app sections
- Color states:
- `<= 10:00` warning (amber)
- `<= 5:00` danger (red + pulse)
- At `0:00`, shows non-blocking warning overlay
- Timer never deletes data and never blocks submission

## 4) Multi-step journey (10 steps)

1. Mission Briefing (intro, typewriter effect)
2. Personal Information
3. Candidate Profile Statement
4. Academic Record
5. Field Operations Log (projects instead of work experience)
6. Technical Competency Matrix
7. Communication Protocols (languages)
8. Interpersonal Competencies
9. Preview & Review
10. Submit

Navigation rules:

- One section visible at a time
- Back/Next controls
- Inline validation for required fields (step 2)
- Auto-scroll to top between steps

## 5) Dynamic content builders

Education:

- Add/remove multiple qualification cards
- Relevant modules as removable tags
- “Present” toggle for ongoing study

Field Operations Log:

- Up to 6 project entries
- Tools/methods tags with suggestions
- Bullet-point builder:
- “What did you do?”
- “What tools/methods?”
- “What outcome?”
- Auto-combined bullet preview, editable by student

Technical Skills:

- Pre-grouped chips by category
- Click to select/deselect
- Custom skill input (Enter to add)
- Selected skills are draggable for reordering

Languages:

- Dynamic language rows (up to 6)
- Proficiency level selector with visual bar

Soft Skills:

- Multi-select list (max 5)
- Counter (`X/5 selected`)
- Optional custom soft skill field

## 6) Live previews

- Left sidebar: profile completeness percentage bar
- Right sidebar: live profile snapshot
- Step 9: full CV document-style preview card rendered from current state

## 7) Submission cinematic sequence

On submission start, form is replaced by full-screen animation:

- Phase 1 (3.5s): upload bar + rotating status messages
- Phase 2 (4s): Mars processing animation + status cycle
- Phase 3 (3s): four animated “assessment” bars (random 70–95%)
- Phase 4: HQ terminal-style transmission with typewriter text using real user data

Final actions:

- `DOWNLOAD APPLICATION (DOCX)`
- `REVIEW MY CV` (returns to preview)

## 8) DOCX export

Export uses `docx.js` in-browser and generates:

- Heading with student name
- Colony Unit ID + contact block
- Sectioned content (summary, education, projects, skills, languages, soft skills)
- Filename format: `MARS1_Application_[StudentName].docx`
- Subtle footer note: “Submitted via MARS-1 Career Portal, 2031”

CDN note:

- Required primary URL is attempted first: `https://unpkg.com/docx@8.5.0/build/index.js`
- Fallback loaders are included because that exact path currently returns 404/no-sniff blocks in modern browsers

## Design Direction

Theme: “LinkedIn layout meets NASA mission control”

- Background: `#0a0f1e`
- Panels: `#141c2e` with border `#1e2d4a`
- Accent colors: Mars orange `#e8560a` and electric blue `#0ea5e9`
- Typography: Inter
- Motion: subtle fades/slides + targeted cinematic animations
- Responsive behavior:
- Desktop: multi-column layout with sidebars
- Mobile: single-column stacked layout

## Project Files

- `index.html` - the full app (production artifact)
- `README.md` - this project guide
- `runtime-smoke.mjs` - automated browser smoke test (Chromium + Firefox)
- `package.json` / `package-lock.json` - Playwright test tooling only

## Run Locally

Option A (simple manual use):

1. Open `index.html` in Chrome or Firefox
2. Use the app normally

Option B (recommended for CDN/script behavior parity):

1. Start local server: `python3 -m http.server 4173`
2. Open `http://127.0.0.1:4173/index.html`

## Automated Runtime Smoke Test

Installed tooling: Playwright

Run:

`node runtime-smoke.mjs`

What it checks:

- End-to-end form flow
- localStorage persistence across reload
- timer restoration behavior
- submission sequence reachability
- HQ response data interpolation
- DOCX export trigger path
- browser console/page errors (with known expected primary-docx-url block filtered)

## GitHub Pages

Repository: [https://github.com/sergueivp/mars-1](https://github.com/sergueivp/mars-1)

Pages configuration:

- Source branch: `main`
- Source path: `/`
- Published URL: [https://sergueivp.github.io/mars-1/](https://sergueivp.github.io/mars-1/)

## Teaching Use

This project is well-suited for lessons on:

- UX storytelling in professional tools
- multi-step form engineering
- local-first persistence and recovery
- dynamic component rendering in vanilla JS
- accessibility basics and validation patterns
- client-side document generation

## Possible Future Enhancements

- optional JSON export/import of student progress
- printable PDF layout mode
- rubric-driven scoring overlay for instructor feedback
- localization switcher (if needed later)
