# TAC & LOCK — Space Combat Simulator

> Virtual tabletop tool for **2300AD** space combat.  
> GM-operated · browser-only · no installation required.

Implements the core space combat rules from the **Traveller 2022 Core Rulebook** (pp.160–175),
adapted for the **2300AD** universe (Mongoose Publishing, 2021).

---

## Features

| Feature | Description |
| --- | --- |
| **Range band combat** | 7 distance bands (Adjacent → Distant); no hex grid — all spatial relationships tracked per ship pair |
| **Ship profiles** | Full CRUD — create, edit, duplicate, delete (with confirmation); weapon turrets and bays |
| **Bento card view** | Ships shown as bento cards grouped by faction; hull bar (green→yellow→red), thrust, armour, weapons, criticals, missile ETA |
| **Manoeuvre step** | Approach/flee controls per ship pair; accumulated thrust pool carries across rounds until band changes (Trav2022 CRB p.166) |
| **Initiative** | 2D6 + Pilot + Thrust [+ Tactics Effect]; optional Tactics (naval) check; player ships manual entry, NPC auto-rolled |
| **Attack resolution** | 4-step flow: weapon/target/range config → 2D6 roll → damage → critical; range DMs automatic from stored band |
| **Reactions** | Defender reacts before each attack: Evasive Action (Thrust → DM −Pilot skill), Point Defence (Gunner check, removes missiles), Disperse Sand (Gunner check, +1D+Effect armour vs laser) |
| **Missile system** | Launch salvos (count stepper); missiles tracked with ETA in rounds; contromisure via Electronic Warfare (10+, Effect removes missiles); Point Defence at impact |
| **Crew assignments** | Assign named crew members to roles (Pilot, Captain, Engineer, Sensor Operator, Turret/Bay Gunner, Marine); unassigned roles contribute 0 |
| **Crew actions** | Actions phase: Sensor Lock (8+, DM+2), Electronic Warfare (break lock / counter missile), Overload Drive (10+, +1 Thrust), Overload Plant (10+, +10% Power), Offline System, Repair System, Improve Initiative (Leadership), Boarding Action |
| **Critical hits** | Effect ≥ 6 triggers critical; 2D location roll (11 systems); severity = Effect − 5; each system has 6 severity levels with precise effects (Trav2022 CRB pp.168–170) |
| **Damage tracking** | Hull Points, armour, per-system critical tracks (6 severity bubbles); threshold criticals at each 10% hull lost |
| **Dogfight mode** | Adjacent/Close range activates dogfight (6-second rounds); opposed Pilot checks with tonnage/thrust DMs |
| **Boarding actions** | Adjacent range; 2D + modifiers vs defender; 8 outcome brackets from "attackers destroyed" to "immediate capture" |
| **Stutterwarp escape** | Engineer (stutterwarp) check to flee via stutterwarp (Difficult difficulty in combat) |
| **Phase tracker** | Setup → Initiative → Manoeuvre → Attack → Actions; HUD shows round, current actor, advance button |
| **Battle log** | Timestamped, colour-coded event log (system / move / attack / damage / action) |
| **Undo/Redo** | Snapshot-based 20-step stacks; `↩️` `↪️` buttons in HUD |
| **Session save / resume** | Export session to JSON; preview before loading |
| **Autosave** | IndexedDB autosave after every action — persists ships, missiles, log; one-click restore |
| **Player dice rolls** | Player ships enter their own 2D6; 🎲 auto-roll opt-in on all roll steps; NPC ships auto-roll |
| **Error boundary** | Global React error boundary — catches crashes, shows recovery UI |
| **Profile I/O** | Import/export ship profiles via JSON files |
| **Legal footer** | Fixed Mongoose Publishing disclaimer on all screens |

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

For a production build:

```bash
npm run build
npm run preview
```

---

## How to Use

### 1 — Prepare ship profiles

On the **Dashboard**, use the left panel to manage ship profiles:

- **+ NEW PROFILE** — crea una nuova nave (nome, stats, crew, turrets)
- **✎** — modifica profilo esistente
- **⧉** — duplica profilo
- **⊗** — elimina profilo (richiede conferma)
- **↓ IMPORT / ↑ EXPORT** — scambia profili come file JSON

Un set di profili preimpostati 2300AD viene caricato all'avvio.

### 2 — Start or resume a session

- **🔄 RESUME / ✕** — se esiste un autosave, compare una riga compatta. `🔄 RESUME` ripristina istantaneamente; `✕` pulisce IndexedDB.
- **▶ NEW SESSION** — reset stato battaglia, entra in combat view
- **↓ RESUME FROM FILE** — carica file `.json`; preview round/fase/roster prima di confermare

