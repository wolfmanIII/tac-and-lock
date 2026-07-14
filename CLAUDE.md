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
> Il CRB si usa per le tabelle di critical hit interno (p.158–159), weapon traits (p.78 — B3 cita erroneamente p.75, verificato via estrazione diretta del PDF, issue #42), e Boarding Actions (p.175 — B3 p.57 rimanda esplicitamente al CRB per queste regole).
> Dove B3 e CRB divergono, B3 vince sempre.

## GAME RULES SUMMARY

### Iniziativa — 2300AD B3 p.54

**Check opposto Tactics (naval) (INT)** — formula: `2D6 + Tactics(naval) + INT DM`

- Il **Capitano** (o lead tactician) di ogni nave effettua un check Tactics (naval) opposto.
- La nave con il risultato più alto muove e spara per prima. Ordine fisso per tutta la durata del combattimento.
- **NON usa Pilot skill né TAC Speed** (quella è la formula CRB — errata per 2300AD).

> Non esiste una regola di "Surprise" in 2300AD B3 p.52–62 (ricerca a testo pieno su B1 e B3: zero risultati). La riga precedente ("nave sorpresa non agisce nel primo round") era un residuo Trav2022 CRB p.164 mai verificato — stessa famiglia di errore della terminologia Manoeuvre/Attack/Actions Step (issue #19) — rimossa perché non implementata e non sourced.

### Round Structure (6 minuti) — 2300AD B3 p.53

> **Non esiste** una struttura "Manoeuvre Step → Attack Step → Actions Step" in 2300AD B3 — ricerca a testo pieno sui tre sourcebook 2300AD non trova questa terminologia da nessuna parte. È invece il sistema di combattimento spaziale generico del **Traveller 2022 CRB** (p.163–165: "1. Manoeuvre Step... 2. Attack Step... 3. Actions Step..."), che la gerarchia regole di questo progetto vieta esplicitamente di usare per le meccaniche core (CRB autorizzato solo per crit table interne e weapon traits). Era un'importazione mai verificata, corretta in un rework completo (issue #19).

B3 p.53 descrive invece un'economia di azioni **per membro d'equipaggio**, senza fasi rigide:

> *"Within each combat round, Travellers can take a number of actions on their turn equal to their skill level in the primary skill for their role... Some skills can be used multiple times in a combat round, while others cannot. Pilot, for example, can be used multiple times for multiple actions but Gunnery cannot."*

- Le navi agiscono in **ordine di Iniziativa** (invariato — fisso per tutta la battaglia).
- Al proprio turno, una nave non ha più "fasi": il GM può aprire liberamente Manoeuvre/Attack/Launch Drone/Crew Action per quella nave, quante volte vuole, finché ogni ruolo equipaggio ha azioni disponibili.
- Ogni **ruolo** (non la nave nel suo complesso) ha un budget di azioni/round = il proprio skill level nello skill primario del ruolo (`ship.actionsRemaining[role]`, calcolato da `buildActionBudget()` in `utils/crew.js`). **Gunnery è hard-capped a 1** (Fire Weapon / Deploy-Recharge Screens / Point Defence condividono lo stesso singolo uso).
- Il turno di una nave termina quando il GM clicca **END SHIP'S TURN** (bottone in HUD, non più legato a un singolo "hasActedThisPhase" — la nave può finire il turno anche con azioni residue).
- Il Capitano può anche **Issue Order** (B3 p.53, intro): spende una propria azione per dare **+1 azione** (non un DM) a un altro ruolo questo round — distinto da **Commands** (B3 p.54, DM+1/+2, attivo immediatamente questo round, cap sui comandi/round = livello Leadership del Capitano — non il suo budget azioni Tactics naval).

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

Il campo `rangeDm` in `data/weapons.js` codifica per ogni arma il DM per fascia secondo questa tabella universale (B3 p.57) applicato alla Range dell'arma stessa e a quelle inferiori — non è "0 alla Range massima": es. il Kaefer Grumbler ha Range Short, quindi anche al suo `rangeDm.Short` si applica la penalità −6 della tabella, non 0.

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
   - Engineer assist opzionale: Routine (8+) Engineer (power) INT — successo → Effect grezzo (min 0) come DM a questo check, stesso pattern del Captain assist allo Step 3 (B3 non dà una tabella a bande per questo assist, issue #26)
2. **Pilot** — Difficult (10+) Pilot DEX
   - DM positivi: +TAC Speed della nave
   - Engineer assist opzionale: Routine (8+) Engineer (power) INT — successo → DM a bande sul TAC Speed di *questo solo check* (Effect 1–4 → +1, Effect 5–6 → +2, B3 rimanda esplicitamente alla tabella di "Boost Tac Speed" p.54 — ma è un check **diverso**: Engineer (power) Routine 8+, non Engineer (stutterwarp) Difficult 10+ dell'azione crew standalone `overload_stutterwarp`; quell'azione, se già usata questo round, si somma comunque qui gratis via `attacker.currentTacSpeed`, issue #26)
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

Come Trav2022 CRB — B3 p.58 cita "p.158–159", ma in questo progetto (`doc/Traveller 2022 Core
Rulebook 20-02-2026.pdf`) quel range è contenuto Sensor Operations non correlato: la vera
Location table è a **p.169** stampata, la Effects table a **p.170** (verificato con estrazione
diretta del PDF, due volte). Sostituzioni B3, lette con attenzione (facili da invertire):

- La location "M-Drive" → **Reaction Drive**: **non** usa la tabella Severity di M-Drive — ha un
  proprio meccanismo **binario** (non una scala 1–6): 1° crit = inoperabile finché non riparato,
  2° crit = distrutto. Ignora del tutto la formula Effect-5 (vedi sotto) — avanza sempre di +1 per
  hit, mai di più, anche con un Effect altissimo.
- La location "J-Drive" → **Stutterwarp Drive**: riusa la tabella Severity di **M-Drive**
  (Thrust reinterpretato come TAC Speed, −1 per punto perso), non la propria tabella FTL.

Tabella location (2D):

| 2D | Sistema | 2D | Sistema |
| --- | --- | --- | --- |
| 2 | Sensors | 8 | **Reaction Drive** |
| 3 | Power Plant | 9 | Cargo |
| 4 | Fuel | 10 | **Stutterwarp Drive** |
| 5 | Weapon | 11 | Crew |
| 6 | Armour | 12 | Bridge |
| 7 | Hull | | |

**Severity**: `Severity = Effect dell'attacco − 5`, oppure (se il sistema ha già un critical hit)
`Severity precedente + 1`, **il maggiore dei due** — mai un semplice +1 fisso come nella build
precedente. Cap a 6 (2 per Reaction Drive). Implementato in `computeCriticalSeverity(effect,
prevSeverity, system)` + `getMaxSeverity(system)` in `data/criticalHits.js`, usati da
`CriticalHitModal.jsx` e `addCriticalHit(shipId, system, effect)` in `battleStore.js` — l'`effect`
dell'attacco scatenante viene passato nel payload della modale da `AttackModal.jsx`/
`DroneAttackModal.jsx`. "Computer" (location inventata) e "Stutterwarp (FTL)" (12° sistema
inventato, duplicato del vero Stutterwarp Drive) sono stati rimossi; "Cargo" (location reale,
prima assente) è stato aggiunto. Il rientro "6D danno extra ignorando Armatura quando un sistema è
già a Severity massima" (CRB p.169) resta puramente narrativo (nota informativa nella modale, come
tutti gli altri `mechanics` di questa tabella — vedi sotto), non applicato automaticamente.

> Nessuno dei campi `mechanics` per Internal Critical Hits o Surface Fixture Damage muta
> automaticamente lo stato di gioco (DM, TAC Speed, Hull, equipaggio) — sono testo descrittivo che
> il GM applica manualmente, stesso pattern delle azioni "informative" (`scan_target`,
> `re_route_power`). Automatizzarli sarebbe un cambio di design più ampio, fuori scope.

### Weapon Traits — 2300AD B3 p.59

| Trait | Effetto | Fonte |
| --- | --- | --- |
| Accurate | DM+1 ai roll di attacco | B3 |
| Advanced | +1 damage per dado | B3 |
| AP X | Ignora X punti di Armatura | B3 |
| Auto X | Selettore Single/Burst/Full Auto in `AttackModal.jsx` — CRB p.78. Burst: +X danno (un tiro). Full Auto: X tiri di danno separati contro lo stesso bersaglio (armatura applicata per tiro) | B3 (ref CRB) |
| Blast X | Max X bersagli aggiuntivi a Close range (non ancora implementato — multi-bersaglio) | B3 |
| EM | Roll aggiuntivo sulla crit table ad ogni crit | B3 |
| Hardened | Ignora il primo crit che subisce | B3 |
| Inefficient | Raddoppia il consumo di Power/heat | B3 |
| Obsolete | −1 damage per dado | B3 |
| Ortillery | DM+4 quando si attacca un bersaglio su superficie planetaria | B3 |
| Point Defence | DM+2 vs missili, droni e fighter. Solo a Close range — azione **proattiva** a check singolo (`getPointDefenceTraitAttackDm`, issue #24), distinta dalla reazione di intercettazione (DM+4/−2, sotto) | B3 |
| Radiation | Inflicts rads = Effect × 10 | B3 |
| Rapid Fire | **Nessuna valutazione numerica** — non definito nella tabella Weapon Traits di B3 (che definisce solo "Auto"), usato unicamente sul Quinn Type 17 PDC senza un rating. `getAutoScore()` restituisce sempre 0 per questo trait: il selettore Single/Burst/Full Auto non appare mai per questa arma — puramente narrativo (issue #11) | B3 weapon table |
| Slow | DM−2 ai roll di attacco | B3 |

### Point Defence — due meccaniche distinte, stesso check singolo — 2300AD B3 p.55–56, p.59

B3 descrive Point Defence sempre come **un singolo check Gunner** (mai la Firing Solution completa
a 3 step — droni/missili sono "troppo piccoli e veloci" per un target lock normale), ma in **due
varianti** con trigger e fonti di DM diverse:

| Variante | Trigger | DM | Funzione |
| --- | --- | --- | --- |
| **Reazione** (intercettazione) | Il drone/missile sta per attaccare — B3 p.55–56 | DM+4 (arma PDC) / DM−2 (generica) | `getPointDefenceDm(traits)` |
| **Proattiva** (engage) | Turno della nave bersaglio, drone già a Close range — B3 p.59 (trait arma) | DM+2 se l'arma ha il trait "Point Defence", solo Close range | `getPointDefenceTraitAttackDm(traits, rangeBand)` |

Entrambe condividono lo stesso singolo uso Gunner/round (issue #19 cap) e la stessa UI in
`DroneAttackModal.jsx`: `payload.mode` — `'defend'` (default, invariato: il proprietario del drone
risolve il proprio attacco, STEP_PD è la reazione dell'intercettazione) vs `'engage'` (nuovo:
la nave bersaglio spara proattivamente, screen STEP_ENGAGE, raggiungibile solo per droni a Close
range che la puntano — voce menu contestuale "Fire at incoming drone (Close)…", issue #24).

> **Fix issue #24**: l'intercettazione reattiva controllava i trait dell'**arma del drone in
> arrivo** invece dell'arma della **nave difendente** — nessun drone porta il trait "Point
> Defence", quindi il bonus +4 PDC non scattava mai nella pratica. Ora `DroneAttackModal.jsx` ha un
> selettore `InterceptWeaponPicker` (arma della nave, non del drone) usato da entrambe le
> varianti, con stato `interceptWeaponIdx`.

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

> `getFireControlDm(software)` è ora **solo software** (0/+1/+2/+3, mai una penalità) — issue #25.
>
> Nota: in 2300AD non esistono i software "Manoeuvre" e "Evade" del Trav2022 CRB. I profili nave usano `stutterwarp_control`, `fire_control_N`, `auto_repair_N`.

### Targeting Systems — 2300AD B3 p.62

Fonte DM **separata e stackabile** dal Fire Control software sopra — B3 distingue l'hardware fisico di puntamento (per singolo weapon mount) dal software che ci gira sopra.

> **DM−8 "nessun fire control"** (B3 p.62: *"a weapon without fire control suffers DM-8 on all attack rolls, including point defence"*) — la frase segue direttamente la tabella Targeting Systems (hardware), non quella software: appartiene qui, non a `getFireControlDm`. Corretto issue #25 (in precedenza era erroneamente agganciato all'assenza di software `fire_control_N`). `TARGETING_SYSTEMS`'s `'none'` ha `dm: -8`; `getTargetingSystemDm(weaponSlot)` lo applica automaticamente per qualunque weapon slot senza Targeting System assegnato — incluso il Point Defence, sia la reazione di intercettazione (`getPointDefenceDm`) che l'azione proattiva (`getPointDefenceTraitAttackDm`), entrambe in `DroneAttackModal.jsx` ora sommano anche `getTargetingSystemDm(interceptWeaponSlot)`. **Non applicato** all'attacco proprio dei droni/missili (`DroneAttackModal.jsx` step3Dms, `owner.software`) — un drone non ha uno slot `ship.weapons[]` associato (`launchDrone` non traccia l'indice, stesso gap di modello dati di issue #16), quindi non subisce mai né il DM hardware né la sua penalità, per costruzione. Dato che solo una minoranza degli slot arma nei profili canonici (`defaultProfiles.js`, `shipCatalog.js`) aveva già un Targeting System assegnato (issue #16, entry "w/UTES"/"w/KUTS"), tutti gli slot rimanenti hanno ricevuto `targetingSystem: 'light_tta'` di default (B3: *"most ships use Target Tracking Arrays"*) così le navi canoniche restano utilizzabili senza configurazione manuale.

| Targeting System | TL | Armi controllate | Fire Control DM |
| --- | --- | --- | --- |
| Light TTA | 11 | 4 | 0 |
| TTA | 10 | 10 | −1 |
| UTES | 12 | 1 (raro fino a 4) | +1 |
| Drone Controller | 10 | 2 | 0 |

- Campo `targetingSystem` per weapon slot (`ship.weapons[i].targetingSystem`, default `'none'`) — editabile in `ShipProfileForm.jsx` per ogni riga arma. `TARGETING_SYSTEMS` (array id/label/dm) e `getTargetingSystemDm(weaponSlot)` in `utils/combat.js`, applicato nello Step 3 di `AttackModal.jsx` (armi turret/bay, incluso il Grape Shot, la cui prosa B3 dice esplicitamente "guided by a TTA or UTES mount"). **Non applicato** ai droni/missili tracciati individualmente (`DroneAttackModal.jsx`) — `launchDrone` non associa un weapon slot specifico al lancio, servirebbe un cambio di modello dati più ampio, fuori scope (issue #16).
- **Drone Controller** è selezionabile per completezza profilo (le navi canoniche con "w/UTES"/"w/KUTS" nel label ora hanno `targetingSystem: 'utes'` nei dati di default) ma contribuisce **DM+0 e nessun limite droni** — B3 stesso dice "not exactly a targeting system"; il limite di 2 droni/controller è un sistema di risorse separato, non modellato, fuori scope.
- **Operate UTES Array** (Gunner Action, B3 p.53): se il weapon mount selezionato ha `targetingSystem === 'utes'`, il Gunner può sviluppare la Firing Solution da solo, bypassando il Sensor Operator — Very Difficult (12+) Gunner **EDU**. Successo: Effect 1–4 → DM+1, Effect 5–6 → DM+2 al **prossimo** Gunner check per quello stesso weapon slot. Poiché Gunnery è sempre hard-capped a 1 azione/round in questo motore (issue #19), sviluppare e sparare richiedono sempre **2 round separati** (il ramo B3 "se il gunner ha più di un'azione, stesso round" non è mai raggiungibile qui, per costruzione — non implementato). Campi nave: `utesSolutionDm` (1 o 2, null se non attivo), `utesSolutionSlotIdx` (indice in `ship.weapons[]`). Consumato dopo il primo tiro Gunner per quel weapon slot (hit o miss, `applyResults()`/tasto MISS in `AttackModal.jsx`), azzerato a inizio round successivo se non usato (`buildNextRoundState`). UI in `AttackModal.jsx`: blocco "OPERATE UTES ARRAY" nello screen SETUP (solo per weapon UTES-equipped senza soluzione attiva), banner "UTES SOLUTION READY" quando pronta, bottone BEGIN FIRING SOLUTION che salta direttamente a Step 2 (Pilot) senza spendere l'azione Sensor Operator.

### Defensive Screens — 2300AD B3 p.55, p.62

Nubi ablative/campi elettromagnetici che disperdono **fasci laser in arrivo** (non particle beam, non armi cinetiche, non testate missilistiche/submunition — la prosa di B3 dice esplicitamente "absorbing laser fire").

| Rating | TL | Power | Attack roll DM (vs laser) |
| --- | --- | --- | --- |
| 1 | 11 | 10 | −1 |
| 2 | 11 | 20 | −2 |
| 3 | 12 | 20 | −3 |

- Ogni hit di **laser** subito (indipendentemente dal danno) riduce il Rating attivo di 1 — un'arma non-laser (es. particle beam) non deplete lo schermo, coerentemente col DM che già si applica solo a `weapon.isLaser === true`.
- **Deploy or Recharge Screens** è una **Gunner Action** (B3 p.55, stesso elenco di Fire Weapon/Point Defence/Operate UTES Array) — il gunner quel round o spara o dispiega/ricarica lo schermo, non entrambi. Nessun check richiesto.
- "Deploy" (prima attivazione in battaglia) è gratuito; "Recharge" (dopo che è stato depleto) consuma una reload trasportata (`screenReloads`).
- Campi nave: `screenRating` (installato, 0 = nessuno), `screenReloads`, `screenDeployed`, `screenCurrentRating` (attivo, si deplete sugli hit).
- Implementato in `getScreenDm(target, weapon)` in `utils/combat.js` (applica il DM solo se `weapon.isLaser === true`); `deployScreens`/`rechargeScreens`/`depleteScreens` in `battleStore.js`. Il campo `isLaser` su ogni arma in `data/weapons.js` classifica quali armi sono considerate laser (inclusi i "detonation laser" nucleari di droni/submunition — B3 p.59–60) e quindi soggette agli schermi.

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

`name`, `class`, `hullPoints`, `currentHull`, `armour`, `tacSpeed`, `signature` (base value), `sensors` (type + DM), `computer` (model + bandwidth), `weapons[]` (`{ weaponId, count, label, targetingSystem? }` — B3 p.62), `software[]`, `criticalTracks` (11 track × 6 livelli di severità)

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
14. **Game Rules Fidelity**: Tutti i calcoli meccanici (DM, danno, TAC Speed, range bands, critical hits) devono corrispondere a **2300AD B3 p.52–62** come fonte primaria, con Trav2022 CRB usato solo per tabelle crit interno (p.158–159) e weapon traits (p.78). Segnalare qualsiasi ambiguità prima di implementare — verificare contro il PDF sorgente in `doc/`, non fidarsi della sola documentazione derivata. Software validi in 2300AD: `stutterwarp_control`, `fire_control_1/2/3`, `auto_repair_1/2`, `operations`, `intellect`, `archive` — NON `manoeuvre` o `evade_N`. Funzioni chiave in `utils/combat.js` già implementate: `getWeaponTraitAttackDm(traits)` (Accurate +1, Slow −2 all'attacco), `getPointDefenceDm(traits)` (DM+4 armi PDC / DM−2 non-PDC per la reazione di intercettazione — richiede i trait dell'arma della nave DIFENDENTE, non del drone in arrivo, fix issue #24) e `getPointDefenceTraitAttackDm(traits, rangeBand)` (DM+2 del trait arma "Point Defence" per l'azione proattiva `mode: 'engage'` in `DroneAttackModal.jsx`, solo Close range — issue #24; vedi sezione dedicata sopra per il dettaglio delle due varianti), `computeEffectiveSignature(ship)` (firma effettiva con tutti i modificatori dinamici B3 p.57, incluso `reactionDriveActive` che pesca il DM da `ship.reactionDriveType` — rocket +4/thruster +6/nuclear +8, default rocket — via `getReactionDriveSignatureDm`), `computeAttackDMs(params)` (include weaponTraitDm), `rollDamage(weaponId, count, armour, overrides?, damageMultiplier?, autoBurstBonus?)` (Advanced/Obsolete per die; `overrides` per warhead alternativi come Whiskey detonation mode; `damageMultiplier` per bersagli stazionari/reaction-drive; `autoBurstBonus` = fire mode Burst del trait Auto X, +score al danno — issue #11), `getAutoScore(traits)` (rating numerico di "Auto X", 0 per "Rapid Fire" o assenza del trait — CRB p.78), `rollFullAuto(weaponId, count, armour, overrides?, damageMultiplier?, n)` (fire mode Full Auto: n tiri di danno separati, armatura applicata per tiro, usato da `AttackModal.jsx` col selettore Single/Burst/Full Auto — issue #11), `isEasyTarget(target)`/`getEasyTargetAttackDm(target)`/`getEasyTargetDamageMultiplier(target)` (bersaglio stazionario o a reaction drive: DM+2, ×2 danno — B3 p.56), `getAtmosphericTargetDm(target)`/`getOrtilleryDm(traits, target)` (condizioni planetarie/atmosferiche e trait Ortillery — B3 p.56, p.59), `getFireControlDm(software)` (rating software Fire Control, 0/+1/+2/+3 — mai una penalità, issue #25), `getScreenDm(target, weapon)` (Defensive Screens, solo armi con `weapon.isLaser === true` — B3 p.62), `getTargetingSystemDm(weaponSlot)` (DM per-weapon-mount da `TARGETING_SYSTEMS` — Light TTA 0, TTA −1, UTES +1, Drone Controller 0, **None −8** — separato e stackabile dal Fire Control software; il DM−8 "nessun fire control" di B3 p.62 vive qui, non nel software, issue #25). Motore turni per-ruolo (issue #19): `buildActionBudget(crewAssignments, crew)` in `utils/crew.js` calcola `ship.actionsRemaining` a inizio round (skill level per ruolo, Gunnery = `min(1, skill)`); `spendCrewAction(shipId, role)` e `grantExtraAction(shipId, role)` (Captain's Issue Order, B3 p.53 — distinto da Commands) in `battleStore.js`. **Tutte le azioni crew sono implementate** in `store/battleStore.js` e `ActionModal.jsx`: `applyEW` (ruolo `sensor_operator`, Difficult 10+, Electronics/comms — B3 p.54) → `ewEffect` a bande fisse (Effect≥5 → −2, Effect≥0 → −1, Effect≤−5 → +1 backfire sul jammer) + `ewTarget`; non esiste "Sensor Lock" come azione — non è in B3 p.52–62, esiste solo nel Trav2022 CRB (fuori dallo scope CRB sanzionato per questo progetto) e non è implementata; `applyCommand(shipId, role, dm)` → scrive direttamente su `commandBonus[]` per-nave (un comando per livello di Leadership, cap enforced in `ActionModal.jsx` tramite `ship.actionsRemaining.captain`), attivo **immediatamente, questo round** (B3 dice letteralmente "for that combat round" — il Capitano "always acts first among the crew", quindi un Command dato presto nel turno della nave è già disponibile per le azioni successive dello stesso round degli altri ruoli; azzerato a inizio round successivo se non riemesso — sostituisce il precedente "Leading Fire" non canonico); `addHazard(shipId, label)` / `removeHazard(shipId, hazardId)` → `ship.hazards[]` GM-managed (ShipDetailModal). `scan_target` (Routine 8+, Electronics(sensors), DM−1/range band) è puramente informativo — nessuna mutazione di stato, il GM legge l'Effect dal roll banner e narra secondo Trav CRB p.151 — B3 p.54. `improve_critical` (Very Difficult 12+, Electronics(sensors), DM−1/range band): successo → `improveCriticalThreshold` (5, o 4 se l'Effect del check era ≥6) attivo **immediatamente per il prossimo colpo di questa nave, questo round** ("next shot this round" — singolare); consumato in `applyResults()`/`applyMiss()` di `AttackModal.jsx`/`DroneAttackModal.jsx` dopo il primo tentativo (hit o miss), non solo a fine round. **Operate UTES Array** (Gunner, Very Difficult 12+, EDU — B3 p.53, issue #16): successo → `ship.utesSolutionDm` (1 o 2) + `ship.utesSolutionSlotIdx` (indice weapon slot), applicato al **prossimo** Gunner check per quel weapon slot (round successivo sotto il cap Gunnery 1/round di questo motore); consumato in `applyResults()`/tasto MISS di `AttackModal.jsx` dopo il primo tiro, azzerato a inizio round successivo se non usato (`buildNextRoundState`).

consumato da `isInternalCriticalHit(effect, netDamage, hullCurrent, critThreshold)` — il 4° parametro sostituisce la soglia di default 6 — in `AttackModal.jsx`/`DroneAttackModal.jsx`, poi scade naturalmente a fine round (non serve un consumo esplicito, si azzera come `commandBonus` se non ridichiarato) — B3 p.54. `re_route_power` (Average 8+, Engineer(power), EDU): **puramente informativo come `scan_target`** — B3 non fornisce alcuna tabella Effect per questa azione (il libro rimanda esplicitamente all'"Aerospace Engineer's Handbook", un supplemento non presente in `doc/`, per gli effetti dettagliati sui radiator); nessuna mutazione di stato, il GM narra la ridistribuzione di potenza (es. ripristino temporaneo di un sistema offline da un Power Plant/Radiator critical) — B3 p.54. Combattimento droni/missili: `launchDrone(ownerId, targetId, weaponId)` crea un'unità individuale (nessun concetto di "salvo" — B3 p.55–56); `interceptDrone(droneId)` risolve Point Defence uno-a-uno; `detonateDrone(droneId)` consuma l'unità dopo l'attacco (hit o miss). Boarding: `boardingDmNextRound` carry-over su nave vincitrice, reset a fine round. `updateShip(shipId, { ewTarget: null, ewEffect: 0 })` per cancellare un jam.

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
│   │   ├── HUD.jsx               ← Round/stage/iniziativa overlay + budget azioni per-ruolo + END SHIP'S TURN/NEXT ROUND + exit confirm
│   │   ├── BattleLog.jsx         ← Log eventi collassabile, color-coded
│   │   ├── PhaseTracker.jsx      ← Ordine iniziativa, evidenzia la nave attiva (currentActorIndex)
│   │   ├── ContextMenu.jsx       ← Right-click menu (gated su isCurrentActor + stage 'combat'; nessuna fase Manoeuvre/Attack/Actions — vedi Round Structure; Resolve drone attack per drone propri in range)
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
│   ├── battleStore.js            ← Stato battaglia (navi, fascia, drones[] individuali, round, stage setup/initiative/combat, actionsRemaining per-ruolo, commandBonus, undo/redo)
│   └── uiStore.js                ← Modal open state, nave selezionata, context menu
├── utils/
│   ├── combat.js                 ← getWeaponTraitAttackDm, getPointDefenceDm, computeEffectiveSignature, computeAttackDMs, rollDamage, getAutoScore, rollFullAuto, getTargetingSystemDm, crits
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

### Tema visuale (sorgente: manuali ufficiali 2300AD, issue #44)

> La palette **non** è più quella riusata da thrust-and-drift (slate/zinc + neon-cyan, generico dark-sci-fi). È stata ricampionata dai PDF ufficiali (`doc/Ebook - 2300AD core book 1/2/3.pdf` — copertine + pagine interne 5/52/57) via render `pdftoppm` + sampling PIL, poi sintetizzata in due rampe scure (le pagine dei manuali sono chiare, ma questo resta un HUD da tavolo per sessioni lunghe — vedi issue #44 per il ragionamento completo). Nessun cyan/neon nell'identità reale del libro: acciaio gunmetal, bronzo/oro metallico, pergamena, inchiostro nero-caldo.

```css
/* Fonts */
font-display: 'Orbitron' (headers/labels)
font-mono: 'Share Tech Mono' (body/values)

/* Palette @theme — src/index.css */
--color-gunmetal-{50..950}   /* rampa steel/carbone caldo, sostituisce slate. 800 ≈ pannello copertina, 200 ≈ pergamena pagine interne */
--color-bronze-{200..950}    /* rampa oro/ottone, sostituisce sky + il vecchio --neon-cyan. 400 = #d9a94f, campionato dal logotipo di copertina */
--color-steel: #91a3ad;      /* accento metallico freddo, campionato dal bevel del logo — uso manuale sporadico, non parte del replace meccanico */
/* base: gunmetal-950 bg, gunmetal-200 text */
```

I colori semantici (`red`/`amber`/`emerald`/`violet` per danno/successo/warning/EW) restano le classi Tailwind di default — non fanno parte dell'identità grafica del libro, sono scelte funzionali indipendenti.

### Stato navi — differenze rispetto a thrust-and-drift

- Nessun `position: {q,r}` / `vector: {q,r}` — posizione = `rangeBand` (string, chiave coppia)
- Nessun `inDogfight` con hex grid — dogfight attivo quando `rangeBand === 'Adjacent' | 'Close'`
- `jump` → `stutterwarp` (rating motore stutterwarp)
- Critical tracks: 11 sistemi — `sensors`, `powerPlant`, `fuel`, `weapon`, `armour`, `hull`, `reactionDrive`, `cargo`, `stutterwarpDrive`, `crew`, `bridge` (nessun `jumpDrive`/`mDrive` — vedi Internal Critical Hits sopra)

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
