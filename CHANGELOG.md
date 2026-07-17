# Changelog

All notable changes to Tac & Lock are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).
___

## [Unreleased]

___

## [1.5.0] — 2026-07-17

Rules-fidelity fixes and features from closed GitHub issues #28–#43 and #45–#49 — the second
full audit pass against 2300AD B3 p.52–62, plus four "flag-only" findings individually
re-verified against the source PDF before being filed and fixed.

### Added

- **[#37](https://github.com/wolfmanIII/tac-and-lock/issues/37)** — Implemented **Boost Power
  Output** as a distinct Engineer action (Difficult 10+, Engineer (power) EDU): a % Power
  increase, informational since no Power resource is tracked, but with a real failure
  consequence B3 gives it and not Overload Stutterwarp — Effect ≤−5 applies an automatic
  critical hit to the Power Plant.
- **[#39](https://github.com/wolfmanIII/tac-and-lock/issues/39)** — Implemented the "disobey
  order" DM−1 penalty (B3 p.53–54): a new Crew Discipline control marks a crew member as having
  disobeyed the Captain's Command — no check, no action spent, and it doesn't count against the
  Captain's per-round Leadership cap.
- **[#45](https://github.com/wolfmanIII/tac-and-lock/issues/45)** — `gunner_bay` was assignable
  as a crew role but never actually wired into attack resolution — `AttackModal.jsx` hardcoded
  `gunner_turret` everywhere regardless of which weapon slot was firing, so no ship could ever
  fire two batteries in the same round. Added a `mount: 'turret' | 'bay'` field per weapon slot
  (editable in the profile form) and routed every skill/budget/Command lookup through it,
  including Point Defence intercept/engage.
- **[#46](https://github.com/wolfmanIII/tac-and-lock/issues/46)** — Implemented "combat ends one
  round after the range becomes Distant, if the pursuing ship cannot successfully close" (B3
  p.54, under Open). Tracked per ship-pair; informational only (log entry, a COMBAT ENDED badge
  on the DISTANCES row, and a ManoeuvreModal banner) — doesn't auto-end the battle or block
  attacks, and a GM Override always re-engages the pair.
- **[#48](https://github.com/wolfmanIII/tac-and-lock/issues/48)** — Boarding Action and Repel
  Boarders gained checkboxes for the CRB p.175 modifier list (Superior Armour/Weaponry/Skills &
  Tactics, a mutually-exclusive Numbers tier, and a defender-only "no Marines on duty"), summed
  automatically into the flat 2D6 roll instead of requiring the GM to add them up by hand.
- **[#49](https://github.com/wolfmanIII/tac-and-lock/issues/49)** — Implemented drone lightspeed
  lag (B3 p.55): a flat DM−1 to a drone's own self-generated Sensor check, Position Vessel, and
  Gunner rolls once it's Long range or farther from its **owner/controller** — distinct from the
  already-implemented Sensor Time-Lag, which is range-to-**target**. A Sensor hand-off is exempt,
  per B3's own text. New `drone.ownerBand` field grows one band per round in parallel with the
  drone closing on its target.

### Changed

- **[#28](https://github.com/wolfmanIII/tac-and-lock/issues/28)** — Captain's Commands are now
  capped at one per round per **Leadership** skill level (B3 p.54), not by the Tactics
  (naval)-based action budget they were incorrectly keyed to.

### Removed

- **[#38](https://github.com/wolfmanIII/tac-and-lock/issues/38)** — Removed "EW Countermeasures",
  an invented counter-jam action using a non-existent "Electronics (countermeasures)"
  specialization — B3's Electronic Warfare rules (p.53, p.56) name only Electronics (comms) for
  jamming and Electronics (sensors) for other EW tasks; no action to cancel an active jam exists
  in B3 p.52–62.
- **[#43](https://github.com/wolfmanIII/tac-and-lock/issues/43)** — Removed the dead "Improve
  Initiative" mechanic, which re-sorted the fixed initiative order — B3 p.54 states initiative
  order is "for the duration of the combat"; no re-sort mechanic exists in the source.

### Fixed

- **[#29](https://github.com/wolfmanIII/tac-and-lock/issues/29)** — Boarding Action was modeled
  as an Average (8+) Gun Combat/Melee opposed skill check. Trav2022 CRB p.175 ("Resolving a
  Boarding Action", referenced by B3 p.57) has no skill, no characteristic DM, and no difficulty
  threshold — it's a flat 2D + modifiers roll on both sides. Replaced the skill-check UI with a
  flat roll for both the attacker and, via Repel Boarders, the defender.
- **[#30](https://github.com/wolfmanIII/tac-and-lock/issues/30)** — Darlan G2 and Quinn Type 17
  PDC (both Range: Adjacent) fired normally at Close range instead of being out of range —
  `rangeDm.Close` corrected from 0 to −20.
- **[#31](https://github.com/wolfmanIII/tac-and-lock/issues/31)**,
  **[#32](https://github.com/wolfmanIII/tac-and-lock/issues/32)**,
  **[#33](https://github.com/wolfmanIII/tac-and-lock/issues/33)**,
  **[#34](https://github.com/wolfmanIII/tac-and-lock/issues/34)** — `DroneAttackModal` was
  missing four DM sources `AttackModal` already had, despite B3 p.55 saying drones/fighters "use
  the same Firing Solution process": the Captain's Tactics assist at Step 3, the Engineer (power)
  assist at Steps 1 and 2, the Captain's Command bonus for `remote_pilot`, and the target's
  Evasion DM at Step 1 (Step 3 already had it). Ported verbatim from `AttackModal`'s existing
  formulas.
- **[#35](https://github.com/wolfmanIII/tac-and-lock/issues/35)** — Surface Fixture Damage had a
  fabricated 3rd-hit "destroyed" tier for Fire Control, Sensors, and Weapon — B3's table only
  defines two hit tiers for those systems. Corrected to "no further effect", matching the pattern
  already used for Discharge Vanes and Other System.
- **[#36](https://github.com/wolfmanIII/tac-and-lock/issues/36)** — Documentation fix: Commands'
  difficulty was mislabeled "Average (8+)" instead of B3's actual "Routine (8+)" in Help and
  `doc/space-combat-rules.md`.
- **[#40](https://github.com/wolfmanIII/tac-and-lock/issues/40)** — Verified multi-battery
  single-sensor-check sharing (B3 p.56) is already correctly modeled by the existing per-role
  action budget (`sensor_operator` isn't capped at 1 action/round like Gunnery); documentation
  only, no code change. Uncovered the real blocker instead: see #45 above.
- **[#41](https://github.com/wolfmanIII/tac-and-lock/issues/41)** — Documentation fix: Evasion
  was widely cited as B3 p.55; the actual rule (opposed Pilot check, banded DM table) is on p.54.
- **[#42](https://github.com/wolfmanIII/tac-and-lock/issues/42)** — Documentation fix: Auto X /
  Blast X trait definitions were cited as CRB p.75 (copied from B3's own incorrect
  cross-reference); direct PDF extraction confirms the real "Weapon Traits" section is p.78.
- **[#47](https://github.com/wolfmanIII/tac-and-lock/issues/47)** — `aero12`, `kingfisher`, and
  `missile_rack` had a flat `rangeDm: 0` at every band, including Distant, unlike every other
  weapon in the file. Gave all three a graduated table matching `particle_barbette` (same
  `optimalRange: 'Long'`), the file's existing convention for weapons sharing an optimal range.

___

## [1.4.0] — 2026-07-14

### Changed

- **[#44](https://github.com/wolfmanIII/tac-and-lock/issues/44)** — Retheme: replaced the
  generic dark-sci-fi slate/zinc + neon-cyan palette (blindly reused from the sibling project
  thrust-and-drift) with a palette actually sourced from the official 2300AD sourcebooks —
  sampled directly from the core book covers and interior pages (gunmetal steel, bronze/gold
  metallic accents, warm near-black ink; no cyan/neon anywhere in the real print identity). Kept
  a dark UI, synthesized from the same sampled tones, since the books' own light parchment page
  background isn't suitable for a live-session GM HUD. Touches `src/index.css`'s `@theme` token
  block and all 28 component files; semantic status colors (danger/warning/success) unchanged.

___

## [1.3.0] — 2026-07-12

Rules-fidelity fixes and features from closed GitHub issues #4–#27, each verified against the
2300AD B3 (Core Book 3: Vehicles and Spacecraft, p.52–62) source PDF, with Trav2022 CRB used
only where B3 itself sanctions it (internal crit tables p.158–159, weapon traits p.75,
Boarding Actions p.175).

### Added

- **[#26](https://github.com/wolfmanIII/tac-and-lock/issues/26)** — Implemented the Firing
  Solution's Engineer assist at both Step 1 (Sensor Operator) and Step 2 (Pilot) — documented in
  CLAUDE.md but never built, only the Step 3 Captain Tactics assist existed. Step 1's assist adds
  its raw Effect as a DM (B3 gives no banded table for it, same treatment as the Captain assist);
  Step 2's adds a banded TAC Speed bonus (Effect 1–4→+1, Effect 5–6→+2) for that one Pilot check
  only — a genuinely distinct check (Engineer (power), Routine 8+) from the standalone "Boost Tac
  Speed" crew action (Engineer (stutterwarp), Difficult 10+), though it stacks for free with it.
- **[#24](https://github.com/wolfmanIII/tac-and-lock/issues/24)** — Added the "Point Defence"
  weapon trait's own DM+2 (Close range only) as a new proactive Gunner action — a single check
  against an already-tracked incoming drone/missile during the ship's own turn, distinct from the
  existing reactive intercept.
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
- **[#12](https://github.com/wolfmanIII/tac-and-lock/issues/12)** — Implemented the
  stationary/reaction-drive target bonus (DM+2 attack, ×2 damage) via a GM-toggleable
  `isStationary`/`reactionDriveActive` condition — previously documented as implemented but
  absent from the code entirely.
- **[#13](https://github.com/wolfmanIII/tac-and-lock/issues/13)** — Range Modifiers table gained
  its three missing situational rows: planetary surface with atmosphere (DM−6), planetary
  surface without atmosphere (DM−4), atmospheric flight (DM−2) — now pairs correctly with the
  already-implemented Ortillery trait (DM+4 vs. planetary-surface targets).
- **[#7](https://github.com/wolfmanIII/tac-and-lock/issues/7)** — Added the missing canonical
  weapon: Mitraille (Grape Shot) submunition launcher, TL11, 2D damage, Auto 4/Blast 4/Radiation.
- **[#6](https://github.com/wolfmanIII/tac-and-lock/issues/6)** — Added the missing Stealth
  Signature condition (−4) — GM toggle and calculation were both entirely absent despite being
  documented.

### Changed

- **[#19](https://github.com/wolfmanIII/tac-and-lock/issues/19)** — Crew action economy rebuilt
  around B3 p.53: each crew role now gets its own per-round action budget equal to that member's
  skill level (`buildActionBudget`), replacing the old one-action-per-ship-per-phase model.
  Gunnery is hard-capped to 1 action/round regardless of skill. The round structure collapsed
  from a fixed Manoeuvre/Attack/Actions phase cycle to three stages (setup → initiative →
  combat) with open-ended per-ship turns, ended via END SHIP'S TURN.

### Fixed

- **[#27](https://github.com/wolfmanIII/tac-and-lock/issues/27)** — Removed a fabricated failure
  clause on Overload Stutterwarp ("Boost Tac Speed"): B3 p.54 has no consequence for a failed
  roll, only a success table (already correct). The code forced a Stutterwarp critical hit on any
  failed roll and cited a "DM-2 roll on stutterwarp critical track" mechanic that doesn't exist in
  B3 — that crit-on-fail rule belongs to a different, unimplemented action ("Boost Power Output").
- **[#25](https://github.com/wolfmanIII/tac-and-lock/issues/25)** — The DM−8 "no fire control"
  attack penalty was keyed to the wrong system: B3 p.62 places it in the Targeting System hardware
  table (TTA/UTES/etc.), not the separate Fire Control software table (p.44). `getFireControlDm`
  is now software-only (0/+1/+2/+3); the −8 lives in `TARGETING_SYSTEMS`'s `'none'` entry instead,
  and now also applies to both Point Defence variants (reactive and proactive, B3 explicitly says
  "including point defence"). Since most canonical weapon slots had no Targeting System assigned,
  backfilled them with Light TTA (DM 0) so default ship data stays usable.
- **[#24](https://github.com/wolfmanIII/tac-and-lock/issues/24)** — Fixed a bug found while
  building the new engage action above: the reactive intercept's DM+4/−2 was computed from the
  incoming drone's own weapon traits instead of the defending ship's intercepting weapon, so a
  Quinn Type 17 PDC's bonus never actually applied — both variants now use a proper weapon-slot
  picker on the defender's own mounts.
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
- **[#20](https://github.com/wolfmanIII/tac-and-lock/issues/20)** — `DroneAttackModal` now
  applies the weapon trait attack DM (Accurate +1 / Slow −2) in its Step 3 Gunner check, matching
  the behavior `AttackModal` already had. Found while implementing #13.
- **[#14](https://github.com/wolfmanIII/tac-and-lock/issues/14)** — The DM−8 "no fire control"
  attack-roll penalty is now actually applied when a ship has no `fire_control_N` software
  installed (previously silently resolved to DM+0).
- **[#10](https://github.com/wolfmanIII/tac-and-lock/issues/10)** — Drone Pilot checks
  (`DroneAttackModal` Step 2) now get the flat DM+2 bonus B3 grants to remote-piloted drones.
  (The DM+1 case for crewed fighters under 100 tons is not yet modeled — no such unit type exists
  in the project yet.)
- **[#9](https://github.com/wolfmanIII/tac-and-lock/issues/9)** — Emergency Repair corrected on
  three counts at once: skill Engineer → **Mechanic**, difficulty Average (8+) → **Difficult
  (10+)**, hull-mode repair 1 → **5** Hull Points.
- **[#8](https://github.com/wolfmanIII/tac-and-lock/issues/8)** — Weapon data cleanup: dropped
  the invented `'Smart'` trait from Ritage-1/2 and Whiskey (not in B3's Combat Drones table),
  dropped the invented `'Reaction'` trait from the Quinn Type 17 PDC, and renamed `ll98` from the
  invented "LL98 Liquid Laser" to its canonical name, **Darlan LL-98**.
- **[#5](https://github.com/wolfmanIII/tac-and-lock/issues/5)** — Reaction Drive Signature bonus
  now varies by drive type (rocket +4 / thruster +6 / nuclear +8) instead of a flat +4 regardless
  of type.
- **[#4](https://github.com/wolfmanIII/tac-and-lock/issues/4)** — Captain's Commands now scale
  with Leadership skill level (one command per level, each to a different crew member) instead of
  being capped at a single command per round.

___

## [1.2.1] — 2026-07-09

### Removed

- **[#3](https://github.com/wolfmanIII/tac-and-lock/issues/3)** — Removed the invented "Sensor
  Lock" captain action, which granted a persistent flat attack DM with no B3 p.54 equivalent;
  confirmed as not implementable as-is and documented as intentionally absent.

### Fixed

- **[#2](https://github.com/wolfmanIII/tac-and-lock/issues/2)** — Electronic Warfare crew action
  corrected: moved from the Captain to the **Sensor Operator** role, difficulty Average (8+) →
  **Difficult (10+)**, and the DM formula fixed from an unbounded linear scale to B3's banded
  table (Effect 1–4 → DM−1, Effect ≥5 → DM−2, Effect ≤−5 → **DM+1 to the jammed ship**, a failure
  case the old formula could never produce).

___

## [1.2.0] — 2026-07-08

### Changed

- **[#1](https://github.com/wolfmanIII/tac-and-lock/issues/1)** — Movement between range bands
  is now a contested Pilot (DEX) check with TAC Speed as a fixed DM and a variable Effect-based
  outcome, replacing a fully deterministic TAC-Speed-cost-accumulation model that had no basis in
  B3.
