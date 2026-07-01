# Tac & Lock — Field Manual

**Version 1.1.1** · 2300AD Space Combat Simulator

---

## Table of Contents

1. [Overview](#1-overview)
2. [Dashboard](#2-dashboard)
3. [Phase Flow](#3-phase-flow)
4. [Setup Phase](#4-setup-phase)
5. [Initiative](#5-initiative)
6. [Manoeuvre Step](#6-manoeuvre-step)
7. [Attack Step — Firing Solution](#7-attack-step--firing-solution)
8. [Attack Step — Reactions](#8-attack-step--reactions)
9. [Actions Step — Crew Actions](#9-actions-step--crew-actions)
10. [Critical Hits](#10-critical-hits)
11. [Drones & Missiles](#11-drones--missiles)
12. [Boarding](#12-boarding)
13. [Signature](#13-signature)
14. [Undo / Redo](#14-undo--redo)
15. [Save & Resume](#15-save--resume)

---

## 1. Overview

**Tac & Lock** is a browser-based Virtual Tabletop (VTT) tool for running
**2300AD** space combat at the gaming table.
It is GM-operated and designed for shared-screen play — one person drives, everyone watches.

Rules source: **2300AD Core Book 3: Vehicles and Spacecraft** pp.52–62 (primary).
**Traveller 2022 Core Rulebook** is used only for internal critical hit tables (p.158–159) and weapon traits (p.75).
Where B3 and CRB diverge, **B3 wins**.

Combat uses **range bands** — no hex grid, no velocity vectors.
The seven bands (Adjacent → Distant) define all spatial relationships between ships.
Ships spend TAC Speed to move between bands.

---

## 2. Dashboard

The Dashboard is the pre-battle lobby. Left panel: ship profiles. Right panel: operations console + tactical display.

### 2.1 Ship Profiles

| Control | Action |
| ------- | ------ |
| **+ NEW PROFILE** | Create a new ship from scratch. |
| **✎ Edit** | Modify an existing profile. |
| **⧉ Duplicate** | Clone a profile as a starting point. |
| **⊗ Delete** | Remove a profile (confirmation required). |
| **↓ IMPORT** | Load profiles from a `.json` file. |
| **↑ EXPORT** | Save all profiles to a `.json` file. |
| **📖 OFFICIAL CATALOG** | Browse canonical 2300AD vessels and add them to profiles. |

### 2.2 Operations Console

| Control | Action |
| ------- | ------ |
| **▶ ENTER BATTLE** | Enter the battle screen (keeps existing roster). |
| **↓ RESUME FROM FILE** | Load a previously saved `.json` session. A preview shows the roster before you confirm. |
| **💾 SAVE** | Download the current session as `.json`. |
| **CLEAR** | Reset battle state (confirmation required). |
| **📖 FIELD MANUAL** | Opens this manual. |

### 2.3 Ship Profile Form

Each profile stores the ship's combat statistics, weapons, sensors, computer, software, and crew.

| Field | Notes |
| ----- | ----- |
| Name / Class | Display name and vessel class. |
| Hull Points | Maximum hull points. |
| Armour | Reduces incoming damage. |
| TAC Speed | Tactical Speed rating — how many band-change points the ship generates per round. |
| Signature | Base electromagnetic signature. Modified dynamically in battle. |
| Sensors | Type (Basic Military / Improved / Advanced) and DM bonus. |
| Computer | Model and bandwidth. |
| Weapons | Add weapon slots — choose from the canonical 2300AD weapon list. |
| Software | Select installed software (Fire Control, Auto-Repair, etc.). |
| Crew | Named crew members with skill ratings (Tactics, Pilot, Engineer, Gunner, Electronics). |

---

## 3. Phase Flow

Each combat round follows this sequence. The HUD shows the current round and phase. Click **NEXT PHASE ⟶** to advance.

| Phase | What happens |
| ----- | ----------- |
| **Setup** | Add ships to the battle (right-click background → Add ship). |
| **Initiative** | Roll opposed Tactics(naval) check — order fixed for the engagement. |
| **Manoeuvre** | Each ship spends TAC Speed to approach or flee. |
| **Attack** | Each ship in initiative order fires weapons, launches drones, or resolves a drone's own Firing Solution once it reaches Close/Adjacent range. |
| **Actions** | Each ship in initiative order performs one crew action. |

At the end of Actions, the round counter increments and the sequence repeats from Manoeuvre.

---

## 4. Setup Phase

Right-click the background → **Add ship**. A modal opens:

| Field | Notes |
| ----- | ----- |
| Profile | Which saved ship profile to use. |
| Faction | Players / NPC / Neutral — determines card colour coding. |
| Token Shape | Frigate / Scout / Freighter / Courier / Alien — hull silhouette shown on the bento card, pre-selected from the profile's catalog category. |
| Initial Range Band | The starting distance from all other ships (usually Long). |

Ships are shown as bento cards grouped by faction, each with a ship-token silhouette. Each card shows hull bar, TAC Speed, armour, effective signature, weapons, critical tracks, and inbound drone ETA.

Right-click a card to open the context menu. Available actions depend on phase and initiative turn.

---

## 5. Initiative

**Formula: 2D6 + Tactics(naval) + INT DM** — opposed check. // B3 p.54

The Captain (or lead tactician) of each ship makes an opposed Tactics(naval) check.
The ship with the highest total acts first. In case of a tie, re-roll.
Initiative order is fixed for the entire engagement.

**Surprise:** a surprised ship cannot act in the first round.

### How to Roll

Right-click background → **Roll Initiative**. The modal shows all ships.

| Ship | Behaviour |
| ---- | --------- |
| Player ships | Enter your 2D6 physical dice in the two fields. Select Tactics skill level and INT DM. |
| NPC ships | Auto-rolled on confirm. |
| 🎲 button | Opt-in auto-roll for player ships. |

---

## 6. Manoeuvre Step

Each ship in initiative order may spend TAC Speed to change range bands. // B3 p.52

Right-click a ship → **Manoeuvre…**

| Control | Action |
| ------- | ------ |
| **⬇ APPROACH** | Move toward the target ship (costs TAC Speed from the shared pool). |
| **⬆ FLEE** | Move away from the target ship. |
| **APPLY** | Pool meets the band cost — band shifts, TAC Speed spent. |
| **ALLOCATE** | Pool below cost — TAC Speed allocated, band unchanged. Progress bar shows % toward next change. |
| **GM SET** | Override — sets the band directly with no TAC Speed cost. Use for initial placement. |

TAC Speed **accumulates across rounds** within the same band pair. A ship that cannot cover the full cost in one round contributes partial thrust; the band changes when the pool is met.

### Band Costs // B3 p.52

| Band | Distance | TAC Speed cost |
| ---- | -------- | -------------- |
| Adjacent | < 100 km | 1 |
| Close | ≤ 150,000 km | 1 |
| Short | ≤ 300,000 km | 2 |
| Medium | ≤ 450,000 km | 5 |
| Long | ≤ 600,000 km | 10 |
| Very Long | ≤ 750,000 km | 25 |
| Distant | > 750,000 km | 50 |

TAC Speed reserved for evasion is **not** spent here — it is declared as a reaction during the Attack Step.

---

## 7. Attack Step — Firing Solution

Each ship in initiative order may attack. The attack is a **3-step task chain** — each step's positive Effect carries forward as a DM to the next step. // B3 p.56

Right-click a ship → **Attack…**

### Step 1 — Sensor Operator

**Very Difficult (12+) Electronics (sensors) INT**

| DM source | Value |
| --------- | ----- |
| Target Signature | +Signature rating |
| Sensor quality | Basic Military +0 / Improved +1 / Advanced +2 |
| Sensor Time-lag | Adjacent +1 / Close +0 / Short −1 / Medium −2 / Long −3 / Very Long −4 / Distant −5 |
| Sensor Lock (active) | +sensorLockDm |
| Target evasion | evasionDm (negative — opposed Pilot check, see §8 Evade; applies here too, not just Step 3) |
| Engineer assist | Routine (8+) Engineer(power) INT — adds Effect as DM |

### Step 2 — Pilot

**Difficult (10+) Pilot DEX**

| DM source | Value |
| --------- | ----- |
| TAC Speed available | +tacSpeedAvailable |
| Engineer assist | Routine (8+) Engineer(power) INT |
| Effect from Step 1 | Positive Effect carries forward |

### Step 3 — Gunner

**Difficult (10+) Gunner INT — target number 10+**

| DM source | Value |
| --------- | ----- |
| Fire Control software | +1 per level (Fire Control/1 = +1, /2 = +2, /3 = +3) |
| Effect from Step 2 | Positive Effect carries forward |
| EW jamming | ewEffect (negative, applied to attacker) |
| Sensor Lock | +sensorLockDm (applied on target) |
| Command (Captain) | +commandBonus, only if the Captain's Command from last round targeted `gunner_turret` (see §9) |
| Weapon trait Accurate | +1 |
| Weapon trait Slow | −2 |
| Evasion | evasionDm (negative, defender reaction — see §8 Evade) |
| Captain Tactics Assist | Optional inline roll, Difficult (10+) Tactics(naval) INT — Effect adds to this check only, distinct from Command and not persistent across rounds |

**Hit = total ≥ 10. Effect = total − 10.**

Stationary targets (reaction drive off, in orbit): DM+2, damage doubled. // B3 p.56

### Damage

Weapon damage is rolled and reduced by the target's Armour.
Net damage is applied to Hull Points.

| Weapon trait | Effect |
| ------------ | ------ |
| Advanced | +1 damage per die |
| Obsolete | −1 damage per die |
| AP X | Ignores X points of Armour |

---

## 8. Attack Step — Reactions

The defender can declare reactions before each attack roll.

### Evade

Declared during the Manoeuvre Step (right-click → Manoeuvre… → EVADE 🎲), not the Attack Step itself — but its effect lasts through the whole round. **Opposed Pilot (DEX) check** against the enemy's own Pilot check (Step 2 of the Firing Solution). // B3 p.54

| Evading pilot's Effect | Effect on all enemy Electronics(sensors) and Gunner checks |
| ----------------------- | ------------------------------------------------------------ |
| Effect 1–4 | DM−1 |
| Effect 5+ | DM−2 |
| Effect ≤ −5 | Enemy gains DM+1 |

This is **not** "remaining TAC Speed × Pilot skill" as in the Traveller CRB — it's an active opposed check. `AttackModal` reads the result automatically from `target.evasionDm` in both Step 1 and Step 3; the GM can still override manually if needed.

### Point Defence

Declared in the **Drone Attack** modal, against **one incoming drone/missile at a time** — not an abstract salvo. **Difficult (10+) Gunner (DEX)** check.

| Weapon type | DM |
| ----------- | -- |
| Conventional mount | DM−2 |
| PDC (e.g. Quinn Type 17) | DM+4 |

Success destroys that specific drone before it can attack. A PDC-equipped ship can attempt up to TL−4 separate intercepts per round (GM-tracked, not enforced automatically).

---

## 9. Actions Step — Crew Actions

Each ship in initiative order may perform one crew action. Right-click a ship → **Crew Action…**

Select the action type, choose applicable target/options, roll (if required), then click **APPLY RESULT**.

### Captain

| Action | Check | Effect |
| ------ | ----- | ------ |
| **Commands** | Average (8+) Leadership INT/SOC | Order one crew role. Effect 1–4 → DM+1, Effect 5–6 → DM+2 to their actions. Declared in this round's Actions Step, activates for the *following* round (Manoeuvre + Attack + Actions) — the current round's Manoeuvre/Attack steps have already passed. Auto-applied if targeting `gunner_turret` (Step 3 Gunner check) or `pilot` (Evade roll); for other roles the GM adds it manually. |
| **Tactics Assist** | Difficult (10+) Tactics(naval) INT | Optional inline roll inside the Attack modal's Step 3 — adds its Effect to that single Gunner check only. Distinct from Commands, stacks with it. |

### Engineer

| Action | Check | Effect |
| ------ | ----- | ------ |
| **Overload Stutterwarp** | Difficult (10+) Engineer(stutterwarp) INT | Success: TAC Speed +1 this round. Failure: critical hit on Stutterwarp system. |
| **Emergency Repair** | Average (8+) Engineer INT/EDU | *System mode*: reduce one critical hit severity by 1. *Hull mode*: restore 1 Hull Point. |

### Sensor Operator

| Action | Check | Effect |
| ------ | ----- | ------ |
| **Sensor Lock** | Average (8+) Electronics(sensors) INT | Target ship gains sensorLockDm = max(1, Effect). All attacks vs that ship gain this DM. Resets at round end. |
| **Electronic Warfare** | Average (8+) Electronics(countermeasures) INT | Jammed ship suffers DM−max(1, Effect) on all attacks. Resets at round end. |
| **EW Countermeasures** | Average (8+) Electronics(countermeasures) INT | Clears an active EW jam on this ship. |
| **Active Sensors** | Easy (6+) Electronics(sensors) | Activates active sensor sweep. Signature +1 while active (flag persists until toggled off in Ship Sheet). |

### Gunner

Point Defence moved to a reaction inside the Drone Attack modal — see §8. It is no longer a general Actions Step crew action, since it must be declared against one specific incoming drone, not chosen freely from the Actions menu.

| Action | Check | Effect |
| ------ | ----- | ------ |
| **Evasive Action** | Automatic | Spend 1 TAC Speed to reserve it for this round's Evade (see §8). |

### Mechanic / Engineer

| Action | Check | Effect |
| ------ | ----- | ------ |
| **Damage Control** | Average (8+) Mechanic INT/EDU | Pick an active hazard (fire, breach, fuel leak, radiation). Success removes it from the list. Effect ≥ 4: hazard suppressed 1D rounds (GM narration). |

### Marines / Ship's Troops

| Action | Check | Effect |
| ------ | ----- | ------ |
| **Boarding Action** | Average (8+) Gun Combat/Melee | Two-roll opposed resolution (see §12 Boarding). |
| **Repel Boarders** | Average (8+) Gun Combat/Melee | Defender's roll for boarding resolution (see §12 Boarding). |

---

## 10. Critical Hits

### Surface Fixture Damage // B3 p.58

Triggered on any hit with **Effect ≥ 3**, even if it does not penetrate armour.

Roll 2D on the Surface Fixture table:

| 2D | System | 1st Hit | 2nd Hit |
| -- | ------ | ------- | ------- |
| 2 | Fire Control | DM−2 to attack rolls | — |
| 3–4 | Weapon | −1D damage, DM−2 to attacks | Disabled |
| 5 | Sensors | DM−2 to Electronics(sensors) | — |
| 6–8 | Radiator | See Radiator rules | — |
| 9 | Sensors | DM−2 to Electronics(sensors) | — |
| 10–11 | Discharge Vanes | Disabled | Destroyed |
| 12 | Other System | Disabled | Destroyed |

### Internal Critical Hits // B3 p.58 + CRB p.158–159

Triggered when the attack Effect is ≥ 6, or when hull reaches 0.

Roll 2D for location (CRB p.158). 2300AD substitutions:
- **J-Drive → Stutterwarp Drive** (severity reduces TAC Speed by −1 per severity level)
- **M-Drive → Reaction Drive** (first crit: inoperable; second: destroyed)

### Active Hazards

Some critical hits generate ongoing hazards (fire, hull breach, fuel leak, radiation exposure).
The GM adds hazards via the **Ship Sheet → ACTIVE HAZARDS** panel.
A successful **Damage Control** action removes one hazard.

---

## 11. Drones & Missiles

2300AD B3 has no "salvo" abstraction — each drone/missile is an **individually piloted unit** that closes range on its own TAC Speed and resolves its own 3-step Firing Solution, exactly like a ship. // B3 p.55–56, p.61

### Launching

Right-click attacker → **Launch Drone…** Pick a target, a weapon (Ritage-1, Ritage-2, 'Whiskey', or a vehicle-sourced missile), and how many separate units to launch.

Each unit is tracked independently in the **Drone Tracker** with its own TAC Speed and Endurance (maximum rounds before it goes inert if it never reaches its target). Each round it closes one range band toward its target.

| Drone | TL | Damage | TAC Speed | Endurance | Traits |
| ----- | -- | ------ | --------- | --------- | ------ |
| Ritage-1 | 11 | 1D | 3 | 60 rounds (6h) | Smart |
| Ritage-2 | 12 | 5D | 4 | 40 rounds (4h) | Smart, Blast 6, Radiation — single-shot |
| 'Whiskey' | 12 | 1D laser / 3D detonation | 4 | 20 rounds (2h) | Smart; detonation mode is single-use |

### Resolving an Attack

Once a ship's own drone reaches Close/Adjacent range, right-click that ship → **Resolve drone attack…** (or click the drone in the Drone Tracker). This opens the same 3-step Firing Solution as a normal ship attack:

| Step | Who | Check | DM |
| ---- | --- | ----- | -- |
| 1 — Sensor | Sensor hand-off (no penalty) or Remote Pilot self-generated (Piloting action, DM−2) | Very Difficult (12+) | +Signature, sensor quality, time-lag |
| 2 — Position Vessel | Remote Pilot | Difficult (10+), Electronics(remote ops) DEX | +drone TAC Speed, +carry from Step 1 |
| 3 — Gunner | — | Difficult (10+) | +Fire Control, +range DM at drone's current band, +carry from Step 2, +target's reactive DMs |

### Point Defence

Resolved inline, at the top of the same modal, before the Firing Solution — one drone at a time. See §8. Success destroys that drone before it can attack.

### Impact

Damage is rolled the same way as a normal weapon hit (Effect does **not** add to damage — B3 p.56 note). After the attack resolves (hit or miss), the drone is consumed. All canonical drones are treated as single-shot in the current model; Ritage-1's multi-shot capacity mentioned in some sources is not yet implemented pending clearer confirmation of the exact mechanic.

---

## 12. Boarding

Boarding resolves in **one opposed roll per round**, continuing until one side wins or retreats.
Only at **Adjacent range** during the Actions Step.

### Attacker's Roll (Boarding Action)

2D6 + Gun Combat/Melee + modifiers.

### Defender's Roll (Repel Boarders)

2D6 + Gun Combat/Melee + modifiers.

### Modifiers

| Condition | DM |
| --------- | -- |
| Superior armour | +1 |
| Superior weapons | +1 |
| Superior skill/tactics | +2 |
| Outnumber defender | +1 |
| Vastly outnumber defender | +3 |
| Defender without assigned marines | −2 |

### Result Table (Attacker − Defender)

| Difference | Result | Hull damage |
| ---------- | ------ | ----------- |
| −7 or less | Attackers defeated; defender may counter-attack DM+4 | — |
| −4 to −6 | Attackers defeated; must retreat or are captured | — |
| −1 to −3 | Combat continues; defender DM+2 next round | 2D Hull to defending ship |
| 0 | Combat continues; no advantage | — |
| 1 to 3 | Combat continues; attacker DM+2 next round | 2D Hull to defending ship |
| 4 to 6 | Boarding succeeded; 2D rounds to pacify | 1D Hull (ignores Armour) |
| 7 or more | Immediate boarding; ship control passes to attackers | — |

The GM applies the DM carry-over manually as a modifier in the next round's boarding roll.

---

## 13. Signature

Every ship has a base **Signature** value. Used as a positive DM in enemy Electronics(sensors) checks during the Firing Solution (Step 1). // B3 p.57

The effective Signature is computed dynamically — open the **Ship Sheet** to see the breakdown and toggle conditions.

### Automatic Modifiers

| Condition | Signature DM |
| --------- | ------------ |
| Hull damage > 50% | +1 |
| Power Plant critical hit | +1 |
| EW active on this ship | +2 |

### GM Toggles (Ship Sheet → Signature Conditions)

| Condition | DM |
| --------- | -- |
| Radiators Retracted | −1 |
| Heat Sink Active | −4 |
| Solar Panels Extended | +2 |
| Spin Habitat Retracted | −1 |
| Reaction Drive Active | +4 / +6 / +8 (rockets / thrusters / nuclear) |
| Active Sensors On | +1 |
| Stealth system | −4 |

---

## 14. Undo / Redo

Every game state change pushes a snapshot to the undo stack (50-step maximum).

| Control | Action |
| ------- | ------ |
| **↩ Undo** | Restore the previous state. |
| **↪ Redo** | Re-apply an undone action. |

Both buttons appear in the HUD only when their stacks are non-empty. The battle log is not rolled back — an Undo entry is appended instead.

---

## 15. Save & Resume

### Autosave

The app autosaves to IndexedDB after every significant action. On return, click **🔄 RESUME** on the Dashboard to restore instantly.

### Manual Save

Click **💾 SAVE** in the HUD to download the full session as a `.json` file.

### Resume From File

On the Dashboard, click **↓ RESUME FROM FILE** and select a `.json` file. A preview shows the full roster before you confirm loading.

### Profile Export / Import

Ship profiles are independent from battle sessions.
Use **↑ EXPORT** and **↓ IMPORT** in the profile panel to share or back up profiles separately.

---

*Tac & Lock v1.1.1 — © 2300AD: Mongoose Publishing. VTT tool for personal use at the gaming table.*
