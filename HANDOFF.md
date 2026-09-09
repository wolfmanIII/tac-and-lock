# TAC & LOCK — Handoff Document

> Stato del progetto al 2026-09-09. Da leggere all'inizio di ogni nuova sessione prima di iniziare.

---

## Stato Attuale

**Versione**: 1.6.0

**Test**: 603 unit test (Vitest, 7 file) — eseguiti in questa sessione, tutti verdi. 236 test E2E
(Playwright, 11 spec file) — conteggio statico (`grep -c "test("`), non rieseguiti in questa
sessione (richiedono dev server su :5173, `npm run e2e`).

**Issue tracker**: nessuna issue aperta. Terzo audit rules-fidelity (2026-07-28/29) completamente
chiuso — issue #50–68 tutte risolte (6 agenti paralleli, ognuno con ri-estrazione fresca del PDF
B3/CRB; l'audit ha trovato anche una propria fix precedente sbagliata — #55 correggeva #35).
Prossimo lavoro: nessuno pianificato, in attesa di richiesta utente o di un nuovo audit.

**Nota**: questo file era rimasto fermo al 2026-07-17 (stato pre-audit3) per ~2 mesi — vedi
`feedback_handoff_doc` in memoria: va rinfrescato ad ogni bump versione o batch di fix grosso,
non lasciato driftare.

---

## Cosa è Implementato (completo)

### Meccaniche di gioco core
- 7 range bands (Adjacent → Distant, scala light-second) — movimento via check Pilot (DEX)
  contrapposto Open/Close, TAC Speed come DM fisso mai speso — B3 p.54
- **Combat ends one round after Distant**: se una coppia resta a Distant per un round intero dopo
  un Open riuscito, badge/log informativo (`distantPursuit` in `battleStore.js`) — B3 p.54, issue #46
