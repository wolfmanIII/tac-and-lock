# TAC & LOCK // Space Combat Simulator — Agent Instructions

## ROLE

Senior Frontend Engineer. Vite + React specialist. Write efficient, maintainable, and performant code. Prefer technical accuracy over politeness.

## TECH STACK

- **Runtime**: Browser-only — no backend, no server, no network calls
- **Framework**: React 19 (JSX, hooks, concurrent features)
- **Build**: Vite 8 + `@vitejs/plugin-react`
- **State**: Zustand 5 (profiles, battle, ui stores)
- **Styling**: Tailwind v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js`)
- **File I/O**: Browser File API — JSON import/export, no persistence layer
- **IDs**: `uuid` v7 (time-ordered, `uuidv7()`)
- **Testing**: Vitest + @testing-library/react (test files colocated with source)
- **Linting**: oxlint (`oxlint` script in package.json)
- **Package Manager**: npm

## PROJECT DESCRIPTION

Local VTT lite (Virtual Tabletop) per il combattimento spaziale di **2300AD** (Mongoose Publishing, 2021), basato sul **Traveller 2022 Core Rulebook**. GM-operated, designed for shared-screen sessions.

Il combattimento usa **fascie di distanza** (range bands) — nessuna griglia esagonale, nessun movimento vettoriale. Le 7 fasce (Adjacent → Distant) definiscono tutte le relazioni spaziali. Il movimento tra fasce è un **check Pilot (DEX) contrapposto** (Open/Close, TAC Speed come DM fisso, mai speso) — l'Effect del check determina quante fasce si guadagnano o si perdono // 2300AD B3 p.54.

Riferimenti regole:

- `// Trav2022 CRB p.xxx` — Traveller 2022 Core Rulebook
- `// 2300AD B1 p.xxx` — 2300AD Core Book 1 (setting, core rules)
- `// 2300AD B3 p.xxx` — 2300AD Core Book 3: Vehicles and Spacecraft (ship stats, starship combat p.52–62)

Regole complete in `doc/space-combat-rules.md`.

> **FONTE PRIMARIA per il combattimento spaziale: 2300AD B3 p.52–62** (non il CRB).
> Il CRB si usa per le tabelle di critical hit interno (p.158–159) e weapon traits (p.75).
> Dove B3 e CRB divergono, B3 vince sempre.

## GAME RULES SUMMARY

### Iniziativa — 2300AD B3 p.54

**Check opposto Tactics (naval) (INT)** — formula: `2D6 + Tactics(naval) + INT DM`

- Il **Capitano** (o lead tactician) di ogni nave effettua un check Tactics (naval) opposto.
- La nave con il risultato più alto muove e spara per prima. Ordine fisso per tutta la durata del combattimento.
- In caso di sorpresa: la nave sorpresa non può agire nel primo round.
- **NON usa Pilot skill né TAC Speed** (quella è la formula CRB — errata per 2300AD).

### Round Structure (6 minuti) — 2300AD B3 p.53

1. **Manoeuvre Step** — spesa TAC Speed (movimento tra fasce + riserva evasion)
2. **Attack Step** — task chain Firing Solution → Gunner; reazioni (evasion, point defence, sand)
3. **Actions Step** — azioni speciali crew (repair, EW, boost power, boarding)

### Fascie di Distanza — 2300AD B3 p.52

> Scala light-second. Ogni fascia = ½ light second (~150.000 km). Cinque volte la scala Trav2022 CRB.

| Fascia | Distanza (km) |
| --- | --- |
| Adjacent | < 100 |
| Close | ≤ 150.000 |
| Short | 150.001 – 300.000 |
| Medium | 301.000 – 450.000 |
| Long | 450.001 – 600.000 |
| Very Long | 600.001 – 750.000 |
| Distant | > 750.000 |

Non esiste una tabella di "costo TAC Speed per fascia" nel testo — il movimento è un check Pilot (DEX) contrapposto (Open/Close, B3 p.54), non un costo fisso. TAC Speed si somma al check come DM, non si spende mai. Vedi `utils/rangeBands.js:moveBands` e `ManoeuvreModal.jsx`.

### Range Modifiers (attacco) — 2300AD B3 p.57

