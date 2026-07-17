# TAC & LOCK — Handoff Document

> Stato del progetto al 2026-07-17. Da leggere all'inizio di ogni nuova sessione prima di iniziare.

---

## Stato Attuale

**Versione**: 1.5.0 (tag `v1.5.0`)

**Test**: 588 unit test (Vitest) + 210 E2E test (Playwright) — tutti verdi.

**Issue tracker**: nessuna issue aperta. Il secondo audit rules-fidelity (2026-07-14) è
completamente chiuso — issue #1–#49 tutte risolte (bug reali corretti, meccaniche inventate
rimosse, citazioni B3/CRB verificate contro i PDF sorgente). Prossimo lavoro: nessuno pianificato,
in attesa di richiesta utente o di un nuovo audit.

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
  (Turret e Bay indipendenti — issue #45), turno nave chiuso da END SHIP'S TURN
- Firing Solution 3-step: Sensor Operator (12+) → Pilot (10+) → Gunner (10+) — B3 p.56, con
  Engineer assist opzionale a Step 1/2 e Captain Tactics assist a Step 3
- Drone/missili: unità individuali (`launchDrone`, non un modello a salvo), Firing Solution
  identica ma con hand-off sensori, DM+2 Pilot droni, e **lightspeed lag** DM−1 (owner↔drone a
  Long+, `drone.ownerBand`, distinto dal Sensor Time-Lag drone↔bersaglio) — B3 p.55, issue #49
- Signature effettiva: base + condizioni dinamiche (hull <50%, EW, reaction drive per tipo,
  stealth, ecc.) — `computeEffectiveSignature`
- Defensive Screens (Rating 1–3, solo laser), Targeting Systems (Light TTA/TTA/UTES/Drone
  Controller, DM−8 se assente), Fire Control software (0/+1/+2/+3)
- Point Defence: reazione intercettazione (DM+4 PDC/−2) + azione proattiva `engage` (trait Point
  Defence, DM+2, solo Close)
- Weapon traits: Accurate, Slow, Advanced, Obsolete, AP X, Auto X (Single/Burst/Full Auto),
  Radiation, Ortillery, Point Defence, Hardened, Inefficient, EM
- Critical hits: Surface Fixture (2D, hit su Effect≥3) + Internal (location 2D, severity =
  Effect−5 o precedente+1, cap 6/2) — tabelle corrette contro il PDF CRB p.169–170
- Boarding Actions: flat 2D6 + modificatori CRB p.175 (nessuno skill check), checkbox per
  Superior Armour/Weaponry/Skills&Tactics/Numbers + "no Marines" difensore — issue #29, #48

### Azioni Crew (`data/crewActions.js`, tutte implementate in `battleStore.js`/`ActionModal.jsx`)
| Azione | Ruolo | Store action | Campo nave |
| --- | --- | --- | --- |
| Commands (+ disobey-order) | captain | `applyCommand(shipId, role, dm)` | `commandBonus[]` (dm<0 = disobbedienza, issue #39) |
| Issue Order | captain | `grantExtraAction(shipId, role)` | `actionsRemaining[role]` +1 |
| Re-route Power | engineer | — (informativo, nessuna tabella B3) | — |
| Overload Stutterwarp | engineer | `updateShip({ currentTacSpeed })` | nessun fallimento (issue #27) |
| Boost Power Output | engineer | `addCriticalHit` su Effect≤−5 | `criticalTracks.powerPlant` (issue #37) |
| Emergency Repair | engineer | `repairHull` / `reduceCriticalSeverity` | — |
| Damage Control | engineer | `removeHazard` | `hazards[]` |
| Active Sensors | sensor_operator | `updateShip({ activeSensorsOn: true })` | +1 Signature |
| Electronic Warfare | sensor_operator | `applyEW(attId, tgtId, effect)` | `ewEffect`, `ewTarget` |
| Scan Target | sensor_operator | — (informativo) | — |
| Improve Critical | sensor_operator | `updateShip({ improveCriticalThreshold })` | consumato al prossimo colpo |
| Boarding Action | marine | `applyDamage`, `updateShip({ boardingDmNextRound })` | — |
| Repel Boarders | marine | helper roll condiviso, nessun check proprio | — |

Non esistono più (rimosse perché inventate, non B3): Sensor Lock (issue #3), Leading Fire
(sostituita da Commands), EW Countermeasures (issue #38), Deploy Sand, Improve Initiative
(issue #43). Tutti i campi per-round si resettano in `buildNextRoundState`.

### ShipDetailModal
- Pannello ACTIVE HAZARDS: add (testo libero) / remove
- Toggle SIGNATURE CONDITIONS + atmospheric/planetary condition
- Critical tracks, Commands attivi (incl. disobbedienza in rosso), Improve Critical banner

---

## Struttura Chiave

```
src/store/battleStore.js   ← stato battaglia, tutte le action, undo/redo, export/import/autosave whitelist
src/components/modals/
  ActionModal.jsx          ← tutte le azioni Crew (Commands, Boarding, ecc.)
  AttackModal.jsx          ← Firing Solution nave, DM breakdown step 3, mount turret/bay
  DroneAttackModal.jsx     ← Firing Solution drone/missile, Point Defence, engage
  ManoeuvreModal.jsx       ← Open/Close/Evade, GM override, banner combat-ended
  ShipDetailModal.jsx      ← sheet nave + hazards + signature toggles
src/data/crewActions.js    ← definizioni azioni (id, skill, difficulty, requiresTarget, reaction)
src/data/weapons.js        ← armi canoniche B3 + extended + CRB legacy, rangeDm per fascia
src/utils/combat.js        ← getWeaponTraitAttackDm, computeEffectiveSignature, computeAttackDMs, rollDamage
src/utils/rangeBands.js    ← moveBands, pairKey, computeEndedPursuits, getDroneLightspeedLagDm (data/rangeBands.js)
e2e/09-crew-actions.spec.js← test per tutte le azioni store-level
e2e/08-drones.spec.js      ← test drone/missile, Point Defence, lightspeed lag
e2e/06-manoeuvre.spec.js   ← test Open/Close/Evade, distant pursuit
```

---

## Prossimi Passi Possibili

Nessuno pianificato — il backlog delle issue rules-fidelity è a zero. Possibili aree future,
mai discusse con l'utente:
- Boarding multi-round tracker più esplicito (oggi `boardingDmNextRound` è un promemoria
  GM-applicato manualmente, non automatico)
- Ship catalog espanso (`data/shipCatalog.js`)
- Nuovo giro di audit rules-fidelity se emergono dubbi durante il play-test

---

## Note Tecniche

- `store.setState({...})` nei test Playwright per iniettare stato direttamente (evita
  `importBattleState` che richiede un `File` reale)
- `window.__ZUSTAND_*_STORE__` esposti solo in build non-production
- Boarding carry-over: `boardingDmNextRound` — il GM lo applica manualmente come DM al round
  successivo, non è automatico
- Ogni nuovo campo di stato nave/drone va verificato nel round-trip export/import JSON +
  autosave IndexedDB (`exportBattleState`/`importBattleState`/`useAutosave` hanno whitelist
  esplicite dei campi battle-level; `drones[]`/`ships[]` sono invece salvati per intero, quindi
  nuovi campi *dentro* quegli oggetti non richiedono plumbing aggiuntivo, solo verifica)
- Versioning: `package.json`, `package-lock.json` (solo i due campi "version" del progetto, MAI
  con replace_all cieco — rischio di toccare dipendenze omonime), `README.md`, `doc/field-manual.md`,
  `CHANGELOG.md` (Keep a Changelog) — vedi `feedback_release_workflow` in memoria
