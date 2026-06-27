# TAC & LOCK — Space Combat Simulator

> Virtual tabletop tool for **2300AD** space combat (Mongoose Publishing, 2021).  
> GM-operated · browser-only · no installation required.

Implements the starship combat rules from **2300AD Core Book 3: Vehicles and Spacecraft** (pp.52–62) as primary source, with Traveller 2022 Core Rulebook used only for internal critical hit tables (p.158–159) and weapon traits (p.75).

---

## Features

| Feature | Description |
| --- | --- |
| **Range band combat** | 7 distance bands (Adjacent → Distant, scale light-second); no hex grid — all spatial relationships tracked per ship pair |
| **Ship profiles** | Full CRUD — create, edit, duplicate, delete; weapon turrets, sensors, computer, software, crew |
| **Bento card view** | Ships shown as bento cards grouped by faction; hull bar (green→yellow→red), TAC Speed, armour, signature, weapons, criticals, missile ETA |
| **Manoeuvre step** | Approach/flee controls per ship pair; accumulated TAC Speed pool carries across rounds until band changes // B3 p.52 |
| **Initiative** | 2D6 + Tactics(naval) + INT DM; Captain makes opposed check; order fixed for the engagement // B3 p.54 |
| **3-step Firing Solution** | Sensor Operator Very Difficult (12+) → Pilot Difficult (10+) → Gunner Difficult (10+); positive Effect carries between steps // B3 p.56 |
| **Weapon traits** | Accurate +1 / Slow −2 DM to attack; Advanced +1 / Obsolete −1 damage per die // B3 p.59 |
| **Signature modifiers** | Dynamic effective Signature: auto-computed (hull <50%, power plant crit, EW active) + GM toggles (radiators, heat sink, solar panels, reaction drive, active sensors) // B3 p.57 |
| **Context menu gating** | Attack/Launch missiles enabled only in Attack phase; Crew action only in Actions phase; both locked when not current initiative actor |
| **Reactions** | Defender reacts before each attack: Evasive Action (TAC Speed → DM), Point Defence (Gunner check, removes missiles), Disperse Sand (Gunner check, +1D armour vs laser) |
| **Missile system** | Launch salvos (count stepper 1–6); flight rounds computed by range band; Missile Tracker ETA counter; point defence and EW countermeasures at impact |
| **Crew assignments** | Assign named crew members to roles (Captain, Pilot, Engineer, Sensor Operator, Turret/Bay Gunner, Marine); unassigned roles contribute 0 |
| **Crew actions** | Actions phase: Sensor Lock (DM+max(1,Effect) to attacks vs target), Electronic Warfare (DM penalty to jammed ship's attacks), EW Countermeasures (clears incoming jam), Leading Fire (DM+1/+2 to all gunners), Overload Stutterwarp (+1 TAC Speed or stutterwarp crit), Emergency Repair (hull +1 HP or reduce critical severity), Active Sensors, Evasive Action, Point Defence, Boarding |
| **Critical hits** | Surface Fixture Damage (Effect ≥ 3, even non-penetrating) and Internal Crits (Effect ≥ 6 or hull = 0); 2D location table; 11 systems × 6 severity levels // B3 p.58 |
| **Damage tracking** | Hull Points, current armour, per-system critical tracks (11 systems, severity 1–6) |
| **Phase tracker** | Setup → Initiative → Manoeuvre → Attack → Actions; HUD shows round, current actor, advance button |
| **Battle log** | Timestamped, colour-coded event log (system / move / attack / damage / action / critical) |
| **Undo/Redo** | Snapshot-based 50-step stacks; ↩ ↪ buttons in HUD |
| **Session save / resume** | Export session to JSON; preview before loading |
| **Autosave** | IndexedDB autosave after every action — persists ships, missiles, log; one-click restore |
| **Player dice rolls** | Player ships enter their own 2D6; 🎲 auto-roll opt-in on all roll steps; NPC ships auto-roll |
| **Ship catalog** | Built-in catalog of canonical 2300AD vessels for quick-add |
| **Profile I/O** | Import/export ship profiles via JSON files |
| **Error boundary** | Global React error boundary — catches crashes, shows recovery UI |

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
- **SHIP CATALOG** — aggiungi navi canoniche 2300AD con un click
- **✎** — modifica profilo esistente
- **⧉** — duplica profilo
- **⊗** — elimina profilo (richiede conferma)
- **↓ IMPORT / ↑ EXPORT** — scambia profili come file JSON

### 2 — Start or resume a session

- **🔄 RESUME** — ripristina l'autosave IndexedDB istantaneamente
- **▶ NEW SESSION** — reset stato battaglia, entra in combat view
- **↓ RESUME FROM FILE** — carica file `.json`; preview round/fase/roster prima di confermare

### 3 — In battle

**Right-click su una nave** apre il context menu. Le azioni sono abilitate solo nella fase corretta e quando è il turno di iniziativa di quella nave:

| Voce menu | Fase | Condizione |
| --- | --- | --- |
| Ship Sheet | Sempre | — |
| Attack… | Attack | Attore corrente, non ha ancora agito |
| Launch missiles… | Attack | Attore corrente, non ha ancora agito |
| Crew action… | Actions | Attore corrente, non ha ancora agito |
| Assign crew… | Sempre | — |
| Remove from battle | Sempre | — |

#### Phase flow

| Fase | Cosa fare |
| --- | --- |
| **Setup** | Aggiunge navi (right-click sfondo → Add ship) |
| **Initiative** | Right-click sfondo → Roll Initiative; ogni nave tira Tactics(naval) |
| **Manoeuvre** | Ogni nave in turno: right-click → Manoeuvre (Approach/Hold/Flee) |
| **Attack** | Ogni nave in turno: right-click → Attack o Launch missiles |
| **Actions** | Ogni nave in turno: right-click → Crew action |

Click **NEXT PHASE →** nell'HUD per avanzare. Fine round → torna a Manoeuvre, round counter +1.

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
| IDs | uuid v7 (time-ordered) |
| Unit tests | Vitest + jsdom + fake-indexeddb |
| E2E tests | Playwright (Chromium) |

---

## Running Tests

```bash
# Unit tests (utils logic)
npm test
npm run test:watch

# E2E tests (full UI flows, requires dev server)
npm run dev &
npm run e2e
npm run e2e:ui   # interactive Playwright UI
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
│   │   ├── ShipBentoCard.jsx     ← Card nave: hull bar, TAC Speed, SIG, critici, missili ETA
│   │   └── MissileTracker.jsx    ← Salvi missili in volo con round all'impatto
│   ├── modals/
│   │   ├── Modal.jsx             ← Generic modal wrapper
│   │   ├── ShipProfileModal.jsx  ← Crea/modifica profilo nave
│   │   ├── AddShipModal.jsx      ← Aggiunge nave (fascia iniziale + fazione)
│   │   ├── ManoeuvreModal.jsx    ← Approach/flee + TAC Speed per coppia
│   │   ├── AttackModal.jsx       ← 3-step Firing Solution + Reactions panel
│   │   ├── MissileLaunchModal.jsx← Lancio salvo (count stepper)
│   │   ├── MissileImpactModal.jsx← Impatto salvo: roll attacco + danno
│   │   ├── CriticalHitModal.jsx  ← Location 2D + effetti per severity 1–6
│   │   ├── ActionModal.jsx       ← Azioni crew Actions phase
│   │   ├── CrewAssignmentModal.jsx← Assegna crew a ruoli
│   │   ├── InitiativeModal.jsx   ← Tactics(naval) check + ordinamento
│   │   └── ShipDetailModal.jsx   ← Sheet completo + toggle signature conditions
│   └── ui/
│       ├── HUD.jsx               ← Round/fase/attore overlay + exit confirm
│       ├── BattleLog.jsx         ← Log eventi collassabile, color-coded
│       ├── PhaseTracker.jsx      ← Step corrente (Manoeuvre/Attack/Actions)
│       ├── ContextMenu.jsx       ← Right-click menu (phase-gated)
│       ├── Tooltip.jsx           ← Portal-based tooltip generico
│       ├── ErrorBoundary.jsx     ← Global React error boundary
│       └── LegalFooter.jsx       ← Disclaimer Mongoose Publishing
├── hooks/
│   └── useAutosave.js            ← IndexedDB autosave + restore on mount
├── data/
│   ├── weapons.js                ← Armi canoniche 2300AD (laser, particle, droni, missili)
│   ├── rangeBands.js             ← 7 fascie: distanza, TAC Speed cost, attackDM, timeLagDM
│   ├── criticalHits.js           ← Location table (2D) + effetti severity 1–6 × 11 sistemi
│   ├── crewActions.js            ← Definizioni azioni Actions phase per ruolo
│   ├── software.js               ← Software: fire_control, auto_repair, stutterwarp_control…
│   ├── factions.js               ← Fazioni (players / npc / neutral)
│   ├── defaultProfiles.js        ← Profili preimpostati caricati all'avvio
│   └── shipCatalog.js            ← Catalogo navi canoniche 2300AD
├── store/
│   ├── profilesStore.js          ← Ship profiles (CRUD + import/export JSON)
│   ├── battleStore.js            ← Stato battaglia (navi, fasce, missili, round, fase, undo)
│   └── uiStore.js                ← Modal open state, context menu, screen routing
└── utils/
    ├── combat.js                 ← getWeaponTraitAttackDm, computeEffectiveSignature,
    │                               computeAttackDMs, rollDamage, rollInitiative, crits
    ├── rangeBands.js             ← pairKey, basicBandPool, movement logic
    ├── missiles.js               ← makeMissileSalvo, computeFlightRounds, EW countermeasures
    ├── crew.js                   ← getCrewSkill, getAssignedCharacteristic
    ├── dice.js                   ← roll2D6, getCharDM
    ├── io.js                     ← JSON import/export via File API
    └── db.js                     ← IndexedDB wrapper (openDB, get, put, delete)
e2e/
├── helpers.js                    ← clearAppState, gotoBattle, advanceToPhase, drainActors
├── 01-smoke.spec.js              ← Load, no JS errors
├── 02-profile.spec.js            ← Profile CRUD + catalog
├── 03-battle-setup.spec.js       ← Ships in battle, range bands
├── 04-phases.spec.js             ← Phase progression, round cycle
├── 05-initiative.spec.js         ← Initiative modal, roll + confirm
├── 06-manoeuvre.spec.js          ← ManoeuvreModal, GM override, evasion
├── 07-attack.spec.js             ← AttackModal, 3-step Firing Solution
├── 08-missiles.spec.js           ← Launch + impact flow
└── 09-crew-actions.spec.js       ← Leading Fire, EW jam/penalty, EW countermeasures, Sensor Lock
```

---

## Game Rules Reference

Primary source: **2300AD Core Book 3: Vehicles and Spacecraft** — Starship Combat pp.52–62.  
Secondary: **Traveller 2022 Core Rulebook** — internal critical hit tables p.158–159 and weapon traits p.75.  
Where B3 and CRB diverge, **B3 wins**.

Full combat rules summary: `doc/space-combat-rules.md`

---

## License

For personal/group use at the gaming table.  
2300AD and Traveller are © Mongoose Publishing.
