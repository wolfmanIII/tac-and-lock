# Specifica di Implementazione — Redesign Combattimento Missili/Droni (fedele a 2300AD B3)

> Stato: **da implementare** — sostituisce interamente l'attuale `utils/missiles.js` / `MissileLaunchModal.jsx` / `MissileImpactModal.jsx`, basati su un modello "salvo" mai verificato contro il manuale.
> Origine: emerso durante la riverifica del 2026-07-01 di `doc/reactions-fix-spec.md` (vedi quel documento, §B) dopo un richiamo esplicito a non fidarsi della documentazione derivata e a verificare ogni regola contro il manuale primario.
> Fonte: `doc/Ebook - 2300AD core book 3.pdf`, testo estratto con `pdftotext`, p.52-61 (grep esatto su "salvo", "missile", "drone", "point defence", "remote ops" — nessuna invenzione, ogni affermazione sotto è citata testualmente o segnalata come interpretazione/semplificazione esplicita).

---

## 0. Perché il modello attuale non è fedele

Ricerca `salvo` sull'intero testo estratto (114 pagine): **zero occorrenze**. Il manuale non descrive mai un "salvo di N missili" con un singolo tiro d'attacco e DM+1 per missile rimanente (quello è un pattern del Traveller CRB classico, citato infatti nei commenti di `utils/missiles.js` come "Trav2022 CRB p.169").

2300AD B3 (p.55-56, "Fighter and Remote Pilot Actions" + "Firing Solution for a Fighter or Drone") descrive invece missili e droni come **unità pilotate a distanza che eseguono la Firing Solution completa a 3 step**, esattamente come una nave, su più round, con TAC Speed ed Endurance proprie (tabella "Combat Drones", p.61). L'intercettazione via Point Defence Cluster (p.56) colpisce inoltre **un bersaglio alla volta**, fino a un massimo di TL-4 bersagli per round — non un intero salvo con un tiro.

Questo documento ridisegna il sistema per riflettere questo modello.

---

## 1. Il modello B3 — citazioni esatte

### 1.1 Droni come "mini-navi" pilotate a distanza

> "Fighters and drones are very similar in usage, enough so that armed drones are often called remote fighters. Drones are subject to communications lag and jamming but are smaller and less expensive than crewed fighters. They are also expendable." — p.55

> "Pilot actions for fighters and drones are the same as for pilots of larger vessels. Drones use the Electronics (remote ops) skill in place of Pilot, however. Drones have DM+2 to all Pilot checks (subject to communication lag) while crewed fighter under 100 tons have DM+1." — p.55

> "Drones at Long range have a DM-1 to all actions due to lightspeed lag." — p.55 (riquadro)

**Manovra**: un drone/missile si avvicina al bersaglio esattamente come una nave (§5 del manuale, Open/Close/Evade — Pilot(DEX) opposto + TAC Speed), sostituendo Pilot con Electronics (remote ops), con **DM+2 fisso** (drone) o **DM+1** (caccia pilotato <100 ton) a tutti i check di pilotaggio, **DM−1 se il drone stesso è a Long range o oltre** dal proprio controllore (lag di comunicazione).

### 1.2 Firing Solution per un drone/missile

> "A fighter can either attempt to develop its own Firing Solution or accept a 'hand-off' from a sensor drone or nearby starship. [...] Fighters and drones use the same Firing Solution process, with a few key differences. Generating the Firing Solution, the first step, has the biggest changes. A fighter with an electronics officer can use this step as normal. Otherwise a fighter or drone pilot can use a Piloting action to develop a Firing Solution, as per normal, but with DM-2 to the check." — p.55

> "If the craft is able to accept a sensor lock from another vessel, it can do so without a penalty. In this case, the sensor operator for the other vessel or drone makes the sensor check. This requires one action from the sensor or drone operator but this one sensor check can provide the firing solution for multiple attackers. However, if the sensor platform is at Long range or greater, there is DM-1 due to lightspeed lag." — p.55-56

> "Once the firing solution is developed, the Effect is handed off to the next stage, the Pilot. This proceeds as normal. Drone operators use their Electronics (remote ops) skill for all Pilot checks. The Pilot action of Position Vessel is the key component of the fighter Firing Solution and is handled the same way as Position Vessel in any other Firing Solution." — p.56

