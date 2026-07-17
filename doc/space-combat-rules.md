# Tac-and-Lock — Regole del Combattimento Spaziale

## Fonte: 2300AD Core Book 3 p.52–62 (primario) | Trav2022 CRB: solo crit interno p.158–159, weapon traits p.78

> **Nota 2300AD**: in 2300AD il Manoeuvre Drive del Traveller standard non esiste.
> Il movimento tattico è fornito dallo **Stutterwarp Drive**, che produce una statistica di velocità tattica.
> Il termine **TAC Speed** (Tactical Speed) è usato in questa VTT come proxy per il rating del motore
> stutterwarp usato in combattimento (definito formalmente nei supplementi di design navale 2300AD:
> *Aerospace Engineer's Handbook* e *Ships of the Frontier*).
> Ovunque nel Traveller CRB si legga "Thrust", in 2300AD si intende **TAC Speed**.
> Una nave senza Stutterwarp non ha TAC Speed e non può manovrare tatticamente.

---

## 1. Struttura del Round di Combattimento

Il round spaziale dura **6 minuti** (eccezione: dogfight = 6 secondi).

> **Non esiste** una struttura "Manoeuvre Step → Attack Step → Actions Step" in 2300AD B3 — ricerca a testo pieno sui tre sourcebook 2300AD non trova questa terminologia da nessuna parte. È il sistema di combattimento spaziale generico del **Traveller 2022 CRB** (p.163–165), che questo progetto vieta esplicitamente di usare per le meccaniche core. Era un'importazione mai verificata contro B3, corretta in un rework completo (issue #19).

B3 p.53 descrive un'economia di azioni **per membro d'equipaggio**, senza fasi rigide:

> *"Within each combat round, Travellers can take a number of actions on their turn equal to their skill level in the primary skill for their role... Some skills can be used multiple times in a combat round, while others cannot. Pilot, for example, can be used multiple times for multiple actions but Gunnery cannot."*

```text
1. Le navi agiscono in ORDINE DI INIZIATIVA (fisso per tutta la battaglia).
2. Al proprio turno, una nave non ha fasi: manovra, attacco, lancio droni e azioni
   equipaggio sono tutti disponibili liberamente, in qualsiasi ordine, finché ogni
   RUOLO ha ancora azioni nel proprio budget (skill level nello skill primario del
   ruolo; Gunnery hard-capped a 1 — Fire Weapon / Deploy-Recharge Screens /
   Point Defence condividono lo stesso singolo uso).
3. Il GM termina il turno di quella nave (bottone END SHIP'S TURN) quando vuole,
   anche con azioni residue — poi passa alla nave successiva in iniziativa.
```

Il Capitano può anche **Issue Order** (B3 p.53, paragrafo introduttivo): spende una propria azione per dare **+1 azione** (non un DM) a un altro ruolo, questo round — distinto da **Commands** (B3 p.54, DM+1/+2, si attiva al round successivo — vedi nota aperta al §12).

Una volta che ogni nave ha terminato il proprio turno, se ci sono ancora navi in combattimento, il round ricomincia (nuova Iniziativa, budget azioni ricalcolato per ogni nave).

---

## 2. Iniziativa — 2300AD B3 p.54

**Formula:** check **Tactics (naval)** opposto (INT) — `2D6 + Tactics(naval) + INT DM`

- Il **Capitano** (o lead tactician) di ogni nave effettua un check **Tactics (naval) opposto**.
- La nave con il risultato più alto muove e spara per prima.
- In caso di parità, risolvere con un ulteriore tiro opposto.
- L'iniziativa è fissa per tutta la durata del combattimento.
- In caso di **sorpresa**, la nave sorpresa non può agire nel primo round.

---

## 3. Fascie di Distanza (Range Bands)

> Scala light-second. Ogni fascia = ½ light second (~150.000 km). Cinque volte la scala Trav2022 CRB. — 2300AD B3 p.52

| Range Band | Distanza (km) | TAC Speed richiesto per muoversi |
| --- | --- | --- |
| Adjacent | < 100 | 1 |
| Close | ≤ 150.000 | 1 |
| Short | 150.001 – 300.000 | 2 |
| Medium | 301.000 – 450.000 | 5 |
| Long | 450.001 – 600.000 | 10 |
| Very Long | 600.001 – 750.000 | 25 |
| Distant | > 750.000 | 50 |

Gli scontri iniziano tipicamente a **Long range**.  
La grande maggioranza delle armi è efficace **solo a Close range** o meno.  
A **Close** o **Adjacent** si attivano le regole del **Dogfight**.

### TAC Speed per muoversi

- Il valore nella tabella è il **TAC Speed** necessario per **spostare di una fascia** (avvicinandosi o allontanandosi).
- Il TAC Speed è fornito dallo **Stutterwarp Drive** della nave. Una nave senza Stutterwarp non può manovrare tatticamente.
- Si può accumulare TAC Speed su più round per attraversare una fascia.
- **Due navi che si avvicinano**: sommare i TAC Speed dedicati al movimento.
- **Una che fugge**: sottrarre il TAC Speed più basso dall'altro — la più veloce guadagna o perde terreno.

### Combat Manoeuvring (1 TAC Speed per manovra)

Il TAC Speed non usato per il movimento può essere speso per:

| Manovra | Skill | Effetto |
| --- | --- | --- |
| Aid Gunners | Pilot check | Avvia una task chain con i gunner |
| Docking | Pilot check; se l'altra nave non vuole: opposed Pilot check, **DM-2 alla nave che abborda** | Abbordaggio possibile se successo |
| Evasive Action | — | Riserva TAC Speed residuo per schivare (vedi Reazioni) |

---

## 4. Ruoli dell'Equipaggio

Ogni membro deve essere assegnato a un ruolo prima del combattimento.  
Può esserci **un solo Pilot e un solo Captain**; tutti gli altri ruoli ammettono più persone.  
È possibile cambiare ruolo come azione (Reassignment).

| Ruolo | Funzione principale |
| --- | --- |
| **Pilot** | Manovrare la nave, schivare gli attacchi |
| **Captain** | Comando, tattica, iniziativa |
| **Engineer** | Motori, riparazioni, gestione energia |
| **Sensor Operator** | Sensori, guerra elettronica |
| **Turret Gunner** | Uno per torretta |
| **Bay Gunner** | Uno per weapon bay |
| **Remote Pilot** | Pilota droni e missili — Electronics (remote ops) // B3 p.53 |
| **Marine** | Abbordaggio / difesa da abbordaggio |
| **Passenger** | Nessuna azione di combattimento |

### Ruoli automatizzati (software)

| Software | Sostituisce |
| --- | --- |
| Fire Control/x | Gunner (può fare x attacchi automatici o dare DM ai gunner) |
| Auto-Repair/x + repair drones | Engineer (damage control) |
| Intellect + Expert (engineer/pilot/electronics-sensors) | Engineer / Pilot / Sensor Operator |

> **Nota 2300AD**: I software "Manoeuvre" e "Evade" del Trav2022 CRB **non esistono** in 2300AD. L'evasion è un check Pilot attivo (§11), non un software passivo.

---

## 5. Movimento e Manovra

Ogni nave (in ordine di Iniziativa) distribuisce il suo **TAC Speed** tra:

1. Movimento (cambio di fascia) — Open/Close — check Pilot opposto (DEX), adding TAC Speed
2. Combat manoeuvring
3. **Evade** — azione separata (vedi §11); non è "TAC Speed rimanente" come nel CRB

---

## 6. Firing Solution (Attacco)

### Firing Solution (Task Chain) — 2300AD B3 p.56

L'attacco è una **catena di check**. Ogni Effect positivo si trasferisce come DM al check successivo.

**Step 1 — Sensor Operator**: Very Difficult (12+) Electronics (sensors) **INT**

- DM: +Signature del bersaglio; +Sensor Time-lag (tabella sotto); qualità sensori (Basic Military +0, Improved +1, Advanced +2)
- Assist Engineer (opzionale, issue #26): Routine (8+) Engineer (power) **INT** — successo → Effect grezzo (min 0) come DM a questo check, RollBlock inline in `AttackModal.jsx` prima del tiro principale. Nessuna tabella a bande data da B3 per questo assist specifico — stesso pattern del Captain assist allo Step 3
- **Operate UTES Array** (Gunner Action, B3 p.53, issue #16): se il weapon mount selezionato ha `targetingSystem === 'utes'`, il gunner può sviluppare la Firing Solution da solo per quello slot, bypassando del tutto lo Step 1 (Sensor Operator, nessuna sua azione spesa). Very Difficult (12+) Gunner **EDU**. Successo: Effect 1–4 → DM+1, Effect 5–6 → DM+2 al **prossimo** Gunner check per quello stesso weapon slot. Poiché Gunnery è sempre cap 1 azione/round in questa VTT (§4/issue #19), sviluppare e sparare richiedono sempre **2 round separati** — il ramo B3 "se il gunner ha più di un'azione, stesso round" non è mai raggiungibile qui. Stato: `ship.utesSolutionDm` (1 o 2) + `ship.utesSolutionSlotIdx`, consumato dopo il primo tiro Gunner per quel weapon slot, azzerato a inizio round successivo se non usato.

**Step 2 — Pilot**: Difficult (10+) Pilot **DEX**

- DM: +TAC Speed della nave
- Assist Engineer (opzionale, issue #26): Routine (8+) Engineer (power) **INT** — successo → DM a bande sul TAC Speed di *questo solo check* (Effect 1–4 → +1, Effect 5–6 → +2; B3 rimanda alla tabella di "Boost Tac Speed" p.54 per i numeri, ma è un check **distinto** — Engineer (power) Routine 8+, non Engineer (stutterwarp) Difficult 10+ dell'azione crew standalone `overload_stutterwarp`). Non scrive su `ship.currentTacSpeed` (bonus effimero, solo per questo tiro) — se l'Engineer ha già usato `overload_stutterwarp` prima nello stesso round, quel bonus persistente si somma comunque qui gratis, perché questo step legge già `attacker.currentTacSpeed`

**Step 3 — Gunner**: Difficult (10+) Gunner **INT** — target 10+

- DM: +Fire Control software rating (0/+1/+2/+3, mai una penalità); +Targeting System hardware del weapon mount selezionato (Light TTA/TTA/UTES — separato e stackabile dal Fire Control software, tabella sotto, B3 p.62 — **DM−8 se il mount non ha nessun Targeting System assegnato**, incluso il point defence: la frase "a weapon without fire control suffers DM-8" segue direttamente la tabella Targeting Systems in B3 p.62, non quella software — issue #25); +Effect accumulato dagli step 1–2; +weapon trait (Accurate +1, Slow −2)
- DM aggiuntivi automatici: −`ewEffect` (propria nave è sotto EW jam); +evasione bersaglio (applicata anche allo Step 1, non solo qui — B3 p.54); +`commandBonus` se il Capitano ha dato un Command a `gunner_turret` questo round (§12); +`utesSolutionDm` se una Operate UTES Array precedente è ancora attiva per questo weapon slot (sopra); +2/×2 danno se il bersaglio è stazionario o in reaction drive (§ sotto); DM da condizione planetaria/atmosferica del bersaglio (§ sotto); +4 (Ortillery) se l'arma ha quel trait e il bersaglio è su superficie planetaria; −Rating Defensive Screens del bersaglio, solo armi laser (§ sotto)
- Assist Captain (opzionale, distinto dal Command): Difficult (10+) Tactics (naval) **INT** — roll inline nello Step 3, il suo Effect si somma solo a quel singolo tiro

> Bersagli stazionari o in movimento a reaction drive (non stutterwarp): DM+2 e **danno doppio** — la Firing Solution diventa banale. — B3 p.56

### Targeting Systems — 2300AD B3 p.62

Fonte DM separata e stackabile dal Fire Control software (§4) — hardware di puntamento per singolo weapon mount, non software di bordo.

| Targeting System | TL | Armi controllate | Fire Control DM |
| --- | --- | --- | --- |
| **None** | — | — | **−8** |
| Light TTA | 11 | 4 | 0 |
| TTA | 10 | 10 | −1 |
| UTES | 12 | 1 (raro fino a 4) | +1 |
| Drone Controller | 10 | 2 | 0 |

Campo `targetingSystem` per weapon slot (`ship.weapons[i].targetingSystem`), editabile in `ShipProfileForm.jsx`. Applicato alle armi turret/bay attaccate via `AttackModal.jsx` (incluso Grape Shot, "guided by a TTA or UTES mount" — B3 p.59) e, dopo issue #25, anche a entrambe le varianti di Point Defence in `DroneAttackModal.jsx` (reattiva e proattiva) tramite un selettore d'arma della nave difendente (`interceptWeaponSlot`, issue #24) — **non** all'attacco proprio del drone/missile stesso (`step3Dms`, `owner.software`), che non ha un'attribuzione stabile a un weapon slot di lancio. Drone Controller è selezionabile per completezza profilo ma contribuisce DM+0 e nessun limite droni ("not exactly a targeting system" — B3; il limite di 2 droni/controller è un sistema di risorse separato, non modellato).

> Solo una minoranza degli slot arma nei profili canonici (`defaultProfiles.js`, `shipCatalog.js`) aveva già un Targeting System assegnato (issue #16, entry "w/UTES"/"w/KUTS"). Con l'introduzione del DM−8 per `'none'` (issue #25), tutti gli slot rimanenti hanno ricevuto `targetingSystem: 'light_tta'` di default (B3: "most ships use Target Tracking Arrays") — altrimenti la maggior parte delle navi canoniche attaccherebbe a DM−8 finché il GM non configura manualmente ogni arma.

### DM di distanza per l'attacco — 2300AD B3 p.57

> La grande maggioranza delle armi è efficace **solo a Close range**. Short è il massimo per armi con Range "Short" (es. Kaefer Grumbler).

| Fascia | DM all'attacco |
| --- | --- |
| Adjacent | +2 |
| Close | +0 |
| Short | −6 |
| Medium+ | N/A — nessuna arma da nave standard arriva |

Condizioni situazionali del bersaglio (indipendenti dalla fascia, si applicano sempre):

| Condizione bersaglio | DM all'attacco |
| --- | --- |
| Superficie planetaria (con atmosfera) | −6 |
| Superficie planetaria (senza atmosfera) | −4 |
| In volo atmosferico | −2 |

Il trait **Ortillery** (DM+4 vs bersagli su superficie planetaria, con o senza atmosfera) si somma a queste condizioni se l'arma lo possiede.

### Sensor Time-lag — 2300AD B3 p.47

Si applica allo Step 1 della Firing Solution (check sensori). DM-1 per ogni fascia di distanza tra le navi.

| Fascia | DM sensori |
| --- | --- |
| Adjacent | +1 |
| Close | +0 |
| Short | −1 |
| Medium | −2 |
| Long | −3 |
| Very Long | −4 |
| Distant | −5 |

### Signature — 2300AD B3 p.57

Ogni nave ha una **Signature base** (dal suo stat block B3). È un valore sempre positivo usato come DM positivo ai check Electronics (sensors) nemici (incluso lo step 1 della Firing Solution). Si ricalcola a fine round.

| Azione / Condizione | Effetto su Signature |
| --- | --- |
| Danno > 50% Hull | +1 |
| Electronic Warfare attivo | +2 |
| Heat Sink (durata limitata) | −4 |
| Power Plant Critical | +1 |
| Radiatori retratti | −1 |
| Reaction Drive in uso | +4 razzi / +6 thruster / +8 nucleare |
| Sensor attivi (TTA, UTES) | +1 |
| Solar Panels estesi | +2 |
| Spin Habitat ritirato | −1 |
| Stealth | −4 |

### Defensive Screens — 2300AD B3 p.55, p.62

Nubi ablative/campi elettromagnetici che disperdono **fasci laser in arrivo** — B3: "Defensive screens help blunt incoming laser fire... absorbing laser fire". **Non funzionano contro particle beam, armi cinetiche, o testate missilistiche/submunition** (queste ultime, però, sono a loro volta classificate come "detonation laser" nucleari — B3 p.59-60 — quindi *sono* soggette agli schermi).

| Rating | TL | Power | DM all'attacco (solo laser) |
| --- | --- | --- | --- |
| 1 | 11 | 10 | −1 |
| 2 | 11 | 20 | −2 |
| 3 | 12 | 20 | −3 |

- Ogni hit di **laser** subito (indipendentemente dal danno inflitto) riduce il Rating attivo di 1 — un'arma non-laser (es. particle beam) non deplete lo schermo.
- **Deploy or Recharge Screens** è una **Gunner Action** (stesso elenco B3 p.55 di Fire Weapon / Point Defence / Operate UTES Array): il gunner quel round o spara **o** dispiega/ricarica lo schermo — non entrambi. Nessun check richiesto.
- **Deploy** (prima attivazione in battaglia): gratuito, porta il Rating attivo al Rating installato.
- **Recharge** (dopo che è stato depleto): consuma una reload trasportata, riporta il Rating attivo al Rating installato.
- Solo uno schermo attivo alla volta (nessuna nave ne ha più di uno installato in questo progetto).

### Scala danno spacecraft vs ground

| Attaccante → Bersaglio | DM to hit | Danno |
| --- | --- | --- |
| Ground weapon → Spacecraft | −2 | ÷10 |
| Spacecraft weapon → Ground target | +2 | ×10 |

---

## 7. Armi Spaziali Canoniche 2300AD — B3 p.60–61

### Laser

| Arma | TL | Range | Danno | Traits |
| --- | --- | --- | --- | --- |
| Darlan LL-88 | 10 | Close | 1D−1 | Obsolete, Accurate |
| Darlan LL-98 | 11 | Close | 2D | Accurate |
| Darlan G2 (Laser Drill) | 10 | Adjacent | 1D−1 | Obsolete |
| Quinn Type 17 PDC | 12 | Adjacent | 1D | Point Defence, Rapid Fire |
| Kaefer 'Grumbler' | 12 | Short | 2D+2 | Advanced, Inefficient |

### Particle Beam

| Arma | TL | Range | Danno | Traits |
| --- | --- | --- | --- | --- |
| Allen BMZ-50 | 11 | Close | 3D | AP 4, EM, Inefficient, Slow |

### Combat Drones — B3 p.61

| Drone | TL | Danno | TAC Speed | Endurance | Traits |
| --- | --- | --- | --- | --- | --- |
| Ritage-1 | 11 | 1D | 3 | 6 ore | — |
| Ritage-2 | 12 | 5D | 4 | 4 ore | Blast 6, Radiation |
| 'Whiskey' (Kaefer) | 12 | 1D laser / 3D det. | 4 | 2 ore | Blast 3, Radiation |

### Auto X — fire mode Single/Burst/Full Auto (issue #11)

Il trait `Auto X` (B3 p.59: "As described on page 75 of the Traveller Core Rulebook")
è implementato in `AttackModal.jsx` come selettore **Single / Burst / Full Auto**,
visibile solo per armi che portano il trait (es. Kaefer Tri-Beamer `Auto 3`, Mitraille
Grape Shot `Auto 4`):

- **Single**: tiro normale, nessun bonus.
- **Burst** (default): un solo tiro di danno, +X (Auto score) al totale — `rollDamage(...,
  autoBurstBonus)`.
- **Full Auto**: X tiri di danno separati contro lo stesso bersaglio, armatura applicata
  per tiro (armi corazzate riducono ogni volley separatamente) — `rollFullAuto(...)` in
  `utils/combat.js`.

Il trait **Rapid Fire** (Quinn Type 17 PDC) non ha un valore numerico e non è definito
in nessuna tabella Weapon Traits di CRB/B3 (che definisce solo "Auto") — `getAutoScore()`
restituisce sempre 0 per questa arma, quindi il selettore non appare mai: resta puramente
narrativo, coerente con il suo ruolo di Point Defence già modellato altrove.

Per Grape Shot, `Auto 4` e `Blast 4` non si sommano: `Auto` risolve contro un singolo
bersaglio (Burst/Full Auto come sopra), mentre `Blast X` (bersagli multipli aggiuntivi a
Close range) resta non implementato — nessun doppio conteggio.

---

## 8. Danno alla Nave — 2300AD B3 p.56–58

```text
Danno = danno arma − Armatura
```

> **Nota B3**: l'Effect del Gunner check **non si somma al danno**. Determina solo se scattano gli effetti critici (Surface Fixture, Internal Crit). Questa è una differenza rispetto al Trav2022 CRB.

Il danno netto (dopo armatura) viene sottratto dagli **Hull Points**.  
Se gli Hull Points arrivano a 0: la nave è **distrutta**.

### Surface Fixture Damage — Effect ≥ 3

Qualsiasi hit con **Effect ≥ 3** triggerizza un roll sulla Surface Fixture table (§9), **anche se il danno non penetra l'armatura**.

### Internal Critical Hits — danno netto > 0 + Effect ≥ 6 (o hull a 0)

Quando il danno penetra l'armatura, seguire la tabella Internal Critical Hits (§10) usando CRB p.158–159 con le sostituzioni B3.

---

## 9. Surface Fixture Damage — 2300AD B3 p.58

Trigger: **Effect ≥ 3** su qualsiasi hit (anche non penetrante). Tirare 2D:

B3 stampa solo colonne 1° Hit / 2° Hit per Fire Control, Weapon e Sensors — nessuna
escalation a "Destroyed" al 3° hit nella fonte (issue #35). La colonna 3° Hit sotto è
mostrata solo dove B3 la definisce davvero (Discharge Vanes, Other System).

| 2D | Sistema | 1° Hit | 2° Hit | 3° Hit |
| --- | --- | --- | --- | --- |
| 2 | Fire Control | DM−2 ai roll di attacco | — | — |
| 3–4 | Weapon | −1D Damage, DM−2 ai roll di attacco | Disabled | — |
| 5 | Sensors | DM−2 ai check Electronics (sensors) | — | — |
| 6–8 | Radiator | (vedi regole Radiator) | — | — |
| 9 | Sensors | DM−2 ai check Electronics (sensors) | — | — |
| 10–11 | Discharge Vanes (se presenti; altrimenti nessun effetto) | Disabled | Destroyed | — |
| 12 | Other System | Disabled | Destroyed | — |

**Radiator** — il 1° e 2° hit non hanno effetto. 3° hit: Signature +2. 4° hit: Power deve essere ridotto al 50% o la nave subisce 1 Internal Crit ogni round. 5° hit: Power completamente spento o 1D danno/round + 1 Internal Crit/round.

---

## 10. Internal Critical Hits — CRB (location p.169 / effetti p.170 in questo progetto) + sostituzioni B3

Trigger: danno netto > 0 **e** (Effect ≥ 6 oppure Hull scende a 0). B3 p.58 cita "CRB p.158–159",
ma in `doc/Traveller 2022 Core Rulebook 20-02-2026.pdf` quel range è Sensor Operations non
correlato — verificato con estrazione diretta del PDF (due volte): la vera Location table è a
p.169, la Effects table a p.170.

**Tabella location (2D):**

| 2D | Sistema | 2D | Sistema |
| --- | --- | --- | --- |
| 2 | Sensors | 8 | **Reaction Drive** |
| 3 | Power Plant | 9 | Cargo |
| 4 | Fuel | 10 | **Stutterwarp Drive** |
| 5 | Weapon | 11 | Crew |
| 6 | Armour | 12 | Bridge |
| 7 | Hull | | |

**Sostituzioni B3 p.58** — facili da invertire, lette con attenzione dal testo:

| Sostituzione | Regola B3 |
| --- | --- |
| Location "M-Drive" → **Reaction Drive** | Meccanismo binario proprio, **non** la tabella Severity di M-Drive: 1° crit = inoperabile finché non riparato; 2° crit = distrutto. Ignora la formula Effect-5 sotto — avanza sempre di +1 per hit, mai oltre Severity 2, indipendentemente da quanto alto sia l'Effect. |
| Location "J-Drive" → **Stutterwarp Drive** | Riusa la tabella Severity di **M-Drive** (Thrust reinterpretato come TAC Speed, −1 per punto perso), non la propria tabella FTL. |

**Severity**: `Severity = Effect dell'attacco − 5`, oppure (se il sistema ha già subito un
critical hit) `Severity precedente + 1` — **il maggiore dei due** (CRB p.169). Cap a 6 (2 per
Reaction Drive, vedi sopra). Implementato in `computeCriticalSeverity(effect, prevSeverity,
system)` + `getMaxSeverity(system)` in `data/criticalHits.js`.

> Quando un sistema è già a Severity massima, CRB p.169 prevede 6D danno extra (ignorando
> Armatura) invece di un nuovo critical — non automatizzato, la modale mostra solo una nota
> informativa per il GM, stesso trattamento degli altri `mechanics` di questa tabella (testo
> descrittivo, nessuna mutazione automatica di stato — vedi nota generale sotto).

**Effetti per Severity 1–6** (tabella CRB p.170, systems aggiornati per 2300AD):

### Sensors

| Sev | Effetto |
| --- | --- |
| 1 | Tutti i check sensori DM-2 |
| 2 | Inoperativi oltre Medium |
| 3 | Inoperativi oltre Short |
| 4 | Inoperativi oltre Close |
| 5 | Inoperativi oltre Adjacent |
| 6 | Sensori disabilitati |

### Power Plant

| Sev | Effetto |
| --- | --- |
| 1 | Power -10% |
| 2 | Power -10% |
| 3 | Power -50% |
| 4 | Power a 0 |
| 5 | Hull Severity +1, Power a 0 |
| 6 | Hull Severity +1D, Power a 0 |

### Fuel

| Sev | Effetto |
| --- | --- |
| 1 | Perdita: -1D tonnellate/ora |
| 2 | Perdita: -1D tonnellate/round |
| 3 | Perdita: -1D x 10% del carburante |
| 4 | Fuel tank distrutto |
| 5 | Fuel tank distrutto, Hull Severity +1 |
| 6 | Fuel tank distrutto, Hull Severity +1D |

### Weapon

| Sev | Effetto |
| --- | --- |
| 1 | Arma casuale DM-1 quando usata |
| 2 | Arma casuale disabilitata |
| 3 | Armi casuali distrutte |
| 4 | Arma casuale esplode, Hull Severity +1 |
| 5 | D3 armi esplodono, Hull Severity +1 |
| 6 | 1D armi esplodono, Hull Severity +1 |

### Armour

| Sev | Effetto |
| --- | --- |
| 1 | Armatura -1 |
| 2 | Armatura -D3 |
| 3 | Armatura -1D |
| 4 | Armatura -1D |
| 5 | Armatura -2D, Hull Severity +1 |
| 6 | Armatura -2D, Hull Severity +1 |

### Hull

| Sev | Effetto |
| --- | --- |
| 1 | 1D danno aggiuntivo |
| 2 | 2D danno aggiuntivo |
| 3 | 3D danno aggiuntivo |
| 4 | 4D danno aggiuntivo |
| 5 | 5D danno aggiuntivo |
| 6 | 6D danno aggiuntivo |

### Reaction Drive (location 8 — meccanismo binario, non scala 1-6)

Ignora del tutto la formula Effect-5 — avanza sempre di +1 per hit, mai oltre Severity 2,
indipendentemente da quanto alto sia l'Effect (`computeCriticalSeverity` lo special-casa).

| Sev | Effetto |
| --- | --- |
| 1 | Reaction Drive inoperabile finché non riparato |
| 2 | Reaction Drive distrutto |

### Cargo

| Sev | Effetto |
| --- | --- |
| 1 | 10% del cargo distrutto |
| 2 | 1D x 10% del cargo distrutto |
| 3 | 2D x 10% del cargo distrutto |
| 4 | Tutto il cargo distrutto |
| 5 | Tutto il cargo distrutto, Hull Severity +1 |
| 6 | Tutto il cargo distrutto, Hull Severity +1 |

### Stutterwarp Drive (location 10 — riusa la tabella Severity di M-Drive, Thrust → TAC Speed)

| Sev | Effetto |
| --- | --- |
| 1 | Tutti i check per controllare la nave DM-1 |
| 2 | DM-1; TAC Speed -1 |
| 3 | DM-1; TAC Speed -1 (come stampato) |
| 4 | DM-1; TAC Speed -1 (come stampato) |
| 5 | TAC Speed a 0 |
| 6 | TAC Speed a 0, Hull Severity +1 |

### Crew

| Sev | Effetto |
| --- | --- |
| 1 | Occupante casuale prende 1D danno |
| 2 | Life support cessa entro 1D ore |
| 3 | 1D occupanti prendono 2D danno |
| 4 | Life support cessa entro 1D round |
| 5 | Tutti gli occupanti prendono 3D danno |
| 6 | Life support cessa |

### Bridge

| Sev | Effetto |
| --- | --- |
| 1 | Postazione casuale disabilitata |
| 2 | Computer riavvia; software non disponibile questo round e il prossimo |
| 3 | Computer danneggiato, Bandwidth -50% |
| 4 | Postazione casuale distrutta; occupante prende 1D×1D danno |
| 5 | Computer distrutto |
| 6 | Postazione casuale distrutta; occupante prende 1D×1D danno; Hull Severity +1 |

> Nessuno degli effetti sopra (né quelli di Surface Fixture Damage, §9) muta automaticamente lo
> stato di gioco (DM, TAC Speed, Hull, equipaggio) — sono testo descrittivo che il GM applica
> manualmente, stesso pattern delle azioni informative (`scan_target`, `re_route_power`, §12).

---

## 11. Reazioni — 2300AD B3 p.54–55

### Evade — Pilot

**Check opposto Pilot (DEX)**. Il pilot evadente dichiara Evade; il check avviene in opposizione al Pilot check (step 2 della Firing Solution) del nemico.

| Effect del Pilot evadente | Effetto su tutti i check Electronics (sensors) e Gunner del nemico |
| --- | --- |
| Effect 1–4 | DM−1 |
| Effect 5+ | DM−2 |
| Effect −5 o peggio | il nemico guadagna DM+1 |

> **Nota B3**: NON è "TAC Speed rimanente × Pilot skill" come nel CRB. È un check attivo opposto.

### Point Defence — Gunner (turret/PDC) — due varianti, stesso check singolo

B3 tratta Point Defence sempre come **un singolo check Gunner** (mai la Firing Solution completa
a 3 step: droni/missili sono "troppo piccoli e veloci" per un target lock normale), ma descrive
**due situazioni distinte**:

#### Reazione (intercettazione) — B3 p.55, rinforzato p.56

**Difficult (10+) Gunner (DEX)**

- DM−2 per missili e droni sotto 10 tonnellate (arma non PDC)
- PDC (es. Quinn Type 17): DM+4 invece di DM−2 (confermato indipendentemente su p.55 e p.56)
- Colpisce **un drone/missile alla volta** — non un intero salvo con un tiro (B3 non descrive un concetto di "salvo"; vedi §13). Una PDC può tentare fino a TL−4 intercettazioni distinte per round (p.56)
- Solo una volta per round per gunner; arma usata non può attaccare nello stesso round
- **Il DM dipende dall'arma della nave DIFENDENTE che intercetta** (es. il proprio Quinn Type 17
  PDC), non dall'arma del drone in arrivo — bug corretto issue #24: `DroneAttackModal.jsx` ora ha
  un selettore (`InterceptWeaponPicker`, stato `interceptWeaponIdx`) sulle armi della nave
  bersaglio, usato per calcolare `getPointDefenceDm`.

#### Proattiva (engage) — trait arma "Point Defence", B3 p.59

**DM+2, solo Close range** — non è una reazione: è un'azione Gunner **proattiva**, disponibile
durante il proprio turno contro un drone/missile nemico già a Close range, prima ancora che
attacchi. Distinta dalla reazione sopra (fonte, trigger e formula DM diversi — non va confusa con
essa). Implementata come `mode: 'engage'` in `DroneAttackModal.jsx` (screen STEP_ENGAGE),
raggiungibile dal menu contestuale "Fire at incoming drone (Close)…" solo per droni a Close range
che puntano quella nave. `getPointDefenceTraitAttackDm(traits, rangeBand)`: DM+2 se l'arma
selezionata ha il trait "Point Defence" e il drone è a Close range, altrimenti 0. Condivide lo
stesso singolo uso Gunner/round delle altre azioni Gunner (Fire Weapon, Deploy/Recharge Screens,
intercettazione reattiva, Operate UTES Array).

Successo in entrambe le varianti: `interceptDrone(droneId)` — il drone è distrutto prima di poter
attaccare.

---

## 12. Azioni Equipaggio — Captain / Engineer / Sensor Operator / Marine — 2300AD B3 p.53–55

> Titolo storico "Step 3 — Actions Step" rimosso (issue #19) — non esiste più una fase separata: queste sono semplicemente le azioni disponibili ai ruoli Captain/Engineer/Sensor Operator/Marine, spendibili in qualsiasi momento del turno di una nave, ciascuna dal proprio budget azioni/round (§1).

### Captain

- **Commands**: Routine (8+) Leadership **INT o SOC**. Effect 1–4: DM+1 a un membro crew scelto (un ruolo). Effect 5–6: DM+2. Crew che disobbedisce: DM−1. Cap per round = `ship.actionsRemaining.captain` (skill Leadership del Capitano assegnato), condiviso con Tactics assist e Issue Order. Attivo **immediatamente, questo round** — B3 dice letteralmente "for that combat round"; il Capitano "always acts first among the crew" (B3 p.53), quindi un Command dato presto nel turno della nave è già disponibile per le azioni successive dello stesso round degli altri ruoli. Salvato per-nave come `commandBonus`, azzerato a inizio round successivo se non riemesso. Applicato automaticamente se il target è `gunner_turret` (AttackModal) o `pilot` (ManoeuvreModal evasione); per gli altri ruoli il GM lo somma a mano.

- **Issue Order** (`grantExtraAction`) — nessun check, B3 p.53 paragrafo introduttivo: il Capitano spende una propria azione per dare **+1 azione** (non un DM) a un altro ruolo, questo round. Distinto da Commands (sopra).
- **Tactics** (assist al Gunner): come da Firing Solution step 3 — Difficult (10+) Tactics (naval) **INT**. Roll opzionale inline nello Step 3 dell'AttackModal, distinto da Commands: il suo Effect si somma solo a quel singolo tiro Gunner, non persiste tra round; costa un'azione dal budget condiviso del Capitano.

> Nota: "Leading Fire" (Tactics naval, bonus a tutti gli attacchi della nave, DM battle-wide) non è una regola B3 — non compare nel manuale a p.54. Era un mix homebrew mai verificato contro il manuale, sostituito da Commands + Tactics assist sopra.

### Engineer

- **Re-route Power** — Average (8+) Engineer (power) **EDU**. **Puramente informativo/narrativo** (stesso pattern di Scan Target): B3 non fornisce alcuna tabella Effect per questa azione — il libro rimanda esplicitamente all'"Aerospace Engineer's Handbook" (supplemento non presente in `doc/`) per gli effetti dettagliati sui radiator. Nessuna mutazione di stato: il GM narra la ridistribuzione di potenza (es. ripristino temporaneo di un sistema offline da un Power Plant/Radiator critical). // B3 p.54
- **Boost Power Output**: Difficult (10+) Engineer (power) **EDU**. Successo: Effect% aumento Power. Effect −5 o peggio: critical hit Power Plant.

> Nota: "Boost Power Output" è documentata qui ma **non implementata** in `crewActions.js`/`ActionModal.jsx` — gap trovato durante il lavoro sulla #18, non ancora tracciato in una issue dedicata. "Boost Tac Speed" (= `overload_stutterwarp`, riga sotto) invece **è implementata** — la nota qui sopra la includeva erroneamente, corretto durante la #27.

- **Overload Stutterwarp** — Difficult (10+) Engineer (stutterwarp) **INT**: porta il motore oltre i limiti di sicurezza. Successo: Effect 1–4 → TAC Speed +1, Effect 5–6 → +2 questo round. Nessuna conseguenza in caso di fallimento. // B3 p.54
- **Emergency Repair** ("Damage Control team") — Difficult (10+) **Mechanic** (1D minuti, INT): ripara un danno nella fase corrente. // B3 p.56–57
  - Modalità *Critical System*: riduce la severity di un critical hit track di 1.
  - Modalità *Hull*: ripristina **5 Hull Points**.
  - Riparazione temporanea (dura 1D ore); se nuovo critical hit sulla stessa location: ricominciare da capo.
  - Hull damage e armi distrutte NON sono riparabili in combattimento.

### Reload Turret — Gunner

- Qualsiasi Traveller con la skill Gunner
- La torretta non può attaccare in quel round

### Point Defence — Gunner (turret/PDC)

**Reaction — Difficult (10+) Gunner (DEX)** // B3 p.55–56

- Si dichiara nel `DroneAttackModal` (`mode: 'defend'`, default), prima o al posto della risoluzione dell'attacco, contro **un drone/missile specifico alla volta** — non un intero salvo con un tiro (B3 non ha un concetto di "salvo"; ogni drone/missile è un'unità pilotata individualmente, vedi §13).
- Successo: `interceptDrone(droneId)` distrugge quel drone.
- PDC (Quinn Type 17): DM+4; armi non-PDC vs missili/droni < 10 ton: DM−2 (`getPointDefenceDm`, `utils/combat.js`) — calcolato sull'arma della nave **difendente** selezionata via `InterceptWeaponPicker`, non sull'arma del drone in arrivo (fix issue #24).
- Un gunner può fare point defence **una volta per round**; l'arma usata non può attaccare nello stesso round. Una PDC può tentare fino a TL−4 intercettazioni distinte per round (GM-tracked, non enforced automaticamente).

**Variante proattiva ("engage")** — trait arma "Point Defence" B3 p.59, non una reazione: DM+2
solo Close range, azione Gunner durante il proprio turno contro un drone già in range, prima che
attacchi. `mode: 'engage'` in `DroneAttackModal.jsx`, menu contestuale "Fire at incoming drone
(Close)…", `getPointDefenceTraitAttackDm(traits, rangeBand)` — issue #24.

> Nota: "Deploy Sand"/sandcaster non è una regola 2300AD B3 — ricerca a testo pieno del manuale (114 pagine) non trova alcuna occorrenza di "sand". Era un'importazione integrale dal Traveller CRB, che la gerarchia regole del progetto autorizza solo per le tabelle di crit interno e i weapon traits, non per meccaniche intere. Rimosso.

### Sensor Operator

- **Active Sensors** — Easy (6+) Electronics (sensors): attiva il sweep attivo dei sensori. Successo: Signature della nave +1 per questo round e i successivi finché non disattivato (flag `activeSensorsOn`). Rivela posizioni nascoste e salvi di missili a Very Long o Distant range. // B3 p.57
- **Electronic Warfare** — Difficult (10+) Electronics (comms): disturba i lock del bersaglio. Successo: Effect 1–4 → il bersaglio subisce **DM−1** a Gunner questo round; Effect 5–6 → **DM−2**; Effect ≤−5 → il bersaglio ottiene invece **DM+1** (ha triangolato le emissioni del jammer). Il DM è salvato come `ewEffect` sulla nave bersaglio (`ewTarget` punta alla nave che sta subendo il jam) e applicato automaticamente allo step 3 Gunner. // B3 p.54
- **Scan Target** — Routine (8+) Electronics (sensors), DM−1 per fascia di distanza. Effect 1–3: info di base alla fascia attuale (Trav CRB p.151). Effect 4–5: info come se il bersaglio fosse una fascia più vicino. Effect 6: come se fosse due fasce più vicino. **Puramente informativo** — nessuna mutazione di stato, il GM narra il risultato leggendo l'Effect dal roll banner. // B3 p.54
- **Improve Critical** — Very Difficult (12+) Electronics (sensors), DM−1 per fascia di distanza. Successo: il **prossimo colpo** ("next shot **this round**", singolare) della Firing Solution di questa nave critica a Effect 5+ invece di 6+ (o 4+ se questo check aveva Effect ≥6). Attivo **immediatamente, questo round** — salvato come `ship.improveCriticalThreshold`, consumato da `isInternalCriticalHit(..., critThreshold)` in `AttackModal.jsx`/`DroneAttackModal.jsx` **dopo il primo tentativo di fuoco** (hit o miss, in `applyResults()`/`applyMiss()`), non solo a fine round; azzerato anche a inizio round successivo se non ridichiarato. // B3 p.54

> Nota: "Sensor Lock" non è un'azione 2300AD B3 — non esiste in B3 p.52–62 (compare solo nel Trav2022 CRB, fuori dallo scope CRB autorizzato per questo progetto). Rimosso; il concetto B3 più vicino è "Scan Target", una meccanica diversa (informativa, non un DM+ agli attacchi).

> Nota: "EW Countermeasures" (skill inventato "Electronics (countermeasures)", contro-jam) non è un'azione 2300AD B3 — ricerca a testo pieno del PDF B3: la regola Electronic Warfare (p.53 e p.56, testo identico in entrambe le occorrenze) nomina solo Electronics (comms) per il check di jamming ed Electronics (sensors) per "altri electronic warfare task". Nessuna specializzazione "(countermeasures)" e nessuna azione per annullare un jam nemico attivo compaiono in B3 p.52–62. Rimosso — issue #38.

### Damage Control — Engineer / Mechanic

**Average (8+) Mechanic (o Engineer) INT o EDU** // B3 p.55

- Ferma o rallenta un **pericolo attivo**: incendio, breccia di scafo, perdita carburante, radiazione.
- I pericoli attivi sono tracciati come **Hazards** su ciascuna nave — aggiunti manualmente dal GM (ShipDetailModal, sezione HAZARDS) quando un critical hit genera un effetto secondario continuativo.
- Successo: rimuove un hazard scelto dalla lista. Effect 4+: il pericolo è **soppresso per 1D round** (GM narrazione; rimane nella lista con tag "soppresso").
- Fallimento: nessun effetto — il pericolo continua.

### Boarding Action — Marine // Trav2022 CRB p.175 (richiamato da 2300AD B3 p.57)

- Solo a **Adjacent range**, in qualsiasi momento del turno della nave (budget azioni Marine)
- Ogni round di boarding si risolve con un **check opposto** (attacker vs defender).
- **Formula attaccante**: 2D + modificatori. **Nessuno skill check** — CRB p.175 non prevede skill, characteristic DM o difficulty threshold.
- **Formula difensore**: 2D + modificatori. Stesso principio.
- **Differenza** (attaccante − difensore) determina il risultato dalla tabella sottostante.
- La VTT gestisce un round di boarding alla volta; il GM traccia i round totali separatamente.

#### Modificatori Boarding Action

| Condizione | DM |
| --- | --- |
| Armatura superiore | +1 |
| Armamento superiore | +1 |
| Skill e tattica superiori | +2 |
| Numero superiore | +1 |
| Numero vastamente superiore | +3 |
| Difensore senza Marine di turno | -2 |

#### Risultati Boarding Action

| Differenza (att − dif) | Risultato | Danno Hull automatico |
| --- | --- | --- |
| −7 o meno | Attaccanti sconfitti; difensore può contrattaccare con DM+4 | — |
| −4 a −6 | Attaccanti sconfitti; devono ritirarsi o vengono catturati/uccisi | — |
| −1 a −3 | Combattimento continua; difensore DM+2 al prossimo round | 2D Hull alla nave difensore |
| 0 | Combattimento continua | — |
| 1 a 3 | Combattimento continua; attaccante DM+2 al prossimo round | 2D Hull alla nave difensore |
| 4 a 6 | Boarding riuscito; 2D round per pacificare | 1D ignorando Armatura |
| 7 o più | Boarding immediato; controllo della nave passa agli attaccanti | — |

> Il danno Hull segnato come "automatico" viene applicato dalla VTT quando il GM clicca APPLY RESULT. I DM carry-over al prossimo round si salvano come `boardingDmNextRound` sulla nave vincitrice e vengono inseriti manualmente dal GM al prossimo check boarding.

### Repel Boarders — Marine (Reaction)

**Nessuno skill check** — difensore // Trav2022 CRB p.175

- Reaction: si dichiara quando la propria nave viene abbordante.
- Fornisce il **tiro difensore** per la risoluzione boarding: 2D + modificatori, nessuno skill.
- Il risultato viene usato nel calcolo (attaccante − difensore) della tabella sopra.
- **DM+2** se la nave ha marines assegnati ai ruoli di difesa.

### Reassignment — chiunque

- Cambia ruolo; nessuna altra azione in questo round; nuovo ruolo attivo dal round successivo

---

## 13. Combattimento Droni/Missili — 2300AD B3 p.55–56, p.61

> Ricerca a testo pieno del manuale (114 pagine, `pdftotext`): **zero occorrenze** di "salvo". Missili e droni sono **unità pilotate a distanza che eseguono la Firing Solution completa a 3 step**, non un "lancia e dimentica, un tiro all'impatto" con bonus per missile rimanente (quel modello è preso dal Traveller CRB p.169 e non corrisponde a B3). Vedi `doc/drone-combat-redesign-spec.md` per l'analisi completa.

### Lancio

- Ogni drone/missile è un'**unità individuale** (`launchDrone`) — lanciarne N significa creare N unità distinte, non un contatore di salvo.
- Statistiche canoniche (p.61): Ritage-1 (TAC Speed 3, Endurance 6h = 60 round), Ritage-2 (TAC Speed 4, Endurance 4h = 40 round, single-shot), 'Whiskey' (TAC Speed 4, Endurance 2h = 20 round, batteria ripetibile o detonazione single-use).
- Ogni round, il drone si avvicina di una fascia verso il bersaglio (come il movimento di una nave, semplificato a "chiude sempre alla massima velocità" — vedi `doc/drone-combat-redesign-spec.md` §2.3), finché non raggiunge Close/Adjacent (fascia d'ingaggio) o supera la propria Endurance (va inerte).

### Firing Solution del drone — B3 p.55–56

**Step 1 — Sensor/Firing Solution generation**: due opzioni —

- **Hand-off** da un Sensor Operator di una nave/drone sensore vicino: nessuna penalità aggiuntiva; DM−1 se la piattaforma sensori è a Long range o oltre (lightspeed lag).
- **Self-generated**: il Remote Pilot della nave lanciante usa un'azione di Piloting al posto di Electronics(sensors), **DM−2** al check. Stesso target 12+ in entrambi i casi.

**Step 2 — Position Vessel**: Remote Pilot, **Electronics (remote ops) DEX**, Difficult (10+), +TAC Speed del drone, +carry Effect Step 1. Droni hanno DM+2 fisso a questo check (subject to comms lag); caccia pilotati <100 ton hanno DM+1 (semplificazione: non ancora automatizzato).

**Step 3 — Gunner**: Difficult (10+), +Fire Control della nave lanciante, +range DM alla fascia corrente del drone, +carry Effect Step 2, +DM reattivi del bersaglio (evasione, sensor lock, EW).

### Contromisure

- **Point Defence**: vedi §11/§12 — intercetta **un drone alla volta**, non un intero salvo.
- **Electronic Warfare**: Difficult (10+) Electronics (sensors) contro il sensor operator che fornisce l'hand-off (non ancora automatizzato nel drone attack modal).
- **Fuga**: aumentare la fascia di distanza (raro, guadagna tempo).

### Impatto

- Danno: roll danno singolo (`rollDamage`, con `detonationMode` per Whiskey se il GM sceglie la modalità detonazione). L'Effect del check **non si somma al danno** (come per le armi normali — B3 p.56 nota).
- Dopo l'attacco (hit o miss), il drone viene consumato (`detonateDrone`) — tutti i droni canonici attuali sono warhead single-shot nella modellazione corrente; vedi `doc/drone-combat-redesign-spec.md` §3 per la nota sulla possibile natura multi-shot di Ritage-1/Whiskey batteria, non ancora implementata per mancanza di conferma testuale precisa.

---

## 14. Dogfighting (Close/Adjacent)

Attivo quando due navi sono a distanza ≤ 10 km, o una nave attacca veicoli/Traveller.

- Round da **6 secondi** (non 6 minuti)
- NON si usano i tre step del combattimento spaziale normale
- Si usano le regole del combattimento veicoli (p.138)

### Inizio di ogni round: Opposed Pilot check

| Condizione | Modificatore |
| --- | --- |
| Nave da 50+ tonnellate | -1 |
| Nave da 100+ tonnellate | -2 |
| Ogni 100 tonnellate oltre 100 | -1 |
| Ogni nemico aggiuntivo nel dogfight | -1 |
| TAC Speed dedicato al dogfight | +1 per punto |
| Spacecraft vs veicoli/atmosfera | -2 aggiuntivi |

**Vincitore**: DM+2 ai propri attacchi, avversario DM-2.  
**Pareggio**: nessuno può attaccare con armi fisse.  
**Round successivo**: il vincitore del round precedente applica la differenza dei Pilot check come DM positivo.

Per **uscire dal dogfight**: serve TAC Speed maggiore dell'avversario, o che l'avversario lasci andare.

---

## 15. Profilo Nave — Caratteristiche di Combattimento

Le statistiche rilevanti per il combattimento spaziale:

| Statistica | Descrizione |
| --- | --- |
| **Hull Points** | 1 per ogni 2,5 ton di scafo |
| **Armour** | Protezione (Crystaliron TL10 max 13; Bonded Superdense TL14) |
| **TAC Speed** | Rating del motore Stutterwarp — usato per movimento e Firing Solution step 2 |
| **Signature** | Valore base dal stat block B3 (sempre ≥ 1). DM positivo per i check Electronics (sensors) nemici nello step 1 della Firing Solution. Si ricava dal profilo nave B3; può essere modificato da stealth, heat sink, EW, ecc. |
| **Sensors** | Tipo e DM (Basic Military +0, Improved +1, Advanced +2 allo step 1) |
| **Computer** | Modello + Bandwidth (limite software installabili) |
| **Weapons** | Lista: tipo, mount, TL, range, danno, traits, Targeting System per-slot (Light TTA/TTA/UTES — §6) |

### Caratteristiche crew rilevanti per la Firing Solution

| Step | Crew | Skill | Caratteristica |
| --- | --- | --- | --- |
| Iniziativa | Captain | Tactics (naval) | **INT** |
| Step 1 | Sensor Operator | Electronics (sensors) | **INT** |
| Step 2 | Pilot | Pilot | **DEX** |
| Step 3 | Gunner | Gunner | **INT** |
| Point Defence | Gunner | Gunner | **DEX** |
| Operate UTES Array | Gunner | Gunner | **EDU** |
| Commands (target) | qualsiasi ruolo | — | — |
| Captain assist (step 3) | Captain | Tactics (naval) | **INT** |
| Engineer assist | Engineer | Engineer (power) | **INT** (step 1) / **INT** (step 2) |
| Drone Step 2 (Position Vessel) | Remote Pilot | Electronics (remote ops) | **DEX** |

### Software rilevanti per il combattimento — 2300AD B3 p.44

> **Nota:** In 2300AD **non esistono** i software "Manoeuvre" e "Evade" del Trav2022 CRB.

| Software | TL | Bandwidth | Effetto |
| --- | --- | --- | --- |
| Operations | 10 | 0 | Controllo base nave (incluso) |
| Intellect | 10 | 10 | Comandi vocali in linguaggio naturale |
| Stutterwarp Control | As drive | 2× Warp Efficiency | Abilita il viaggio stutterwarp |
| Fire Control/1 | 10 | 5 | DM+1 al Gunner check (step 3 Firing Solution) |
| Fire Control/2 | 11 | 10 | DM+2 al Gunner check |
| Fire Control/3 | 12 | 15 | DM+3 al Gunner check |
| Auto-Repair/1 | 10 | 10 | 1 tentativo riparazione/round (o DM+1) |
| Auto-Repair/2 | 11 | 20 | 2 tentativi/round (o DM+2) |
| Archive | 10 | 0 | Banca dati (incluso) |

### Critical Hit Tracks (6 livelli ciascuna, 2 per Reaction Drive)

Una nave ha le seguenti track:

- Sensors · Power Plant · Fuel · Weapon · Armour · Hull (6 livelli ciascuna)
- Cargo · Stutterwarp Drive · Crew · Bridge (6 livelli ciascuna)
- Reaction Drive (2 livelli — inoperabile/distrutto, non una scala 1-6, B3 p.58)

---

## 16. Riparazioni (fuori combattimento)

### Hull Damage

- Routine (8+) Mechanic check (1 ora, INT o EDU)
- Consuma parti di ricambio in base all'Effect:

| Effect | Parti di ricambio richieste |
| --- | --- |
| 1 | 1 ton |
| 2 | 0.8 ton |
| 3 | 0.6 ton |
| 4 | 0.4 ton |
| 5 | 0.2 ton |
| 6 | Nessuna |

Prezzo parti di ricambio: Cr100.000 per tonnellata.

### Critical Hit (riparazione permanente)

- Richiede Engineer o Mechanic check (1D ore) + parti di ricambio
- Effect del check determina quante parti servono meno la Severity del critico
- Armi distrutte non sono riparabili: vanno sostituite.

---

## 17. Note specifiche per 2300AD

2300AD usa questo sistema di base con le seguenti differenze principali:

- Nessun **Manoeuvre Drive** né **Jump Drive** standard — il motore unico è lo **Stutterwarp**
- Lo Stutterwarp fornisce sia il viaggio FTL che il movimento tattico in-sistema (**TAC Speed**)
- **TAC Speed** sostituisce "Thrust" ovunque nelle regole: iniziativa, movimento tra fasce, evasion, dogfight
- Una nave senza Stutterwarp non ha TAC Speed e non può manovrare tatticamente
- Lo Stutterwarp perde efficacia nelle gravity well profonde (pianeti, stelle) — non rilevante per il combattimento in spazio aperto
- Le navi sono generalmente **più piccole** (max ~20.000 tonnellate) rispetto al Traveller standard
- TL tipico: TL10 (Old Commercial) — TL12 (New Military)
- La skill **Engineer (j-drive)** diventa **Engineer (stutterwarp)**
- La skill **Astrogation** viene usata per calcolare rotte stutterwarp e catturare la gravità al rientro

---

Fonti: 2300AD Core Book 3 p.52–62 (primario); Trav2022 CRB p.158–159 (crit interno), p.78 (weapon traits)
