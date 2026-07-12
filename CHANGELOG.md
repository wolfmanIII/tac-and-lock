# Changelog

All notable changes to Tac & Lock are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).
___

## 2026-07-12

- **[#27](https://github.com/wolfmanIII/tac-and-lock/issues/27)** — Removed a fabricated failure
  clause on Overload Stutterwarp ("Boost Tac Speed"): B3 p.54 has no consequence for a failed
  roll, only a success table (already correct). The code forced a Stutterwarp critical hit on any
  failed roll and cited a "DM-2 roll on stutterwarp critical track" mechanic that doesn't exist in
  B3 — that crit-on-fail rule belongs to a different, unimplemented action ("Boost Power Output").
- **[#26](https://github.com/wolfmanIII/tac-and-lock/issues/26)** — Implemented the Firing
  Solution's Engineer assist at both Step 1 (Sensor Operator) and Step 2 (Pilot) — documented in
  CLAUDE.md but never built, only the Step 3 Captain Tactics assist existed. Step 1's assist adds
  its raw Effect as a DM (B3 gives no banded table for it, same treatment as the Captain assist);
  Step 2's adds a banded TAC Speed bonus (Effect 1–4→+1, Effect 5–6→+2) for that one Pilot check
  only — a genuinely distinct check (Engineer (power), Routine 8+) from the standalone "Boost Tac
  Speed" crew action (Engineer (stutterwarp), Difficult 10+), though it stacks for free with it.
- **[#25](https://github.com/wolfmanIII/tac-and-lock/issues/25)** — The DM−8 "no fire control"
  attack penalty was keyed to the wrong system: B3 p.62 places it in the Targeting System hardware
  table (TTA/UTES/etc.), not the separate Fire Control software table (p.44). `getFireControlDm`
  is now software-only (0/+1/+2/+3); the −8 lives in `TARGETING_SYSTEMS`'s `'none'` entry instead,
  and now also applies to both Point Defence variants (reactive and proactive, B3 explicitly says
  "including point defence"). Since most canonical weapon slots had no Targeting System assigned,
  backfilled them with Light TTA (DM 0) so default ship data stays usable.
- **[#24](https://github.com/wolfmanIII/tac-and-lock/issues/24)** — Added the "Point Defence"
  weapon trait's own DM+2 (Close range only) as a new proactive Gunner action — a single check
  against an already-tracked incoming drone/missile during the ship's own turn, distinct from the
  existing reactive intercept. Also fixed a bug found while building this: the reactive
  intercept's DM+4/−2 was computed from the incoming drone's own weapon traits instead of the
  defending ship's intercepting weapon, so a Quinn Type 17 PDC's bonus never actually applied —
  both variants now use a proper weapon-slot picker on the defender's own mounts.

## 2026-07-11

- **[#23](https://github.com/wolfmanIII/tac-and-lock/issues/23)** — Rebuilt the Internal Critical
  Hit tables to match the actual CRB source (verified against the PDF twice) instead of an
  independently-invented system: only 3 of 11 locations previously coincided with the real table,
  "Cargo" was missing, "Computer" was a fabricated location, and the Reaction Drive / Stutterwarp
  Drive substitutions were swapped (Reaction Drive needs its own binary inoperable/destroyed
  mechanic, not a severity ladder). Also implemented the real severity formula — Effect − 5, or
  previous severity + 1 if higher — replacing a flat +1-per-hit that ignored the triggering
  attack's Effect entirely.
- **[#21](https://github.com/wolfmanIII/tac-and-lock/issues/21)** — Radiation trait no longer
  bypasses armour entirely. `resolveArmour` forced armour to 0 for any weapon carrying
  `Radiation` (an invented "AP∞" reading); B3 defines Radiation as rads-only (Effect × 10), no
  armour interaction. Fixes Grape Shot, Ritage-2, and Whiskey's detonation mode, which were all
  bypassing target armour. Also fixes Defensive Screens depleting from **any** hit instead of
  laser fire only (`weapon.isLaser` now gates `depleteScreens`, matching the DM's existing gate)
  — merges and closes **[#22](https://github.com/wolfmanIII/tac-and-lock/issues/22)**, filed for
  the same screen bug.
- **[#16](https://github.com/wolfmanIII/tac-and-lock/issues/16)** — Targeting Systems (Light
  TTA/TTA/UTES/Drone Controller) added as a per-weapon-mount hardware DM, separate and stackable
  from Fire Control software. Implemented **Operate UTES Array** (Gunner Action): a UTES-equipped
  mount can develop its Firing Solution without a Sensor Operator, at the cost of a 2-round
  solution-then-fire split under this engine's Gunnery hard cap of 1 action/round.
- **[#11](https://github.com/wolfmanIII/tac-and-lock/issues/11)** — 'Auto X' weapon trait gained
  a real Single/Burst/Full Auto fire-mode selector (Burst: flat +Auto score damage, one roll;
  Full Auto: N separate damage rolls, armour applied per volley — CRB p.75, cross-referenced
  from B3 p.59). Confirmed 'Rapid Fire' (Quinn Type 17 PDC) has no numeric B3/CRB rating and
  correctly stays decorative.
- **[#19](https://github.com/wolfmanIII/tac-and-lock/issues/19)** — Crew action economy rebuilt
  around B3 p.53: each crew role now gets its own per-round action budget equal to that member's
  skill level (`buildActionBudget`), replacing the old one-action-per-ship-per-phase model.
  Gunnery is hard-capped to 1 action/round regardless of skill. The round structure collapsed
  from a fixed Manoeuvre/Attack/Actions phase cycle to three stages (setup → initiative →
  combat) with open-ended per-ship turns, ended via END SHIP'S TURN.
- **[#20](https://github.com/wolfmanIII/tac-and-lock/issues/20)** — `DroneAttackModal` now
  applies the weapon trait attack DM (Accurate +1 / Slow −2) in its Step 3 Gunner check, matching
  the behavior `AttackModal` already had. Found while implementing #13.
- **[#18](https://github.com/wolfmanIII/tac-and-lock/issues/18)** — Added the Engineer action
  "Re-route Power" (Average 8+ Engineer(power) EDU) — informational per B3 (no numeric Effect
  table given in the source), used to narrate restoring a system taken offline by a power-related
  critical.
- **[#17](https://github.com/wolfmanIII/tac-and-lock/issues/17)** — Added the Sensor Operator
  actions "Scan Target" (Routine 8+, DM−1/range band, informational) and "Improve Critical" (Very
  Difficult 12+, DM−1/range band; on success lowers the crit threshold to Effect 5+, or 4+ if the
  check itself had Effect 6+, for this ship's next shot this round).
- **[#15](https://github.com/wolfmanIII/tac-and-lock/issues/15)** — Defensive Screens modeled for
  the first time: Rating 1–3 ship field, attack-roll DM against laser weapons, per-hit
  depletion, and a Deploy/Recharge Gunner action (free first deploy, Recharge consumes a
  carried reload).
- **[#14](https://github.com/wolfmanIII/tac-and-lock/issues/14)** — The DM−8 "no fire control"
  attack-roll penalty is now actually applied when a ship has no `fire_control_N` software
  installed (previously silently resolved to DM+0).
- **[#12](https://github.com/wolfmanIII/tac-and-lock/issues/12)** — Implemented the
  stationary/reaction-drive target bonus (DM+2 attack, ×2 damage) via a GM-toggleable
  `isStationary`/`reactionDriveActive` condition — previously documented as implemented but
  absent from the code entirely.
- **[#13](https://github.com/wolfmanIII/tac-and-lock/issues/13)** — Range Modifiers table gained
  its three missing situational rows: planetary surface with atmosphere (DM−6), planetary
  surface without atmosphere (DM−4), atmospheric flight (DM−2) — now pairs correctly with the
  already-implemented Ortillery trait (DM+4 vs. planetary-surface targets).
- **[#10](https://github.com/wolfmanIII/tac-and-lock/issues/10)** — Drone Pilot checks
  (`DroneAttackModal` Step 2) now get the flat DM+2 bonus B3 grants to remote-piloted drones.
  (The DM+1 case for crewed fighters under 100 tons is not yet modeled — no such unit type exists
  in the project yet.)
- **[#9](https://github.com/wolfmanIII/tac-and-lock/issues/9)** — Emergency Repair corrected on
  three counts at once: skill Engineer → **Mechanic**, difficulty Average (8+) → **Difficult
  (10+)**, hull-mode repair 1 → **5** Hull Points.

## 2026-07-10

- **[#8](https://github.com/wolfmanIII/tac-and-lock/issues/8)** — Weapon data cleanup: dropped
  the invented `'Smart'` trait from Ritage-1/2 and Whiskey (not in B3's Combat Drones table),
  dropped the invented `'Reaction'` trait from the Quinn Type 17 PDC, and renamed `ll98` from the
  invented "LL98 Liquid Laser" to its canonical name, **Darlan LL-98**.

## 2026-07-09

- **[#7](https://github.com/wolfmanIII/tac-and-lock/issues/7)** — Added the missing canonical
  weapon: Mitraille (Grape Shot) submunition launcher, TL11, 2D damage, Auto 4/Blast 4/Radiation.
- **[#6](https://github.com/wolfmanIII/tac-and-lock/issues/6)** — Added the missing Stealth
  Signature condition (−4) — GM toggle and calculation were both entirely absent despite being
  documented.
- **[#5](https://github.com/wolfmanIII/tac-and-lock/issues/5)** — Reaction Drive Signature bonus
  now varies by drive type (rocket +4 / thruster +6 / nuclear +8) instead of a flat +4 regardless
  of type.
- **[#4](https://github.com/wolfmanIII/tac-and-lock/issues/4)** — Captain's Commands now scale
  with Leadership skill level (one command per level, each to a different crew member) instead of
  being capped at a single command per round.

## 2026-07-08

- **[#3](https://github.com/wolfmanIII/tac-and-lock/issues/3)** — Removed the invented "Sensor
  Lock" captain action, which granted a persistent flat attack DM with no B3 p.54 equivalent;
  confirmed as not implementable as-is and documented as intentionally absent.
- **[#2](https://github.com/wolfmanIII/tac-and-lock/issues/2)** — Electronic Warfare crew action
  corrected: moved from the Captain to the **Sensor Operator** role, difficulty Average (8+) →
  **Difficult (10+)**, and the DM formula fixed from an unbounded linear scale to B3's banded
  table (Effect 1–4 → DM−1, Effect ≥5 → DM−2, Effect ≤−5 → **DM+1 to the jammed ship**, a failure
  case the old formula could never produce).
- **[#1](https://github.com/wolfmanIII/tac-and-lock/issues/1)** — Movement between range bands
  is now a contested Pilot (DEX) check with TAC Speed as a fixed DM and a variable Effect-based
  outcome, replacing a fully deterministic TAC-Speed-cost-accumulation model that had no basis in
  B3.