- Iniziativa: 2D6 + Tactics(naval) + INT DM, check opposto, fisso per tutta la battaglia — B3 p.54
- Round structure: nessuna fase Manoeuvre/Attack/Actions — economia azioni per-ruolo
  (`ship.actionsRemaining`, `buildActionBudget` in `utils/crew.js`), Gunnery cap 1/round
  (Turret e Bay indipendenti — issue #45, ma Bay Gunner **non ha base 2300AD B3**, concetto
  solo Trav2022 CRB, tenuto solo per navi homebrew — issue #63), turno nave chiuso da
  END SHIP'S TURN
- Firing Solution 3-step: Sensor Operator (12+) → Pilot (10+) → Gunner (10+) — B3 p.56, con
  Engineer assist opzionale a Step 1/2 e Captain Tactics assist a Step 3
- Drone/missili: unità individuali (`launchDrone`, non un modello a salvo), Firing Solution
  identica ma con hand-off sensori, DM+2 Pilot droni (ora applicato anche a Step 1
  self-generated, non solo Step 2 — issue #61), e **lightspeed lag** DM−1 (owner↔drone a
  Long+, `drone.ownerBand`, distinto dal Sensor Time-Lag drone↔bersaglio) — B3 p.55, issue #49
- **Magazine capacity droni** (issue #62): Ritage-1 (5 colpi) e Whiskey batteria (3 colpi)
  sopravvivono a un tentativo (hit o miss) e possono riattaccare in round successivi finché
  `drone.shotsRemaining` non si esaurisce (`detonateDrone`); Ritage-2 e Whiskey detonazione
  restano single-use indipendentemente dalla carica residua.
- Signature effettiva: base + condizioni dinamiche (hull <50%, EW, reaction drive per tipo,
  stealth, ecc.) — `computeEffectiveSignature`
- Defensive Screens (Rating 1–3, solo laser), Targeting Systems (Light TTA/TTA/UTES/Drone
  Controller, DM−8 se assente), Fire Control software (0/+1/+2/+3)
- Point Defence: reazione intercettazione (DM+4 PDC/−2) + azione proattiva `engage` (trait Point
  Defence, DM+2, solo Close) + **modalità computer-run** (issue #57): Difficult (10+) Gunner +
  Fire Control + DM+4 fisso, fino a TL−4 intercettazioni/round (`getPdcComputerCap(ship.TL)`,
  campo `ship.TL` verificato su tutte le 26 navi canoniche), non consuma il budget Gunnery
  condiviso (`recordPdcIntercept` invece di `spendCrewAction`), tracciato in
  `ship.pdcInterceptsUsed`
- Weapon traits: Accurate, Slow, Advanced, Obsolete, AP X, Auto X (Single/Burst/Full Auto),
  Radiation, Ortillery, Point Defence, Hardened, Inefficient, EM
- Critical hits: Surface Fixture (2D, hit su Effect≥3, incl. 3° hit "destroyed" restaurato —
  issue #55) + Internal (location 2D, severity = Effect−5 o precedente+1, cap 6/2; Cargo
  severity 6 corretta a +1 flat, non +1D — issue #56) — tabelle corrette contro il PDF CRB
  p.169–170
- Boarding Actions: flat 2D6 + modificatori CRB p.175 (nessuno skill check), checkbox per
  Superior Armour/Weaponry/Skills&Tactics/Numbers + "no Marines" difensore — issue #29, #48;
  `boardingDmNextRound` carry-over ora effettivamente applicato in UI (issue #54)

### Azioni Crew (`data/crewActions.js`, tutte implementate in `battleStore.js`/`ActionModal.jsx`)
| Azione | Ruolo | Store action | Campo nave |
| --- | --- | --- | --- |
| Commands (+ disobey-order) | captain | `applyCommand(shipId, role, dm)` | `commandBonus[]` (dm<0 = disobbedienza, issue #39) |
| Issue Order | captain | `grantExtraAction(shipId, role)` | `actionsRemaining[role]` +1 |
| Re-route Power | engineer | — (informativo, nessuna tabella B3) | — |
| Overload Stutterwarp | engineer | `updateShip({ currentTacSpeed })` | nessun fallimento (issue #27) |
| Boost Power Output | engineer | `addCriticalHit` su Effect≤−5 | `criticalTracks.powerPlant` (issue #37) |
| Active Sensors | sensor_operator | `updateShip({ activeSensorsOn: true })` | +1 Signature |
| Electronic Warfare | sensor_operator | `applyEW(attId, tgtId, effect)` | `ewEffect`, `ewTarget`; DM−2 se il bersaglio ha Encrypted Comms attivo (issue #66) |
| Scan Target | sensor_operator | — (informativo) | — |
| Improve Critical | sensor_operator | `updateShip({ improveCriticalThreshold })` | consumato al prossimo colpo |
| Emergency Repair | **damage_control** (Mechanic, non più engineer — issue #52) | `repairHull` (Hull, permanente) / `reduceCriticalSeverity` (System, **temporaneo** — Effect<5 → `criticalRepairExpiry` = round+1D, poi relapse +1; Effect≥5 → resto del combattimento — issue #64) | `criticalRepairExpiry{}` |
| Boarding Action | marine | `applyDamage`, `updateShip({ boardingDmNextRound })` | — |
| Repel Boarders | marine | helper roll condiviso, nessun check proprio | — |

Non esistono più (rimosse perché inventate, non B3): Sensor Lock (issue #3), Leading Fire
(sostituita da Commands), EW Countermeasures (issue #38), Deploy Sand, Improve Initiative
(issue #43), l'azione `damage_control` inventata su hull breach/fuel leak (issue #53 — il pannello
ACTIVE HAZARDS resta GM-managed puro, nessun check finto lo protegge). Tutti i campi per-round si
resettano in `buildNextRoundState`.

### ShipDetailModal
- Pannello ACTIVE HAZARDS: add (testo libero) / remove
- Toggle SIGNATURE CONDITIONS + atmospheric/planetary condition + **Encrypted Comms**
  (`ship.encryptedComms`, sezione COMMUNICATIONS — issue #66)
- Critical tracks, Commands attivi (incl. disobbedienza in rosso), Improve Critical banner,
  banner "REPAIR HOLDING (TEMPORARY)" quando un critical repair è in scadenza (issue #64)

---

## Struttura Chiave

```
src/store/battleStore.js   ← stato battaglia, tutte le action, undo/redo, export/import/autosave whitelist
src/components/modals/
  ActionModal.jsx          ← tutte le azioni Crew (Commands, Boarding, ecc.)
  AttackModal.jsx          ← Firing Solution nave, DM breakdown step 3, mount turret/bay
  DroneAttackModal.jsx     ← Firing Solution drone/missile, Point Defence (gunner-managed + computer-run PDC), engage
  ManoeuvreModal.jsx       ← Open/Close/Evade, GM override, banner combat-ended
  ShipDetailModal.jsx      ← sheet nave + hazards + signature/comms toggles
src/data/crewActions.js    ← definizioni azioni (id, skill, difficulty, requiresTarget, reaction); damage_control è un ruolo a sé (issue #52)
src/data/weapons.js        ← armi canoniche B3 + extended + CRB legacy, rangeDm per fascia, magazine per drone (issue #62)
src/utils/combat.js        ← getWeaponTraitAttackDm, computeEffectiveSignature, computeAttackDMs, rollDamage, getPdcComputerDm/getPdcComputerCap
src/utils/rangeBands.js    ← moveBands, pairKey, computeEndedPursuits, getDroneLightspeedLagDm (data/rangeBands.js)
e2e/09-crew-actions.spec.js← test per tutte le azioni store-level
e2e/08-drones.spec.js      ← test drone/missile, Point Defence, lightspeed lag, magazine
e2e/06-manoeuvre.spec.js   ← test Open/Close/Evade, distant pursuit
e2e/11-critical-hits.spec.js← test critical hits (Surface Fixture, Internal, severity)
```

---

## Prossimi Passi Possibili

Nessuno pianificato — il backlog delle issue rules-fidelity è a zero. Possibili aree future,
mai discusse con l'utente:
- Boarding multi-round tracker più esplicito (oggi `boardingDmNextRound` è un promemoria
  GM-applicato manualmente, non automatico)
- Ship catalog espanso (`data/shipCatalog.js`)
- Nuovo giro di audit rules-fidelity se emergono dubbi durante il play-test
- Rieseguire la suite E2E (non lanciata in questa sessione di bump doc — `npm run e2e`) per
  confermare i 236 test conteggiati staticamente sono ancora tutti verdi dopo l'audit3

---

## Note Tecniche

- `store.setState({...})` nei test Playwright per iniettare stato direttamente (evita
  `importBattleState` che richiede un `File` reale)
- `window.__ZUSTAND_*_STORE__` esposti solo in build non-production
- Boarding carry-over: `boardingDmNextRound` — applicato in UI (issue #54), non più solo un
  promemoria manuale
- Ogni nuovo campo di stato nave/drone va verificato nel round-trip export/import JSON +
  autosave IndexedDB (`exportBattleState`/`importBattleState`/`useAutosave` hanno whitelist
  esplicite dei campi battle-level; `drones[]`/`ships[]` sono invece salvati per intero, quindi
  nuovi campi *dentro* quegli oggetti non richiedono plumbing aggiuntivo, solo verifica) — vedi
  `feedback_save_autosave_check` in memoria
- Versioning: `package.json`, `package-lock.json` (solo i due campi "version" del progetto, MAI
  con replace_all cieco — rischio di toccare dipendenze omonime), `README.md`, `doc/field-manual.md`
  (header **e** footer — il footer era rimasto a v1.4.0 mentre l'header era già a 1.5.0, drift da
  correggere sempre insieme), `CHANGELOG.md` (Keep a Changelog) — vedi `feedback_release_workflow`
  in memoria
