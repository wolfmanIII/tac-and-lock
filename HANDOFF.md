# TAC & LOCK — Handoff Document

> Stato del progetto al 2026-06-27. Da leggere all'inizio di ogni nuova sessione prima di iniziare.

---

## Stato Attuale

**Versione**: 1.0.0-rc (tutte le feature pianificate implementate, nessun TODO aperto)

**Test**: 499 unit test (Vitest) + 79 E2E test (Playwright) — tutti verdi.

---

## Cosa è Implementato (completo)

### Meccaniche di gioco
- 7 range bands (Adjacent → Distant), TAC Speed cost, sensor time-lag DM
- Iniziativa: 2D6 + Tactics(naval) + INT DM, check opposto — B3 p.54
- Firing Solution 3-step: Sensor Operator (12+) → Pilot (10+) → Gunner (10+) — B3 p.56
- DM step 3: Fire Control software, EW jamming, Sensor Lock, Leading Fire, weapon traits, evasion
- Weapon traits: Accurate +1 / Slow −2 attacco; Advanced +1 / Obsolete −1 danno per dado
- Signature effettiva: base + hull <50%, power crit, EW active, + toggle GM (radiatori, heat sink, ecc.)
- Sand armour: `sandArmourBonus` somma ad armour corrente, consumato dopo ogni attacco

### Azioni Actions Phase (tutte implementate)
| Azione | Store action | Campo nave |
| --- | --- | --- |
| Sensor Lock | `applySensorLock(attId, tgtId, effect)` | `sensorLockDm` su target |
| Electronic Warfare | `applyEW(attId, tgtId, effect)` | `ewEffect`, `ewTarget` su jammer |
| EW Countermeasures | `updateShip(jammerId, { ewTarget: null, ewEffect: 0 })` | — |
| Leading Fire | `applyLeadingFire(dm)` | `leadingFireDm` (battle-level) |
| Overload Stutterwarp | `updateShip`, `addCriticalHit` | `currentTacSpeed` |
| Emergency Repair | `repairHull`, `reduceCriticalSeverity` | — |
| Active Sensors | `updateShip(id, { activeSensorsOn: true })` | `activeSensorsOn` |
| Evasive Action | `spendEvasion` | `evasionDm` |
| Deploy Sand | `deploySand(shipId)` | `sandArmourBonus += 1` |
| Point Defence | `reduceSalvoCount(missileId, amount)` | `pendingMissileImpacts[].salvoRemaining` |
| Damage Control | `removeHazard(shipId, hazardId)` | `hazards[]` |
| Boarding Action | `applyDamage`, `updateShip({ boardingDmNextRound })` | `boardingDmNextRound` |
| Repel Boarders | `updateShip({ boardingDmNextRound: 0 })` on success | — |

Tutti i campi per-round si resettano in `buildNextRoundState`.

### ShipDetailModal
- Pannello ACTIVE HAZARDS: add (testo libero) / remove; necessario per `damage_control`
- Toggle SIGNATURE CONDITIONS (6 flag GM)
- Evasion state display

---

## Struttura Chiave

```
src/store/battleStore.js   ← stato battaglia, tutte le action
src/components/modals/
  ActionModal.jsx          ← tutte le azioni Actions Phase
  AttackModal.jsx          ← Firing Solution + DM breakdown step 3 (legge sensorLockDm, ewEffect, leadingFireDm, sandArmourBonus)
  ShipDetailModal.jsx      ← sheet nave + hazards panel + signature toggles
src/data/crewActions.js    ← definizioni azioni (id, skill, difficulty, requiresTarget, reaction)
src/utils/combat.js        ← getWeaponTraitAttackDm, computeEffectiveSignature, computeAttackDMs, rollDamage
e2e/09-crew-actions.spec.js← test per tutte le azioni store-level
```

---

## Prossimi Passi Possibili

- **Bump versione a 1.0.0**: aggiornare `package.json` `"version"` da `"0.1.0"` → `"1.0.0"` e taggare `git tag v1.0.0`
- **Push remoto**: `git push && git push --tags`
- Feature post-1.0: boarding multi-round tracker, log più dettagliato boarding, ship catalog espanso

---

## Note Tecniche

- `reduceSalvoCount` legge `salvoRemaining` (non `count`) — bugfix introdotto in questa fase
- `store.setState({...})` nei test Playwright per iniettare stato direttamente (evita `importBattleState` che richiede un `File`)
- `importBattleState` chiama `importBattle(file)` → `parseJSONFile(file)` → richiede un File object reale
- Boarding carry-over: `boardingDmNextRound` — il GM lo inserisce manualmente come DM nel check del round successivo (la VTT non lo applica automaticamente al roll; è un promemoria visivo)