**Step 1 (Sensor)**: due opzioni —
- **Hand-off** da un Sensor Operator di una nave/drone sensore vicino: nessuna penalità aggiuntiva al check in sé; **DM−1 se la piattaforma sensori è a Long range o oltre** (lightspeed lag). Un solo check può fornire la Firing Solution a più droni/missili contemporaneamente.
- **Auto-generata**: il Pilot del drone (Remote Pilot) usa un'azione di Piloting al posto dell'Electronics(sensors), **DM−2** al check, "come da normale" (stesso target 12+, stesse altre DM).

**Step 2 (Pilot/Position Vessel)**: eseguito dal Remote Pilot (equipaggio della nave madre, o il drone stesso se autonomo) via **Electronics (remote ops)** al posto di Pilot, con lo stesso DM+TAC Speed di un normale Step 2, più il DM+2/+1 fisso di §1.1, meno il DM−1 se il drone è a Long range dal controllore.

**Step 3 (Gunner/attacco)**: il manuale non descrive un meccanismo distinto per questo step nel caso di droni/missili — **non trovato esplicitamente nel testo estratto**. Dato che i missili nel catalogo armi (`aero12`, `kingfisher`) portano il trait `Smart` (CRB p.75, già autorizzato dalla gerarchia regole del progetto per i weapon traits), la soluzione più coerente — **non una citazione diretta, ma un'interpretazione esplicita** — è che lo Step 3 di un missile/drone risolva come un normale check Gunner (Difficult 10+, INT, Fire Control DM del lanciatore) con il trait Smart che permette di usare il TL più alto tra missile e nave lanciante. Va confermato o corretto se emergono altre fonti (es. *Aerospace Engineer's Handbook*, citato ma non incluso in `doc/`).

### 1.3 Intercettazione — uno alla volta, non a salvo

> "Point Defence: A conventional weapon mount can also be used in the point defence role [...]. Point defence requires a Difficult (10+) Gunner check (DEX), with DM-2 for missiles and drones under 10 tons. If a PDC is used, it receives DM+4 instead of DM-2, although PDCs are typically operated by the ship's computer." — p.55

> "Each incoming fighter or drone can be engaged by a Point Defence Cluster (PDC), up to a maximum number of targets equal to TL-4. This requires a Difficult (10+) Gunner check, adding the Fire Control score. Note that there is an additional DM+4 for a PDC." — p.56

Una nave con PDC può impegnare **fino a TL−4 bersagli distinti per round**, ciascuno con un proprio check Difficult(10+) Gunner (DEX) + Fire Control DM + DM+4 (PDC) o DM−2 (arma convenzionale). **Non esiste un "Effect = missili distrutti da un salvo"** — ogni intercettazione è un tiro singolo contro un singolo bersaglio, successo/fallimento.

### 1.4 Statistiche droni canonici (p.61) — mancanti in `data/weapons.js`

| Drone | TL | Danno | TAC Speed | Endurance | Traits |
| --- | --- | --- | --- | --- | --- |
| Ritage-1 | 11 | 1D | 3 | 6 ore (= 60 round) | — |
| Ritage-2 | 12 | 5D | 4 | 4 ore (= 40 round) | Blast 6, Radiation |
| 'Whiskey' | 12 | 1D laser / 3D det. laser | 4 | 2 ore (= 20 round) | Blast 3, Radiation (solo modalità detonazione) |

`aero12` e `kingfisher`, attualmente in `data/weapons.js`, sono citati con fonte p.70/p.110 (capitolo veicoli, non starship combat) — **non sono i droni canonici starship di p.61**. Vanno aggiunti `ritage1`, `ritage2`, `whiskey` come nuove voci.

---

## 2. Nuovo modello dati

### 2.1 `data/weapons.js` — aggiungere i droni canonici