> La stragrande maggioranza delle armi è efficace **solo entro Close range**. Short è il limite assoluto per le armi con Range "Short" (es. Grumbler). La colonna "Range" nella tabella armi = fascia massima a DM 0.

| Fascia | Attack roll DM |
| --- | --- |
| Adjacent | +2 |
| Close | +0 |
| Short | −6 |
| Medium+ | Non applicabile (nessuna arma da nave standard arriva) |

Il campo `rangeDm` in `data/weapons.js` codifica per ogni arma: DM ottimale alla sua Range massima, penalità secondo questa tabella oltre.

Condizioni situazionali (indipendenti dalla fascia, si applicano sempre) — `ship.atmosphericCondition` via `getAtmosphericTargetDm()` in `utils/combat.js`, toggle GM in ShipDetailModal:

| Condizione bersaglio | Attack roll DM |
| --- | --- |
| Superficie planetaria (con atmosfera) | −6 |
| Superficie planetaria (senza atmosfera) | −4 |
| In volo atmosferico | −2 |

Il trait **Ortillery** (DM+4 contro bersagli su superficie planetaria, con o senza atmosfera — non in volo) è implementato in `getOrtilleryDm(traits, target)`.

### Sensor Time-lag (sensori) — 2300AD B3 p.47

Usato per tutti i check Electronics (sensors), incluso lo step 1 della Firing Solution. Si somma (non si sostituisce) ai DM di qualità sensori.

| Fascia | Range DM |
| --- | --- |
| Adjacent | +1 |
| Close | +0 |
| Short | −1 |
| Medium | −2 |
| Long | −3 |
| Very Long | −4 |
| Distant | −5 |

### Firing Solution (Task Chain) — 2300AD B3 p.56

L'attacco in 2300AD è una catena di check interdipendenti. Ogni Effect positivo si trasferisce come DM al check successivo.

1. **Sensor Operator** — Very Difficult (12+) Electronics (sensors) INT
   - DM positivi: +Signature del bersaglio; qualità sensori (Basic Military +0, Improved +1, Advanced +2); Sensor Time-lag (tabella sopra, negativo a distanza)
   - Engineer assist opzionale: Routine (8+) Engineer (power) INT
2. **Pilot** — Difficult (10+) Pilot DEX
   - DM positivi: +TAC Speed della nave
   - Engineer assist opzionale: Routine (8+) Engineer (power) INT (può aumentare temporaneamente TAC Speed)
3. **Gunner** — Difficult (10+) Gunner INT — bersaglio **10+**
   - DM: +Fire Control software rating (DM+1/livello)
   - Captain assist opzionale: Difficult (10+) Tactics (naval) INT

### Signature — 2300AD B3 p.57

Ogni nave ha un valore **Signature** (basato su tonnellaggio + power plant). Usato come DM positivo nei check Electronics (sensors) nemici durante la Firing Solution.

| Azione / Condizione | Effetto su Signature |
| --- | --- |
| Damage > 50% Hull | +1 |
| Electronic Warfare | +2 |
| Heat Sink (durata limitata) | −4 |
| Power Plant Critical | +1 |
| Radiators Retracted | −1 |
| Reaction Drive in uso | +4 razzi / +6 thruster / +8 nucleare |
| Sensor attivi (TTA, UTES) | +1 |
| Solar Panels estesi | +2 |
| Spin Habitat ritirato | −1 |
| Stealth | −4 |

### Critical Hits — 2300AD B3 p.58

#### Surface Fixture Damage (esterno, non penetrante)

