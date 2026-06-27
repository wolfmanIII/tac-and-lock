# Tac & Lock — Field Manual

**Version 1.0.0** · 2300AD Space Combat Simulator

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
11. [Missiles](#11-missiles)
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
| **Attack** | Each ship in initiative order fires weapons or launches missiles. |
| **Actions** | Each ship in initiative order performs one crew action. |

At the end of Actions, the round counter increments and the sequence repeats from Manoeuvre.

---

## 4. Setup Phase

Right-click the background → **Add ship**. A modal opens:

| Field | Notes |
| ----- | ----- |
| Profile | Which saved ship profile to use. |
| Faction | Players / NPC / Neutral — determines card colour coding. |
| Initial Range Band | The starting distance from all other ships (usually Long). |

Ships are shown as bento cards grouped by faction. Each card shows hull bar, TAC Speed, armour, effective signature, weapons, critical tracks, and inbound missile ETA.

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
| Leading Fire | +leadingFireDm (Captain action this round) |
| Weapon trait Accurate | +1 |
| Weapon trait Slow | −2 |
| Evasion | evasionDm (negative, defender reaction) |
| Captain assist | Difficult (10+) Tactics(naval) INT |

**Hit = total ≥ 10. Effect = total − 10.**

Stationary targets (reaction drive off, in orbit): DM+2, damage doubled. // B3 p.56

### Damage

Weapon damage is rolled and reduced by the target's Armour (+ any active sandArmourBonus from Deploy Sand).
Net damage is applied to Hull Points.

| Weapon trait | Effect |
| ------------ | ------ |
| Advanced | +1 damage per die |
| Obsolete | −1 damage per die |
| AP X | Ignores X points of Armour |

---

## 8. Attack Step — Reactions

The defender can declare reactions before each attack roll.

### Evasive Action

Declared before Step 3 (or at any reaction point). The defending ship spends **1 TAC Speed** to apply **DM−(Pilot skill + TAC Speed spent)** to the attack.

### Point Defence

Declared against a missile salvo arriving at this ship. Gunner makes a **Difficult (10+) Gunner** check. On success, **Effect missiles** (min 1) are removed from the salvo. If count reaches 0, the salvo is destroyed.

Quinn Type 17 PDC has the **Point Defence** trait: DM+2 vs missiles, drones, and fighters.

### Deploy Sand

Declared against a laser attack. **Automatic — no roll required.** Each sandcaster deployed adds **+1 Armour** against that one attack. The bonus is consumed immediately after the attack resolves.

---

## 9. Actions Step — Crew Actions

Each ship in initiative order may perform one crew action. Right-click a ship → **Crew Action…**

Select the action type, choose applicable target/options, roll (if required), then click **APPLY RESULT**.

### Captain

| Action | Check | Effect |
| ------ | ----- | ------ |
| **Leading Fire** | Average (8+) Tactics(naval) INT | All gunners on this ship gain DM+1 this round. Effect ≥ 4 → DM+2. Resets at round end. |

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

| Action | Check | Effect |
| ------ | ----- | ------ |
| **Point Defence** | Difficult (10+) Gunner DEX | Pick an incoming salvo. Effect missiles (min 1) destroyed. Salvo removed if count = 0. |
| **Deploy Sand** | Automatic | Adds +1 sandArmourBonus to this ship. Applied vs the next incoming attack, then consumed. |
| **Evasive Action** | Automatic | Spend 1 TAC Speed → apply evasionDm to attacks this round. |

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

## 11. Missiles

### Launching

Right-click attacker → **Launch Missiles…** Select a target and salvo size (1–6 missiles).

The salvo enters the **Missile Tracker** with estimated rounds to impact (based on current range band).
Each round the salvo advances one band closer to the target.

### In-Flight Countermeasures

| Method | Who | Effect |
| ------ | --- | ------ |
| **Point Defence** (reaction) | Defender, Attack step | Gunner check — destroys Effect missiles (min 1) from an arriving salvo |
| **Point Defence** (crew action) | Defender, Actions step | Same mechanic — picks any in-flight salvo targeting this ship |
| **Electronic Warfare** | Sensor operator, Actions step | Increases target Signature (makes salvo easier to intercept); does not directly destroy missiles |

### Impact Resolution

When a salvo reaches Adjacent range, a **⚡ MISSILE IMPACT** modal opens.

Roll 2D + attack DM vs 8+. On a hit, roll weapon damage − target Armour.

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

*Tac & Lock v1.0.0 — © 2300AD: Mongoose Publishing. VTT tool for personal use at the gaming table.*
