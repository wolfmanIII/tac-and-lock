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

Il combattimento usa **fascie di distanza** (range bands) — nessuna griglia esagonale, nessun movimento vettoriale. Le 7 fasce (Adjacent → Distant) definiscono tutte le relazioni spaziali. Le navi spendono Thrust per muoversi tra fasce.

Riferimenti regole:

- `// Trav2022 CRB p.xxx` — Traveller 2022 Core Rulebook
- `// 2300AD B1 p.xxx` — 2300AD Core Book 1

Regole complete in `doc/space-combat-rules.md`.

## GAME RULES SUMMARY

### Round Structure (6 minuti)

1. **Manoeuvre Step** — spesa Thrust (movimento + riserva evasive action)
2. **Attack Step** — gunner aprono il fuoco; reazioni (evasion, point defence, sand)
3. **Actions Step** — azioni speciali crew (sensor lock, EW, overload, repair, boarding)

### Fascie di Distanza

| Fascia | Distanza | Thrust per muoversi |
| --- | --- | --- |
| Adjacent | ≤ 1 km | 1 |
| Close | 1–10 km | 1 |
| Short | 11–1.250 km | 2 |
| Medium | 1.251–10.000 km | 5 |
| Long | 10.001–25.000 km | 10 |
| Very Long | 25.001–50.000 km | 25 |
| Distant | > 50.000 km | 50 |

### Ship Profile Fields (combat-relevant)

`name`, `class`, `hullPoints`, `currentHull`, `armour`, `tacSpeed`, `sensors` (type + DM), `computer` (model + bandwidth), `weapons[]`, `software[]`, `criticalTracks` (11 track × 6 livelli di severità)

### Ruoli Crew & Skill

| Ruolo | Skill chiave |
| --- | --- |
| Pilot | Pilot |
| Captain | Tactics (naval), Leadership |
| Engineer | Engineer (m-drive / power / stutterwarp), Mechanic |
| Sensor Operator | Electronics (sensors) |
| Turret Gunner | Gunner (turret) |
| Bay Gunner | Gunner (bay) |
| Marine | Gun Combat / Melee |

### 2300AD Specifics

- Nessun Jump Drive — usa **Stutterwarp** (`Engineer (stutterwarp)` sostituisce `Engineer (j-drive)`)
- Navi più piccole (fino a ~20.000 ton); TL10–TL12
- `Astrogation` usata per rotte stutterwarp, non per plot di salto

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
14. **Game Rules Fidelity**: Tutti i calcoli meccanici (DM, danno, thrust, range bands, critical hits) devono corrispondere al Traveller 2022 CRB RAW + modifiche 2300AD. Segnalare qualsiasi ambiguità prima di implementare.

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
│   │   ├── ShipBentoCard.jsx     ← Card nave: hull bar, thrust, armi, critici, missili ETA
│   │   └── MissileTracker.jsx    ← Salvi missili in volo con round all'impatto
│   ├── modals/
│   │   ├── Modal.jsx             ← Generic modal wrapper
│   │   ├── ShipProfileModal.jsx  ← Crea/modifica profilo nave
│   │   ├── AddShipModal.jsx      ← Aggiunge nave alla battaglia (scegli fascia iniziale)
│   │   ├── ManoeuvreModal.jsx    ← Manovra: approach/flee + costo thrust per coppia
│   │   ├── AttackModal.jsx       ← Risoluzione attacco + Reactions panel
│   │   ├── MissileLaunchModal.jsx← Lancio salvo + stepper count
│   │   ├── MissileImpactModal.jsx← Impatto salvo: attacco + danno
│   │   ├── CriticalHitModal.jsx  ← Estrazione location + applicazione effetti severity
│   │   ├── ActionModal.jsx       ← Azioni crew (Overload, Repair, EW, Sensor Lock, ecc.)
│   │   ├── CrewAssignmentModal.jsx← Assegna crew a ruoli
│   │   ├── InitiativeModal.jsx   ← Roll iniziativa + Tactics check + ordinamento
│   │   └── ShipDetailModal.jsx   ← Sheet completo della nave
│   ├── ui/
│   │   ├── HUD.jsx               ← Round/fase/iniziativa overlay + exit confirm
│   │   ├── BattleLog.jsx         ← Log eventi collassabile, color-coded
│   │   ├── PhaseTracker.jsx      ← Step corrente (Manoeuvre/Attack/Actions)
│   │   ├── ContextMenu.jsx       ← Right-click context menu sulla nave
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
│   ├── battleStore.js            ← Stato battaglia (navi, fascia, missili, round, fase)
│   └── uiStore.js                ← Modal open state, nave selezionata, context menu
├── utils/
│   ├── combat.js                 ← DM calc, formula attacco, danno, critical hits
│   ├── rangeBands.js             ← Logica fascie: thrust cost, movement, pairKey, basicBandPool
│   ├── missiles.js               ← Lancio, round all'impatto, contromisure, EW
│   ├── crew.js                   ← Crew helpers (getCrewSkill, role assignment)
│   ├── dice.js                   ← Dice rolling + result formatting
│   ├── io.js                     ← JSON import/export via File API
│   └── db.js                     ← IndexedDB wrapper (openDB, get, put, delete)
└── data/
    ├── weapons.js                ← Tabella armi: tipo, TL, range, danno, traits
    ├── rangeBands.js             ← Definizioni 7 fascie: nome, distanza, thrustCost, attackDM
    ├── criticalHits.js           ← Location table (2D) + effetti per severity 1–6 × 11 sistemi
    ├── crewActions.js            ← Definizioni azioni Actions phase per ruolo
    ├── software.js               ← Software: nome, TL, bandwidth, effetto in combattimento
    ├── factions.js               ← Fazioni disponibili (players/npc/neutral)
    └── defaultProfiles.js        ← Profili nave preimpostati 2300AD (es. Trilon ISV-2)
```

## PATTERNS (from sibling project thrust-and-drift)

Il progetto è il sibling diretto di `~/projects/react/thrust-and-drift`. Riusare questi pattern consolidati:

| Pattern | Dove | Descrizione |
| --- | --- | --- |
| **MODAL_MAP** | `App.jsx` | `{ modalId: Component }` — aggiungere modals senza toccare il render |
| **`wh()` wrapper** | `battleStore.js` | Pushes undo snapshot automatico prima di ogni mutazione |
| **`_skipHistory`** | battleStore actions | Evita snapshot cascata su mutazioni interne |
| **`pairKey(id1,id2)`** | `utils/combat.js` | Chiave order-independent per coppie di navi |
| **`basicBandPool`** | battleStore | TAC Speed accumulato per coppia — persiste fino al cambio di fascia |
| **`buildNextRoundState(s)`** | battleStore | Funzione pura che avanza il round; condivisa tra `advancePhase` e `startNextRound` |
| **`makeLogEntry()`** | utils | Factory per LogEntry con shape consistente |
| **`ShipBentoCard`** | `BasicBattleView.jsx` | Layout bento card per nave — questo È il view principale di tac-and-lock |
| **`uuidv7()`** | ovunque | ID time-ordered per ogni entità |

### Differenza range bands: thrust-and-drift → tac-and-lock

thrust-and-drift ha **6 fasce** (no "Close"). 2300AD ne ha **7** — aggiunge "Close" (1–10 km, TAC Speed cost 1) tra Adjacent e Short.

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
- Game rules references: always cite source (e.g. `// Trav2022 CRB p.164`, `// 2300AD B1 p.11`).
- Full combat rules: `doc/space-combat-rules.md`