Qualsiasi hit con Effect ≥ 3 triggerizza questo roll (anche se non penetra l'armatura).

| 2D | Sistema | 1° Hit | 2° Hit |
| --- | --- | --- | --- |
| 2 | Fire Control | DM−2 ai roll di attacco | — |
| 3–4 | Weapon | −1D Damage, DM−2 ai roll di attacco | Disabled |
| 5 | Sensors | DM−2 ai check Electronics (sensors) | — |
| 6–8 | Radiator | Vedi regole Radiator | — |
| 9 | Sensors | DM−2 ai check Electronics (sensors) | — |
| 10–11 | Discharge Vanes | Disabled | Destroyed |
| 12 | Other System | Disabled | Destroyed |

#### Internal Critical Hits

Come Trav2022 CRB p.158–159, con queste sostituzioni:

- J-Drive → **Stutterwarp Drive** (crit riduce TAC Speed di −1 per punto perso, non Thrust)
- M-Drive → **Reaction Drive** (primo crit: inoperabile; secondo: distrutto)

### Weapon Traits — 2300AD B3 p.59

| Trait | Effetto | Fonte |
| --- | --- | --- |
| Accurate | DM+1 ai roll di attacco | B3 |
| Advanced | +1 damage per dado | B3 |
| AP X | Ignora X punti di Armatura | B3 |
| Auto X | Come CRB p.75 | B3 (ref CRB) |
| Blast X | Max X bersagli aggiuntivi a Close range | B3 |
| EM | Roll aggiuntivo sulla crit table ad ogni crit | B3 |
| Hardened | Ignora il primo crit che subisce | B3 |
| Inefficient | Raddoppia il consumo di Power/heat | B3 |
| Obsolete | −1 damage per dado | B3 |
| Ortillery | DM+4 quando si attacca un bersaglio su superficie planetaria | B3 |
| Point Defence | DM+2 vs missili, droni e fighter. Solo a Close range | B3 |
| Radiation | Inflicts rads = Effect × 10 | B3 |
| Rapid Fire | Come Auto X; usato specificamente per la Quinn PDC — definizione in CRB p.75 | B3 weapon table / CRB |
| Slow | DM−2 ai roll di attacco | B3 |

### Software di Bordo — 2300AD B3 p.44

| Software | TL | Bandwidth | Effetto combat-rilevante |
| --- | --- | --- | --- |
| Operations | 10 | 0 | Controllo base nave (incluso) |
| Intellect | 10 | 10 | Comandi vocali in linguaggio naturale |
| Stutterwarp Control | As drive | 2× Warp Efficiency | Abilita il viaggio stutterwarp |
| Fire Control/1 | 10 | 5 | DM+1 al Gunner check (step 3 Firing Solution) |
| Fire Control/2 | 11 | 10 | DM+2 al Gunner check |
| Fire Control/3 | 12 | 15 | DM+3 al Gunner check |
| Auto-Repair/1 | 10 | 10 | 1 tentativo riparazione/round (o DM+1 a repair check) |
| Auto-Repair/2 | 11 | 20 | 2 tentativi/round (o DM+2) |
| Archive | 10 | 0 | Banca dati (incluso) |

> Una nave **senza nessun software Fire Control** subisce **DM−8** a tutti i check di attacco, incluso il point defence — 2300AD B3 p.62. Implementato in `getFireControlDm(software)` in `utils/combat.js`, usato sia da `AttackModal.jsx` che da `DroneAttackModal.jsx` (Gunner step e Point Defence).
>
> Nota: in 2300AD non esistono i software "Manoeuvre" e "Evade" del Trav2022 CRB. I profili nave usano `stutterwarp_control`, `fire_control_N`, `auto_repair_N`.

### Armi Canoniche 2300AD — B3 p.60–61

#### Laser (spacecraft)

| Arma | TL | Range | Danno | Traits |
| --- | --- | --- | --- | --- |
| Darlan LL-88 | 10 | Close | 1D−1 | Obsolete, Accurate |
| Darlan LL-98 | 11 | Close | 2D | Accurate |
| Darlan G2 (Laser Drill) | 10 | Adjacent | 1D−1 | Obsolete |
| Quinn Type 17 PDC | 12 | Adjacent | 1D | Point Defence, Rapid Fire |
| Kaefer 'Grumbler' | 12 | Short | 2D+2 | Advanced, Inefficient |

#### Particle Beam

| Arma | TL | Range | Danno | Traits |
| --- | --- | --- | --- | --- |
| Allen BMZ-50 | 11 | Close | 3D | AP 4, EM, Inefficient, Slow |

#### Submunitions — B3 p.59, p.61

| Arma | TL | Range | Danno | Traits |
| --- | --- | --- | --- | --- |
| Mitraille (Grape Shot) | 11 | Close | 2D | Auto 4, Blast 4, Radiation, Slow |

> Le submunitions sono "detonation lasers" (B3 p.59): devono sparare a Close range e soffrono comunque DM−2 — da cui il trait `Slow`, non stampato nella tabella Submunitions di p.61 ma derivato dalla regola generale sui detonation laser.

#### Combat Drones — B3 p.61

| Drone | TL | Danno | TAC Speed | Endurance | Traits |
| --- | --- | --- | --- | --- | --- |
| Ritage-1 | 11 | 1D | 3 | 6 ore | — |
| Ritage-2 | 12 | 5D | 4 | 4 ore | Blast 6, Radiation, Slow¹ |
| 'Whiskey' (Kaefer) | 12 | 1D laser / 3D det. laser | 4 | 2 ore | — / Blast 3, Radiation, Slow¹ |

¹ `Slow` (DM−2) non è stampato nella tabella Combat Drones di p.61 — deriva dalla regola generale sui detonation laser (B3 p.59): Ritage-2 e la modalità di detonazione di Whiskey sono entrambi warhead nucleari a raggi X ("detonation lasers"), che devono sparare a Close range e soffrono comunque DM−2.

### Ship Profile Fields (combat-relevant)

`name`, `class`, `hullPoints`, `currentHull`, `armour`, `tacSpeed`, `signature` (base value), `sensors` (type + DM), `computer` (model + bandwidth), `weapons[]`, `software[]`, `criticalTracks` (11 track × 6 livelli di severità)

### Ruoli Crew & Skill — 2300AD B3 p.53

| Ruolo | Skill chiave | Azione primaria |
| --- | --- | --- |
| Captain | Tactics (naval), Leadership | Initiative, ordini, assist Tactics |
| Sensor Operator | Electronics (sensors) | Firing Solution step 1, EW, scan |
| Pilot | Pilot | Firing Solution step 2, manoeuvre, evasion |
| Engineer | Engineer (power/stutterwarp) | Assist sensor + pilot, boost power/TAC Speed, repair |
| Turret Gunner | Gunner (turret) | Firing Solution step 3, point defence |
| Bay Gunner | Gunner (bay) | Come turret gunner, armi di bay |
| Remote Pilot | Electronics (remote ops) | Pilota droni e missili guidati |
| Damage Control | Mechanic | Riparazione critical hits e hull |
| Ship's Troops | Vacc Suit, Gun Combat | Damage control assist, boarding |

### 2300AD Specifics

- Nessun Jump Drive — usa **Stutterwarp** (`Engineer (stutterwarp)` sostituisce `Engineer (j-drive)`)
- Navi più piccole (fino a ~20.000 ton); TL10–TL12
- `Astrogation` usata per rotte stutterwarp, non per plot di salto
- Combattimento inizia tipicamente a **Long range**; armi efficaci solo a **Close**
- Bersagli stazionari o in movimento a reaction drive (non stutterwarp): DM+2 e danno doppio agli attacchi contro di loro — 2300AD B3 p.56, `ship.isStationary` / `ship.reactionDriveActive` via `isEasyTarget()`/`getEasyTargetAttackDm()`/`getEasyTargetDamageMultiplier()` in `utils/combat.js`

## CODING GUIDELINES

1. **Conciseness**: Do not explain basic concepts. Only explain complex architectural decisions.
2. **Safety**: Handle all edge cases. Explicit error handling — no `catch(e) {}` swallowing.
3. **Modern JS**: ES2024, named exports preferred, no default exports on stores/utils.
4. **React Patterns**: Functional components only. Custom hooks for logic reuse (`use` prefix). Keep components lean — extract logic to hooks or utils.
5. **State Management**: All game state in Zustand stores (`store/`). UI-only state (hover, focus) may live in component `useState`. No prop drilling past 2 levels — use store selectors.
6. **No Placeholders**: Write full implementations. Never leave TODOs.
7. **SOLID Principles**: Apply to **all** `.js`/`.jsx` files. Single-responsibility for hooks and utils.
8. **Code Organization**: UI (JSX/components) strictly separated from logic (hooks, utils, store).
9. **Industrial Theme**: Sci-fi 2300AD/militare per le stringhe user-facing. Dark palette — slate/zinc base, neon cyan accents.
10. **Imports**: Always explicit. Never `import *`.
11. **Strict Scope**: Stay within discussed scope. Do not add extra features unless requested.
12. **Tailwind v4 Syntax**: Canonical class syntax — `(--var)` not `[var(--var)]`, `bg-linear-to-t` not `bg-gradient-to-t`. No `tailwind.config.js` — use CSS `@theme` for custom tokens.
13. **No External State Libraries**: Do not introduce Redux, Jotai, Context-based state — Zustand only.
14. **Game Rules Fidelity**: Tutti i calcoli meccanici (DM, danno, TAC Speed, range bands, critical hits) devono corrispondere a **2300AD B3 p.52–62** come fonte primaria, con Trav2022 CRB usato solo per tabelle crit interno (p.158–159) e weapon traits (p.75). Segnalare qualsiasi ambiguità prima di implementare — verificare contro il PDF sorgente in `doc/`, non fidarsi della sola documentazione derivata. Software validi in 2300AD: `stutterwarp_control`, `fire_control_1/2/3`, `auto_repair_1/2`, `operations`, `intellect`, `archive` — NON `manoeuvre` o `evade_N`. Funzioni chiave in `utils/combat.js` già implementate: `getWeaponTraitAttackDm(traits)` (Accurate +1, Slow −2 all'attacco), `getPointDefenceDm(traits)` (DM+4 armi PDC / DM−2 non-PDC per l'azione di intercettazione, distinto dal trait "Point Defence" DM+2 — B3 p.55 + p.56), `computeEffectiveSignature(ship)` (firma effettiva con tutti i modificatori dinamici B3 p.57, incluso `reactionDriveActive` che pesca il DM da `ship.reactionDriveType` — rocket +4/thruster +6/nuclear +8, default rocket — via `getReactionDriveSignatureDm`), `computeAttackDMs(params)` (include weaponTraitDm), `rollDamage(weaponId, count, armour, overrides?)` (Advanced/Obsolete per die; `overrides` per warhead alternativi come Whiskey detonation mode). **Tutte le azioni Actions Phase sono implementate** in `store/battleStore.js` e `ActionModal.jsx`: `applyEW` (ruolo `sensor_operator`, Difficult 10+, Electronics/comms — B3 p.54) → `ewEffect` a bande fisse (Effect≥5 → −2, Effect≥0 → −1, Effect≤−5 → +1 backfire sul jammer) + `ewTarget`; non esiste "Sensor Lock" come azione — non è in B3 p.52–62, esiste solo nel Trav2022 CRB (fuori dallo scope CRB sanzionato per questo progetto) e non è implementata; `applyCommand(shipId, role, dm)` → appende a `commandBonusNextRound[]` per-nave (un comando per livello di Leadership, cap enforced in `ActionModal.jsx`), promosso a `commandBonus[]` al round successivo (stesso pattern di `initiativeBonusNextRound` — B3 p.54, sostituisce il precedente "Leading Fire" non canonico); `addHazard(shipId, label)` / `removeHazard(shipId, hazardId)` → `ship.hazards[]` GM-managed (ShipDetailModal). Combattimento droni/missili: `launchDrone(ownerId, targetId, weaponId)` crea un'unità individuale (nessun concetto di "salvo" — B3 p.55–56); `interceptDrone(droneId)` risolve Point Defence uno-a-uno; `detonateDrone(droneId)` consuma l'unità dopo l'attacco (hit o miss). Boarding: `boardingDmNextRound` carry-over su nave vincitrice, reset a fine round. `updateShip(shipId, { ewTarget: null, ewEffect: 0 })` per cancellare un jam.

## CRITICAL RULES

- DO NOT apologize.
- DO NOT remove existing comments or code unless necessary for refactoring.
- DO NOT hallucinate React APIs, Zustand APIs, or Traveller/2300AD rules.
- DO NOT add synchronous heavy computation on the main thread — offload to `setTimeout`/`requestAnimationFrame` if needed.
- DO NOT add Co-Authored-By lines to git commits.
- DO commit frequently — every logical unit (component, hook, store slice, util) is a separate commit.
- DO NOT introduce TypeScript unless explicitly requested — project uses JSX.
- DO NOT exercise operational complacency. Flag suboptimal patterns immediately.

## PROJECT STRUCTURE

```text
src/
├── main.jsx                      ← React entry point
├── App.jsx                       ← Root component, MODAL_MAP, screen routing
├── App.css                       ← Global styles (augments Tailwind)
├── index.css                     ← Tailwind directives + @theme tokens
├── components/
│   ├── dashboard/
│   │   ├── Dashboard.jsx         ← Pre-battle lobby (profiles + session controls)
│   │   └── useProfileImport.js   ← Hook: import profiles from file
│   ├── battle/
│   │   ├── BattleView.jsx        ← Layout principale: fascie + bento cards per nave
│   │   ├── ShipBentoCard.jsx     ← Card nave: hull bar, TAC Speed, SIG effettiva, critici, droni ETA
│   │   └── DroneTracker.jsx      ← Droni/missili individuali in volo o in range (no salvo)
│   ├── modals/
│   │   ├── Modal.jsx             ← Generic modal wrapper
│   │   ├── ShipProfileModal.jsx  ← Crea/modifica profilo nave
│   │   ├── AddShipModal.jsx      ← Aggiunge nave alla battaglia (scegli fascia iniziale)
│   │   ├── ManoeuvreModal.jsx    ← Manovra: approach/flee + costo thrust per coppia + Evade
│   │   ├── AttackModal.jsx       ← Risoluzione attacco (Firing Solution nave) + Captain Tactics Assist
│   │   ├── DroneLaunchModal.jsx  ← Lancio drone/missile individuale (no salvo)
│   │   ├── DroneAttackModal.jsx  ← Firing Solution drone (hand-off/self, remote pilot, gunner) + Point Defence uno-a-uno
│   │   ├── CriticalHitModal.jsx  ← Estrazione location + applicazione effetti severity
│   │   ├── ActionModal.jsx       ← Azioni crew (Overload, Repair, EW, Commands, ecc.)
│   │   ├── CrewAssignmentModal.jsx← Assegna crew a ruoli
│   │   ├── InitiativeModal.jsx   ← Roll iniziativa + Tactics check + ordinamento
│   │   └── ShipDetailModal.jsx   ← Sheet completo + toggle SIGNATURE CONDITIONS
│   ├── ui/
│   │   ├── HUD.jsx               ← Round/fase/iniziativa overlay + exit confirm
│   │   ├── BattleLog.jsx         ← Log eventi collassabile, color-coded
│   │   ├── PhaseTracker.jsx      ← Step corrente (Manoeuvre/Attack/Actions)
│   │   ├── ContextMenu.jsx       ← Right-click menu (phase-gated: Attack/Launch drone solo in Attack phase, Action solo in Actions phase; Resolve drone attack per drone propri in range)
│   │   ├── Tooltip.jsx           ← Portal-based tooltip generico
│   │   ├── ErrorBoundary.jsx     ← Global React error boundary
│   │   └── LegalFooter.jsx       ← Disclaimer Mongoose Publishing fisso
│   └── forms/
│       ├── ShipProfileForm.jsx   ← Campi profilo nave
│       └── DiceInput.jsx         ← Inserimento manuale 2D6 (player dice)
├── hooks/
│   └── useAutosave.js            ← IndexedDB autosave + restore on mount
├── store/
│   ├── profilesStore.js          ← Ship profiles (CRUD + import/export JSON)
│   ├── battleStore.js            ← Stato battaglia (navi, fascia, drones[] individuali, round, fase, commandBonus, undo/redo)
│   └── uiStore.js                ← Modal open state, nave selezionata, context menu
├── utils/
│   ├── combat.js                 ← getWeaponTraitAttackDm, getPointDefenceDm, computeEffectiveSignature, computeAttackDMs, rollDamage, crits
│   ├── rangeBands.js             ← Logica fascie: moveBands (Effect → spostamento), pairKey (riusata anche per l'avvicinamento dei droni)
│   ├── crew.js                   ← Crew helpers (getCrewSkill, role assignment, incluso remote_pilot)
│   ├── dice.js                   ← Dice rolling + result formatting
│   ├── io.js                     ← JSON import/export via File API
│   └── db.js                     ← IndexedDB wrapper (openDB, get, put, delete)
└── data/
    ├── weapons.js                ← Armi canoniche 2300AD: tipo, TL, range, danno, traits, droni (tacSpeed/enduranceRounds)
    ├── rangeBands.js             ← Definizioni 7 fascie: nome, distanza, attackDM, timeLagDM
    ├── criticalHits.js           ← Location table (2D) + effetti per severity 1–6 × 11 sistemi
    ├── crewActions.js            ← Definizioni azioni Actions phase per ruolo
    ├── software.js               ← Software: nome, TL, bandwidth, effetto in combattimento
    ├── factions.js               ← Fazioni disponibili (players/npc/neutral)
    ├── defaultProfiles.js        ← Profili nave preimpostati 2300AD caricati all'avvio
    └── shipCatalog.js            ← Catalogo navi canoniche per quick-add in battaglia
```

## PATTERNS (from sibling project thrust-and-drift)

Il progetto è il sibling diretto di `~/projects/react/thrust-and-drift`. Riusare questi pattern consolidati:

| Pattern | Dove | Descrizione |
| --- | --- | --- |
| **MODAL_MAP** | `App.jsx` | `{ modalId: Component }` — aggiungere modals senza toccare il render |
| **`wh()` wrapper** | `battleStore.js` | Pushes undo snapshot automatico prima di ogni mutazione |
| **`_skipHistory`** | battleStore actions | Evita snapshot cascata su mutazioni interne |
| **`pairKey(id1,id2)`** | `utils/rangeBands.js` | Chiave order-independent per coppie di navi |
| **`buildNextRoundState(s)`** | battleStore | Funzione pura che avanza il round; condivisa tra `advancePhase` e `startNextRound` |
| **`makeLogEntry()`** | utils | Factory per LogEntry con shape consistente |
| **`ShipBentoCard`** | `BasicBattleView.jsx` | Layout bento card per nave — questo È il view principale di tac-and-lock |
| **`uuidv7()`** | ovunque | ID time-ordered per ogni entità |

### Differenza range bands: thrust-and-drift → tac-and-lock

thrust-and-drift ha **6 fasce** (no "Close"). 2300AD ne ha **7** — aggiunge "Close" (≤150.000 km, TAC Speed cost 1) tra Adjacent e Short. Le distanze km sono scala light-second, non CRB.

### Tema visuale (riusare da thrust-and-drift)

```css
/* Fonts */
font-display: 'Orbitron' (headers/labels)
font-mono: 'Share Tech Mono' (body/values)

/* Palette @theme */
--neon-cyan: #7dd3fc;   /* sky-300 — accento primario */
/* base: slate-950 bg, slate-200 text */
```

### Stato navi — differenze rispetto a thrust-and-drift

- Nessun `position: {q,r}` / `vector: {q,r}` — posizione = `rangeBand` (string, chiave coppia)
- Nessun `inDogfight` con hex grid — dogfight attivo quando `rangeBand === 'Adjacent' | 'Close'`
- `jump` → `stutterwarp` (rating motore stutterwarp)
- Critical tracks: 11 sistemi (aggiunge `stutterwarp`, rimuove `jumpDrive`)

## DOCUMENTATION

- Code: JSDoc on hooks and complex functions (English, technical tone).
- Project: keep `doc/` updated in Italian Markdown.
- Game rules references: always cite source (e.g. `// Trav2022 CRB p.164`, `// 2300AD B3 p.56`).
- Full combat rules: `doc/space-combat-rules.md`

## TESTING

- **Unit tests** (Vitest + jsdom): `src/**/*.test.js` — colocated with source. Cover `utils/` logic: combat, rangeBands, crew. Run: `npm test`.
- **E2E tests** (Playwright, Chromium): `e2e/*.spec.js` at repo root. 84 tests across 9 spec files. Store injection via `window.__ZUSTAND_*_STORE__` exposed in non-production builds; use `store.setState({...})` to inject state directly (avoids `importBattleState` which requires a File object). Run: `npm run e2e` (requires dev server on :5173).
- **Do NOT write Vitest tests for React components or Zustand stores** — E2E covers those flows. Unit tests are for pure-logic utils only.
- `e2e/helpers.js` exports `clearAppState` (full reset including IndexedDB + profiles), `gotoBattle`, `advanceToPhase`, `drainActors` (exhaust all actor turns before advancing phase).
