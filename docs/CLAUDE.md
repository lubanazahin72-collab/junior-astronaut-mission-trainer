# CLAUDE.md — Moon Mission Survival Simulation

This file guides any AI coding agent (Claude Code or similar) working on this
repository. Read this in full before touching any code.

---

## 0. Non‑Negotiable Rule

**Do NOT change, redesign, remove, or restyle the existing Intro screen.**

This includes, without exception:
- Intro layout
- Colors
- Typography
- Background
- Buttons (including the "Start Mission" button's visual style)
- Intro animation
- Existing UI style tokens (spacing, radius, shadows, font stack)
- Existing routing *out of* Intro

The only permitted change to the Intro is **what the "Start Mission" button
routes to.** Everything else in this document describes what happens *after*
that click.

Before writing any code:
1. Inspect the existing project structure.
2. Locate and read the existing Intro component and its routing.
3. Identify the existing design tokens (colors, radius, font, spacing,
   button styles, background/star/particle effects) so new screens reuse
   them exactly. Do not introduce a second design system.

---

## 1. Project Summary

A NASA-informed educational Moon-survival browser game. The experience is
**simulation-driven, not quiz/trivia-driven.** Every NASA fact must be
delivered as a short micro-copy line, a visual state change, or a debrief —
never as a reading module or multiple-choice question.

No backend, database, API key, or external API is required. All state is
client-side.

---

## 2. New Flow

```
Existing Intro (unchanged)
        │  Start Mission (unchanged button)
        ▼
Mission Preparation Bay   (astronaut prep + rocket fuel/mass + engine test)
        ▼
Moon Launch / Travel Screen (existing screen if present, lightly augmented)
        ▼
Moon Survival Events       (4 sequential interactive events)
        ▼
Final Mission Result Screen
```

Do not add a second/replacement intro screen. Do not skip or reorder stages.

---

## 3. Global State (persists across all post-Intro screens)

Create a single game-state store (e.g. React context, Zustand, or a plain
reducer — match whatever state approach the existing project already uses).

```
gameState = {
  astronaut: {
    name: string,          // selected/default avatar name
    avatarId: string,
    prep: {
      suit: boolean,
      helmet: boolean,
      oxygen: boolean,
      comms: boolean,
      medical: boolean,
    },
  },
  rocket: {
    dryMass: 120,           // kg, fixed
    payloadMass: number,    // derived from equipped gear if available, else fixed default
    fuelMass: number,       // 100–700 kg, default 450
    exhaustVelocity: 4500,  // m/s, fixed
    requiredDeltaV: 9400,   // m/s, fixed
    safetyReserve: 0.05,    // fixed
  },
  mission: {
    day: number,
    score: number,          // 0–100, +25 per survived event
    power: number,
    water: number,
    suitStatus: string,
    commsStatus: string,
    currentEventIndex: number, // 0–3
    eventResults: {
      dust: 'pending' | 'survived' | 'failed',
      water: 'pending' | 'survived' | 'failed',
      radiation: 'pending' | 'survived' | 'failed',
      thermal: 'pending' | 'survived' | 'failed',
    },
    failed: boolean,
    failureReason: string | null,
  },
}
```

**Restart Mission** must reset the entire `gameState` object back to defaults
(astronaut prep cleared, fuel back to 450, score 0, all events pending).

---

## 4. Screen 1 — Mission Preparation Bay

### 4a. Astronaut Preparation

- Astronaut stands in a prep room/launchpad scene (CSS/SVG/emoji avatar —
  reuse existing avatar asset if the project already has one).
- Five clickable equipment cards/tool icons (NOT checkboxes):
  1. Spacesuit → `SUIT READY` badge + suit glow/layer on avatar
  2. Helmet/Visor → `VISOR READY` badge
  3. Oxygen/Life-Support Check → `O2 READY` badge
  4. Communication Device → `COMMS READY` badge
  5. Medical Kit → `MEDICAL READY` badge
- Each selection: adds badge, ticks a readiness meter, small green check,
  subtle animation, visually layers onto the avatar.
- All five must be completed before the flow can proceed to fuel/launch.
- Show one small "Mission Fact" tooltip/panel (not an article):
  > "NASA astronauts train with spacesuits, spacecraft systems, medical
  > operations, exercise systems, and emergency procedures before lunar
  > missions."
  Source: NASA — Preparing for Artemis II: Training for a Mission Around the
  Moon — https://www.nasa.gov/centers-and-facilities/johnson/preparing-for-artemis-ii-training-for-a-mission-around-the-moon/

### 4b. Rocket Fuel & Mass

- After prep completes, animate the astronaut walking to the rocket and
  opening the fuel console.
- Rocket visual: payload section, propellant/fuel tank, engine section,
  flame/exhaust, fuel-loading animation, small fuel truck/pump icon.
- Fuel slider: **100–700 kg**, default **450 kg**. On change: tank fills,
  orange propellant bar grows, rocket shakes slightly.

**Formulas (simplified — label as such in the UI):**

```
finalMass         = dryRocketMass (120) + payloadMass
initialMass       = finalMass + fuelMass
achievableDeltaV  = exhaustVelocity (4500) * ln(initialMass / finalMass)
requiredWithReserve = requiredDeltaV (9400) * 1.05
safe = achievableDeltaV >= requiredWithReserve
```

Display: fuel selected, payload mass, total rocket mass, achievable Δv,
required Δv, and a safe/unsafe status.

- Unsafe → red warning: "Add propellant or reduce payload." Launch blocked.
- Safe → green "Mission Plan Approved". Launch unlocked.

### 4c. Rocket Science Micro-Simulation ("Test Engine" button)

Short animation only, no reading section:
1. Rocket full of propellant.
2. Exhaust/flame moves downward.
3. Rocket moves upward.
4. Fuel meter decreases.
5. Rocket mass meter decreases.
6. Final badge: "Burning propellant makes the rocket lighter."

Micro-copy lines (short, sequential):
- "Propellant exits backward as exhaust."
- "Rocket mass decreases during powered flight."
- "Lower mass helps the rocket continue changing velocity."

NASA fact:
> "During powered flight, rocket propellant is expelled through the nozzle,
> so the rocket mass continually changes."
Source: NASA Glenn Research Center — Ideal Rocket Equation —
https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/

Always label: **"Simplified game simulation — not an actual NASA flight
calculation."**

### 4d. Launch Button

- Enabled only when: all 5 prep items done AND fuel plan is safe.
- Reuses the existing launch/travel screen if one already exists — do not
  redesign it. Only add: small astronaut avatar near/inside rocket, fuel/mass
  indicators, and the badge "Propellant burns → Rocket mass decreases."

---

## 5. Screen 2 — Moon Survival Events

Persistent HUD at all times during events:
```
Score: X / 100
Astronaut: [name]
Moon Day: N
Power / Water / Suit / Communication status
```

Each of the 4 events is an **interactive visual simulation**, not a quiz.
Sequence per event: emergency begins → meter changes → avatar visible →
player operates controls → scene reacts → survive (+25, green status, next
event) or fail (respectful failure scene, explanation, Restart Mission
option — no graphic content).

### Event 1 — Lunar Dust & Solar Power
- Fact: Moon dust (lunar regolith) can affect equipment and operations.
  Source: NASA Science — Moon Dust — https://science.nasa.gov/moon/moon-dust/
- Solar output 100% → 45%. Power console toggles: Research Lab, Decorative
  Lights, Entertainment Display, Oxygen Life Support, Water Recycling,
  Battery Mode (Normal/Emergency Reserve).
- Success path: turn off Research Lab, Decorative Lights, Entertainment
  Display; keep Oxygen + Water Recycling ON; enable Emergency Reserve →
  power stabilizes ~60–65% → "HABITAT STABLE" (+25).
- Failure: turning off oxygen/water, or ignoring power → power keeps
  falling → "Crew Safety Critical" → Mission Failed.
- Debrief: "Dust reduced sunlight on the solar panel. Critical systems
  needed stored battery energy. Non-essential systems were turned off to
  save power." Label as simplified.

### Event 2 — Water Recycling Leak
- Fact: protecting limited water supplies matters when resupply is
  difficult. Source: NASA — A Few Things Artemis Will Teach Us About Living
  and Working on the Moon —
  https://www.nasa.gov/centers-and-facilities/goddard/a-few-things-artemis-will-teach-us-about-living-and-working-on-the-moon/
- Water 70% → falling toward 45%. Console: Close Main Valve, Isolate
  Damaged Line, Use Repair Kit, Open Backup Tank, Ignore Alert.
- Success path (order matters): Close Main Valve → Isolate Damaged Line →
  Use Repair Kit → seal patched, water stabilizes → "WATER SYSTEM RESTORED"
  (+25).
- Failure: Ignore Alert (keeps dropping); Open Backup Tank alone (drops
  faster, leak unaddressed); Repair Kit before isolation (incomplete
  repair) → critical → Mission Failed.
- Debrief: "Adding more water does not stop a leak. The damaged section
  must be isolated before repair."

### Event 3 — Solar Radiation Alert
- Fact: thin lunar atmosphere exposes the surface to solar radiation/plasma.
  Source: NASA Science — Phenomena NASA Astronauts Will Encounter at Moon's
  South Pole —
  https://science.nasa.gov/solar-system/moon/phenomena-nasa-astronauts-will-encounter-at-moons-south-pole/
- Radiation meter 20% → 75%. Console: Stop EVA, Return to Habitat, Enter
  Shielded Shelter, Activate Radiation Monitor, Continue Surface Work.
- Success path (order): Stop EVA → Return to Habitat → Enter Shielded
  Shelter → Activate Radiation Monitor → shelter glows blue, meter falls →
  "CREW SHIELDED" (+25).
- Failure: Continue Surface Work / no shelter action → meter keeps rising →
  "Radiation Exposure Risk" → Mission Failed. No graphic injury.
- Debrief: "The Moon does not have thick atmospheric shielding like Earth.
  During a radiation alert, astronauts should stop surface work and move
  to protected shelter."

### Event 4 — Extreme Temperature / Suit Cooling
- Fact: extreme temperature swings between sunlight and shadow; suits use
  thermal-control systems. Source: NASA — Artemis Spacesuits —
  https://www.nasa.gov/podcasts/houston-we-have-a-podcast/artemis-spacesuits/
- Suit temp 24°C → rising toward 39°C. Console: Increase Suit Cooling,
  Reduce Suit Cooling, Move to Shade, Return to Habitat, Ignore Thermal
  Warning.
- Success path: Move to Shade or Return to Habitat → Increase Suit Cooling
  → keep life-support active → temp settles ~26°C → "SUIT TEMPERATURE
  STABLE" (+25).
- Failure: Ignore Thermal Warning (keeps rising) or Reduce Cooling (rises
  faster) → critical → Mission Failed. Respectful visual only.
- Debrief: "Lunar sunlight and shadow can create extreme temperature
  differences. Suit thermal control and safe work locations protect the
  astronaut."

---

## 6. Final Mission Result Screen

Show:
- "MOON MISSION REPORT" header
- Astronaut avatar + name
- Final Score: X / 100
- Status cards: Astronaut Preparation, Rocket Fuel Plan, Dust/Power
  Response, Water Leak Response, Radiation Alert Response, Thermal Control
  Response
- If score = 100: Title "MOON MISSION SUCCESSFUL", subtitle "You protected
  the crew, managed limited resources, and completed the simplified Moon
  survival mission."
- If failed: Title "MISSION FAILED", subtitle "Review the emergency log,
  improve your preparation, and try again."
- Learning outcomes list (rocket mass/propellant, fuel/payload balance,
  lunar dust & power, water leak isolation, radiation shelter, thermal
  control).
- Compact NASA source links (all six sources above).
- Disclaimer: "NASA-informed educational simulation. Mission values,
  resource values, and outcomes are simplified for learning and do not
  represent an actual NASA flight plan."
- Buttons: **Restart Mission** (full state reset), **Back to Existing
  Intro** (route to unchanged Intro).

---

## 7. Visual/UI Rules for New Screens

- Reuse existing colors, border radius, typography, button style, spacing,
  and background style. Do not invent a new design system.
- CSS/SVG/icons/emoji only — no external images, no NASA logo.
- Subtle animated stars/particles/meters/glow states, consistent with
  existing UI language.
- Mobile responsive.
- Visible hover, focus, active, disabled states on all interactive
  elements.

---

## 8. Implementation Checklist

- [ ] Intro UI untouched (verify via diff before finishing)
- [ ] Start Mission button now routes into the new flow, visually unchanged
- [ ] Astronaut selection/state persists across all post-Intro screens
- [ ] All 5 prep actions gate launch availability
- [ ] Fuel slider correctly drives Δv calculation and safe/unsafe launch gate
- [ ] All 4 Moon events are interactive simulations (not MCQ/quiz)
- [ ] Score increments only on genuine survival success (+25 each, cap 100)
- [ ] Mission failure is respectful, no graphic content, explains cause
- [ ] Restart Mission resets astronaut, fuel, events, score, resources fully
- [ ] All NASA facts appear as micro-copy/tooltips/debriefs only
- [ ] No backend, DB, API key, or external network call required

---

## 9. Deliverable Format (when implementation is complete)

At the end of the implementation task, report:
1. List of files added
2. List of existing files updated
3. Run command
4. A successful mission test path (click-by-click)
5. A failure mission test path (click-by-click)
