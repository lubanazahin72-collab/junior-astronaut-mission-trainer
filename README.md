# 🚀 Junior Astronaut Mission Trainer

A **NASA-informed educational simulation** (Stage 1 prototype). Plan a Moon mission,
manage limited resources, and learn through mission decisions and consequences —
not by answering questions.

> NASA-informed educational simulation. Mission values, resource values, and outcomes
> are simplified for learning and do not represent an actual NASA flight plan.

## Gameplay loop

**Intro → Astronaut Preparation Bay (avatar + 5 readiness checks) → Cargo
Loading (75 kg limit) → Fuel & Delta-v Planner (+ Test Engine) → Earth-to-Moon
launch → Moon Event 1: Dust/Power → Moon Event 2: Water Leak → Moon Event 3:
Radiation Alert → Moon Event 4: Thermal Control → MOON MISSION REPORT →
Restart**

All four Moon events are **interactive simulations** (switches, battery modes,
valves, repair kits, shelter and suit-cooling consoles) with live simulated
consequences — never multiple-choice questions. A persistent HUD (Score,
astronaut, Moon Day, Power / Water / Suit / Comms) tracks the mission across
the events; each survived event adds **+25 score** (max 100). Failing an event
ends the mission respectfully and offers Restart / Mission Report.

## Tech stack

- **Next.js 15** (App Router) + **React 19**
- **Tailwind CSS 4** (theme tokens + custom scene CSS)
- **zustand** — mission state store (full reset on restart)
- **framer-motion** — screen transitions, rocket flight, outcome stamps
- **lucide-react** + emoji/SVG/CSS art (no external images)
- Local static data only — no backend, no database, no NASA API

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Open the printed local URL (default `http://localhost:3000`; if that port is busy,
Next.js prints the port it used, e.g. `3002`).

Production build: `npm run build`, then `npm run start`.

## Successful mission test path

1. **Start Mission** → Preparation Bay: pick an astronaut, run all **five
   readiness checks** (Spacesuit, Helmet/Visor, O2, Comms, Medical) → badges
   stack onto the avatar → **Open Cargo Bay**.
2. **Cargo**: select **Solar Panel + Battery + Water Recycling System +
   Repair Kit** (65 / 75 kg) → **Continue to Launch Planner**.
3. **Planner**: default 450 kg fuel shows a red *LAUNCH PLAN UNSAFE* banner and a
   disabled launch button. Raise propellant to **≥ 1480 kg** → green
   *MISSION PLAN APPROVED* → try **Test Engine** (flame, rocket rises, fuel and
   mass meters drop) → **Begin Launch Sequence**.
4. **Launch**: watch the transit (astronaut riding along, flame particles, live
   thrust/propellant meters), press **🌙 Arrive at Moon** at any time.
5. **Moon Event 1 (dust/power)**: dust drives solar output 100% → 45%. Switch
   battery to **⚡ Emergency Reserve**, power **OFF** Research Lab, Decorative
   Lights, Entertainment Display; keep **Oxygen Life Support** and **Water
   Recycling** **ON**. Grid stabilizes ~62% → **HABITAT STABLE** (+25) → debrief.
6. **Moon Event 2 (water leak)**: press **Isolate Damaged Line** (Close Main
   Valve is an optional safety step), then **Use Repair Kit**. Droplets stop,
   the seal patch appears → **WATER SYSTEM RESTORED** (+25) → debrief.
7. **Moon Event 3 (radiation)**: **Stop EVA** → **Return to Habitat** →
   **Enter Shielded Shelter** → **Activate Radiation Monitor** → shelter glows
   blue, meter falls → **CREW SHIELDED** (+25) → debrief.
8. **Moon Event 4 (thermal)**: **Move to Shade** (or Return to Habitat) →
   **Increase Suit Cooling** → temperature settles near 26°C →
   **SUIT TEMPERATURE STABLE** (+25) → debrief.