```js
ritage1: {
  id: 'ritage1',
  name: 'Ritage-1 Combat Drone',
  mount: 'drone',
  TL: 11,
  damage: '1D',
  damageBonus: 0,
  optimalRange: 'Adjacent', // il drone si avvicina fino a distanza d'impatto
  tacSpeed: 3,
  enduranceRounds: 60, // 6 ore // 2300AD B3 p.61
  rangeDm: { Adjacent: 2, Close: 0, Short: -20, Medium: -20, Long: -20, VeryLong: -20, Distant: -20 },
  traits: ['Smart'],
  notes: 'French remote fighter drone. // 2300AD B3 p.61',
},
ritage2: {
  id: 'ritage2',
  name: 'Ritage-2 Combat Drone',
  mount: 'drone',
  TL: 12,
  damage: '5D',
  damageBonus: 0,
  optimalRange: 'Adjacent',
  tacSpeed: 4,
  enduranceRounds: 40, // 4 ore
  rangeDm: { Adjacent: 2, Close: 0, Short: -20, Medium: -20, Long: -20, VeryLong: -20, Distant: -20 },
  traits: ['Smart', 'Blast 6', 'Radiation'],
  notes: 'Nuclear x-ray laser warhead, single-shot, drone destroyed on use. // 2300AD B3 p.61',
},
whiskey: {
  id: 'whiskey',
  name: "'Whiskey' Light Drone",
  mount: 'drone',
  TL: 12,
  damage: '1D',       // modalità laser a batteria (ripetibile finché carica)
  damageBonus: 0,
  optimalRange: 'Adjacent',
  tacSpeed: 4,
  enduranceRounds: 20, // 2 ore
  rangeDm: { Adjacent: 2, Close: 0, Short: -20, Medium: -20, Long: -20, VeryLong: -20, Distant: -20 },
  traits: ['Smart'],
  detonationMode: { damage: '3D', traits: ['Smart', 'Blast 3', 'Radiation'] }, // modalità detonazione, single-use
  notes: "Kaefer ESA drone: battery laser (repeatable) or detonation laser (single use). // 2300AD B3 p.61",
},
```

**Rimuovere** `aero12`/`kingfisher` dal set "canonico primario" per il combattimento starship (restano disponibili come armi vettura/veicolo, fuori scope qui) o quantomeno separarli chiaramente in UI dai droni p.61.

### 2.2 `battleStore.js` — nuova entità `drones`

Sostituisce `missiles`/`pendingMissileImpacts`. Ogni drone lanciato è un'unità indipendente, non un contatore di salvo:

```js
/**
 * @typedef {{
 *   id: string,
 *   ownerId: string,        — nave lanciante
 *   targetId: string,
 *   weaponId: string,        — 'ritage1' | 'ritage2' | 'whiskey'
 *   currentBand: string,     — fascia rispetto al bersaglio
 *   roundsElapsed: number,
 *   destroyed: boolean,      — abbattuto da Point Defence
 *   detonated: boolean,      — ha colpito il bersaglio
 *   sensorLockSource: string | null, // shipId che fornisce il sensor hand-off, o null (auto-generata)
 * }} Drone
 */
drones: [],
```

**Azioni nuove**:
- `launchDrone(ownerId, targetId, weaponId)` — crea un drone a `currentBand = rangeBands[pairKey(ownerId, targetId)]`.
- `advanceDrone(droneId, netTacSpeed)` — riusa `resolveBasicBandMovement` (già esistente in `utils/rangeBands.js`) per avvicinare il drone di una fascia, esattamente come il Manoeuvre Step di una nave.
- `interceptDrone(droneId)` — segna `destroyed: true` (chiamato dopo un check Point Defence riuscito contro quel drone specifico).
- `resolveDroneAttack(droneId, netDamage)` — applica danno al bersaglio e segna `detonated: true` (rimuove il drone se non è "battery" ripetibile, come Whiskey in modalità laser).

**Rimuovere**: `missiles`, `pendingMissileImpacts`, `MISSILE_FLIGHT_ROUNDS`, `computeMissileAttackDM`, `resolvePointDefence`, `makeMissileSalvo`, `reduceSalvoCount`, `applyPointDefence` (o rinominarle/riadattarle se una parte è riusabile — verificare in fase di implementazione).

### 2.3 UI