### 3 — In battle

**Right-click su una nave** apre il context menu con le azioni disponibili per la **fase corrente** e il **turno corrente**:

- *Manoeuvre*: Approach / Flee (coppia selezionata)
- *Attack*: Attack (slot arma → weapon/target config → roll)
- *Actions*: Crew Action (ruolo → azione → roll)
- *Sempre*: Ship Sheet, Assign Crew, Remove from battle

#### Phase flow

L'HUD (alto-sinistra) mostra round corrente e fase.

| Fase | Cosa fare |
| --- | --- |
| **Setup** | Aggiunge navi alla battaglia (scegli fascia iniziale e fazione) |
| **Initiative** | Right-click → Initiative modal (Tactics check opzionale) |
| **Manoeuvre** | Ogni nave in turno: right-click → Approach/Flee per ogni coppia avversaria |
| **Attack** | Ogni nave in turno: right-click → Attack (seleziona arma/slot; Missile Rack mostra stepper + LAUNCH) |
| **Actions** | Ogni nave in turno: right-click → Crew Action |
| **End of Round** | Click **NEXT PHASE** per il round successivo |

#### Saving a session

Nell'HUD, click **💾 SAVE** per scaricare la sessione corrente come file `.json`.
Click **🏠** per tornare alla Dashboard — modal di conferma se ci sono dati non salvati.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | React 19 + Vite 8 |
| State | Zustand 5 |
| Styling | Tailwind CSS v4 |
| Persistence | IndexedDB (autosave) + Browser File API (JSON export/import) |
| Testing | Vitest 4 + Testing Library + jsdom + fake-indexeddb |

---

## Running Tests

```bash
npm test
npm run test:watch
```

---

## Project Structure

```text
src/
├── components/
│   ├── dashboard/
│   │   ├── Dashboard.jsx         ← Pre-battle lobby (profiles + session controls)
│   │   └── useProfileImport.js   ← Hook: import profiles from file
│   ├── battle/
│   │   ├── BattleView.jsx        ← Layout principale: fascie + bento cards per nave
│   │   ├── ShipBentoCard.jsx     ← Card nave: hull bar, thrust, armi, critici, missili ETA
│   │   └── MissileTracker.jsx    ← Salvi missili in volo con round all'impatto
│   ├── modals/
│   │   ├── Modal.jsx             ← Generic modal wrapper
│   │   ├── ShipProfileModal.jsx
│   │   ├── AddShipModal.jsx
│   │   ├── ManoeuvreModal.jsx    ← Approach/flee + thrust cost per coppia
│   │   ├── AttackModal.jsx       ← Attack resolution + Reactions panel
│   │   ├── MissileLaunchModal.jsx
│   │   ├── MissileImpactModal.jsx
│   │   ├── CriticalHitModal.jsx  ← Location 2D + effetti per severity
│   │   ├── ActionModal.jsx       ← Azioni crew Actions phase
│   │   ├── CrewAssignmentModal.jsx
│   │   ├── InitiativeModal.jsx
│   │   └── ShipDetailModal.jsx
│   └── ui/
│       ├── HUD.jsx
│       ├── BattleLog.jsx
│       ├── PhaseTracker.jsx
│       ├── ContextMenu.jsx
│       ├── Tooltip.jsx
│       ├── ErrorBoundary.jsx
│       └── LegalFooter.jsx
├── hooks/
│   └── useAutosave.js
├── data/
│   ├── weapons.js
│   ├── rangeBands.js             ← 7 fascie: nome, distanza, thrustCost, attackDM
│   ├── criticalHits.js           ← Location table + effetti severity 1–6 × 11 sistemi
│   ├── crewActions.js
│   ├── software.js
│   ├── factions.js
│   └── defaultProfiles.js
├── store/
│   ├── profilesStore.js
│   ├── battleStore.js
│   └── uiStore.js
└── utils/
    ├── combat.js                 ← DM calc, damage, critical hits
    ├── rangeBands.js             ← pairKey, basicBandPool, movement logic
    ├── missiles.js               ← Lancio, ETA, contromisure, EW
    ├── crew.js
    ├── dice.js
    ├── io.js
    └── db.js
```

---

## Game Rules Reference

All mechanical calculations implement:

- **Traveller 2022 Core Rulebook** — Space combat pp.160–175
- **2300AD Core Book 1** — Skill changes p.11; stutterwarp specifics

---

## License

For personal/group use at the gaming table.  
2300AD and Traveller are © Mongoose Publishing.