9. **MOON MISSION REPORT** shows **MOON MISSION SUCCESSFUL**, **100 / 100**,
   six green status cards, learning outcomes, and NASA sources.
   **Restart Mission** resets every value.

## Failure / review test path (examples)

- **Prep gap:** skip the Repair Kit (e.g. carry Solar Panel + Battery + Water
  Recycling = 55 kg). In Moon Event 2 you can isolate the line but never seal it —
  the reserve drains until mission control ends the event for review.
- **Prep gap:** skip the Solar Panel *or* Battery. Moon Event 1 shows
  "Required recovery capability unavailable" and the grid collapses →
  **MISSION FAILED** debrief with Restart / Report options.
- **Bad power strategy:** leave non-critical systems ON → the battery drains
  fast, power keeps dropping → review. Switch off a life-support system → a
  serious life-support warning, and the exercise ends in review if it stays off.
- **Bad leak procedure:** press **Use Repair Kit** *before* isolating → "PARTIAL
  REPAIR" warning, the patch only slows the leak. **Open Backup Tank** → the
  shared reserve drains faster and the leak is unaffected. **Ignore Alert** →
  reserve keeps falling.
- **Radiation alert:** press **Continue Surface Work** or never reach the
  shelter → the meter climbs past the exposure limit → **EXPOSURE RISK**.
- **Thermal alert:** **Ignore Thermal Warning** or **Reduce Suit Cooling** in
  direct sunlight → temperature crosses the 40°C redline → **THERMAL CRITICAL**.
- **Launch planner:** try launching at 450 kg fuel — the button stays disabled
  until you add propellant or reduce payload.

Every path ends in a **Mission Debrief** (system response, what happened, why it
matters, NASA-informed fact, recommended procedure, learning outcome). A failed
event marks the mission failed; the debrief offers **Restart Mission**,
**Mission Report**, and **Back to Intro**, and the report lists every area to
review. No score/quiz language anywhere.

## Science note on the fuel range

With an exhaust velocity of 4500 m/s and a 9400 m/s delta-v requirement, the
ideal rocket equation (NASA Glenn — *Ideal Rocket Equation*) makes a 700 kg fuel
cap physically impossible: ~85–90% of liftoff mass must be propellant, exactly
like real rockets. The planner's slider therefore extends to 1600 kg so a safe
mass ratio is reachable and the payload-vs-propellant trade-off stays honest.

## Project structure

```
app/
  layout.jsx            # fonts, metadata, space background
  page.jsx              # screen router (zustand screen key + framer-motion)
  globals.css           # Tailwind 4 theme tokens + scene animations
components/
  Starfield.jsx         # animated starfield (deterministic, SSR-safe)
  Rocket.jsx            # SVG rocket
  AstronautAvatar.jsx   # reusable avatar (HUD, prep bay, launch, report)
  HudBar.jsx            # persistent event HUD: score/day/power/water/suit/comms
  EngineTest.jsx        # "Test Engine" micro-simulation (flame + meters + badge)
  LogConsole.jsx        # mission-control log + useLog hook
  ui/                   # Panel, Meter, Banner, FactCard, StepsRail,
                        # ToggleSwitch, Chips
  screens/              # Intro, PrepBay, Prepare, Planner, Launch,
                        # PowerEvent, WaterEvent, RadiationEvent,
                        # ThermalEvent, Debrief, Report
lib/
  constants.js          # simulation tuning + fuel-range science note
  astronaut.js          # avatar catalog + 5 readiness checks
  equipment.js          # cargo catalog (weights, purpose, learning link)
  facts.js              # NASA-informed facts (6 topics), 6 sources, disclaimer
  events.js             # 4 Moon event scenarios, systems, debrief content
  physics.js            # simplified ideal rocket equation (delta-v)
  store.js              # zustand global gameState + actions + full restart
  utils.js              # cn(), clamp(), fmt(), seeded PRNG
```
