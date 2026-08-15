# Kite Strings Studio

*A calm place to do meaningful work.*

## Manifesto

We believe creative people don't need more features. They need more clarity.

Kite Strings Studio isn't designed to manage every aspect of life. It's designed to protect attention.

- Everything has one home.
- Only today's work sits on the worktable.
- Ideas are captured without demanding action.
- Progress is measured by momentum, not busyness.
- The software should never make the user feel behind.
- When the studio closes for the day, your mind can close with it.

## Design principles

1. **Calm over clutter.** If a feature makes the interface busier without making decisions easier, it doesn't belong.
2. **Everything has one obvious home.** You should never wonder where something goes.
3. **Show only what matters now.** Future work stays safely in its room until it's time.
4. **The next move is always visible.** You should never lose twenty minutes figuring out how to begin.
5. **Capture inspiration. Don't chase it.** Ideas are welcomed; distractions are parked.
6. **Design for momentum.** Finishing one tiny task should naturally reveal the next.
7. **Build for creative minds.** No corporate jargon, no unnecessary complexity, no productivity theater.

Whenever a new feature is tempting, ask: *would this make the studio feel calmer or more chaotic?*

## Structure

- `index.html` — the **Router**: on load, checks the day of the week and sends you straight to that day's room. Runs once per visit to this page; it never re-fires once you're inside a room, so reloading mid-day never bounces you elsewhere. Weekends show a room picker instead of guessing.
- `studio-wall.html` — **Studio Wall**: five cards, one per business, each showing real status — **Last Touched** (the most recent date you actually entered something on that room's Today page), an editable **Waiting** list (what you're waiting on from others), and an editable **Ideas** list (someday/maybe thoughts) — plus a link into that room. The card for whichever business owns today gets a "Today's room" badge.
- `today-lite-run.html`, `today-ksd-client.html`, `today-ksd-templates.html`, `today-lifestyle.html`, `today-visionary.html` — the five themed Today rooms. Two-column layout: a tall Time Blocks card on the left, and a stack on the right (Big Three / Now / Upcoming combined, For The Landing, End of Day). Saved separately per business per day, with a date navigator to plan future days ahead of time. Arrowing across into a different theme day's date jumps you to that room's own page.
- `landing.html` — **The Landing**: the shared caught-thoughts list, visible and editable from every room, any day
- `css/style.css` — the design system (KSD brand palette + type). v2: navy page background (`#324376`), tan rounded cards (`#EAE8DE`), matching `KSStudio_Today_Page.ai`
- `js/today.js` — generic Today-room behavior, parameterized per business via a small inline `window.KSD_BUSINESS` config in each page
- `js/studio-wall.js` — Studio Wall card rendering and per-room mission persistence
- `js/landing-store.js` — shared storage helper for The Landing list
- `js/landing.js` — The Landing page behavior
- `assets/logo.png` — the real Kite Strings Studio logo

## Weekly rhythm

| Day | Room |
|---|---|
| Monday | Lite Run |
| Tuesday | KSD Client Work |
| Wednesday | KSD Templates |
| Thursday | KSD Lifestyle (Etsy Shop) |
| Friday | Visionary Studio |
| Weekend | Pick a room manually |

## Roadmap

- [x] Sprint 1 — Design system (palette, type, components)
- [x] Sprint 2 — Today room
- [x] Sprint 3 — Day-of-week router, five themed Today rooms, shared caught-thoughts list (The Landing), date navigator for planning ahead
- [x] Sprint 3.5 — Visual redesign to match `KSStudio_Today_Page.ai`: navy page, tan cards, two-column layout, real logo
- [x] Sprint 3.75 — Studio Wall: five business cards with editable orientation-panel missions
- [ ] Sprint 4 — Individual Room pages (per-business deep workspace, separate from the daily Today planner)
- [ ] Sprint 5 — Polish: motion, mobile refinement, maybe dark mode

## Brand

- **Colors:** tan `#EAE8DE`, lighter blue `#586BA4`, darker blue `#324376`, yellow highlight `#F5DD90`, orange `#F68E5F`
- **Type:** Roboto Slab (display) + Roboto (body/utility)