- **`DroneLaunchModal.jsx`** (sostituisce `MissileLaunchModal.jsx`): sceglie arma drone + bersaglio; niente più "salvo size" — ogni drone lanciato è un'unità separata (se il GM vuole lanciarne 3, chiama `launchDrone` 3 volte, o l'UI espone uno stepper "quanti droni lanciare" che internamente crea N entità distinte).
- **Nuovo `DroneManoeuvreModal.jsx`** (o estensione di `ManoeuvreModal.jsx`): ogni round, i droni in volo si avvicinano al bersaglio col proprio TAC Speed — può essere automatizzato (il drone non ha motivo di non chiudere alla massima velocità, a meno che il bersaglio lo eviti) invece di richiedere un tiro Pilot esplicito ogni round, salvo il bersaglio tenti un'Evasione (che si oppone comunque al check del drone, quindi un tiro serve comunque quando il bersaglio evade).
- **Nuovo `DroneAttackModal.jsx`** (o generalizzazione di `AttackModal.jsx` per accettare un drone come "attaccante" invece di una nave): Step 1 con scelta hand-off/auto-generata, Step 2 via Electronics(remote ops), Step 3 Gunner con Smart trait.
- **Point Defence**: pannello inline nel modal di gestione del drone in arrivo (o in `ShipDetailModal` della nave bersaglio) — un tiro **per ogni drone individualmente in arrivo**, fino a TL−4 tiri per round se la nave ha una PDC.

---

## 3. Semplificazioni esplicite (dichiarate, non nascoste)

- **DM−1 "sensor platform a Long range"**: il testo non chiarisce se la distanza rilevante è tra piattaforma-sensori e bersaglio, o tra piattaforma-sensori e drone. Assunzione: stessa logica del normale Step 1 (distanza piattaforma→bersaglio), riusando `SENSOR_TIME_LAG_DM` già esistente semplificato a un flat −1 se banda ≥ Long, invece della tabella granulare. **Da confermare** se emergono altre fonti.
- **Step 3 Gunner per droni/missili**: nessun testo esplicito trovato — interpretazione basata sul trait CRB `Smart` (già autorizzato dalla gerarchia regole del progetto). **Da confermare**.
- **Whiskey doppia modalità** (laser a batteria ripetibile vs detonazione singolo uso): modellato con un campo `detonationMode` opzionale sull'arma; la UI deve permettere al GM di scegliere la modalità per round.
- **Endurance in round** (conversione ore→round a 6 minuti/round): 6h=60, 4h=40, 2h=20 — matematica diretta, non richiede interpretazione.

---

## 4. File impattati

| File | Modifica |
| --- | --- |
| `src/data/weapons.js` | + `ritage1`, `ritage2`, `whiskey`; chiarita separazione da `aero12`/`kingfisher` (fonte diversa, p.70/110) |
| `src/store/battleStore.js` | rimossi `missiles`/`pendingMissileImpacts` e relative azioni; nuova entità `drones` + `launchDrone`/`advanceDrone`/`interceptDrone`/`resolveDroneAttack` |
| `src/utils/missiles.js` | riscritto o rimosso; sostituito da logica drone basata su `utils/rangeBands.js` (riuso di `resolveBasicBandMovement`) |
| `src/components/modals/MissileLaunchModal.jsx` | sostituito da `DroneLaunchModal.jsx` |
| `src/components/modals/MissileImpactModal.jsx` | sostituito da `DroneAttackModal.jsx` (Firing Solution completa) + pannello Point Defence uno-a-uno |
| `src/components/battle/MissileTracker.jsx` | aggiornato per mostrare droni individuali (fascia corrente, round trascorsi, non più "salvo size N") |
| `src/components/ui/ContextMenu.jsx` | "Launch missiles…" → "Launch drone…"; eventuale nuova voce "Drone manoeuvre…"/"Drone attack…" per droni in gioco |
| `CLAUDE.md` | sezione missili aggiornata: rimossa terminologia "salvo", aggiunta Firing Solution drone, tabella droni p.61 |
| `doc/space-combat-rules.md` | §13 "Combattimento Missilistico" riscritta secondo questo modello |

---

## 5. Test E2E

- Lancio drone → verifica creazione entità singola con `currentBand` iniziale corretto e `enduranceRounds` dall'arma.
- Avanzamento drone su più round → verifica che si avvicini di una fascia per round (o resti fermo se il bersaglio evade con successo).
- Firing Solution drone Step 1 hand-off vs auto-generata → verifica DM corretti (nessuna penalità aggiuntiva vs −2).
- Point Defence uno-a-uno → verifica che un singolo check colpisca un solo drone, e che una nave con PDC possa tentare fino a TL−4 intercettazioni distinte nello stesso round.
- Scadenza endurance → drone rimosso/inerte se supera `enduranceRounds` senza impattare.
