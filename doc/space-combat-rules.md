# Tac-and-Lock — Regole del Combattimento Spaziale

## Fonte: Traveller 2022 Core Rulebook (base di 2300AD) + 2300AD Core Book 1

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
Ogni round si svolge in tre step, eseguiti **in ordine di Iniziativa**:

```text
1. MANOEUVRE STEP  →  ogni nave spende il Thrust
2. ATTACK STEP     →  i gunner aprono il fuoco
3. ACTIONS STEP    →  azioni speciali di ogni membro dell'equipaggio
```

Al termine dell'Actions Step, se ci sono ancora navi in combattimento, il round ricomincia.

---

## 2. Iniziativa

**Formula:** `2D + Pilot skill + TAC Speed`

- Il Capitano può fare un check **Tactics (naval)**: l'Effect si aggiunge all'Iniziativa.
- In caso di **sorpresa**, la nave sorpresa non può agire nel primo round.
- L'iniziativa viene tirata una sola volta all'inizio del combattimento.

---

## 3. Fascie di Distanza (Range Bands)

| Range Band | Distanza | TAC Speed richiesto per muoversi |
| --- | --- | --- |
| Adjacent | ≤ 1 km | 1 |
| Close | 1–10 km | 1 |
| Short | 11–1.250 km | 2 |
| Medium | 1.251–10.000 km | 5 |
| Long | 10.001–25.000 km | 10 |
| Very Long | 25.001–50.000 km | 25 |
| Distant | > 50.000 km | 50 |

Gli scontri tipicamente iniziano a **Very Long** o **Distant**.  
Il combattimento reale avviene di solito a **Long** o **Medium**.  
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
| **Marine** | Abbordaggio / difesa da abbordaggio |
| **Passenger** | Nessuna azione di combattimento |

### Ruoli automatizzati (software)

| Software | Sostituisce |
| --- | --- |
| Fire Control/x | Gunner (può fare x attacchi automatici o dare DM ai gunner) |
| Auto-Repair/x + repair drones | Engineer (damage control) |
| Intellect + Expert (engineer/pilot/electronics-sensors) | Engineer / Pilot / Sensor Operator |
| Evade/x | Pilot (DM negativo pari al rating su tutti gli attacchi in entrata) |

---

## 5. Step 1 — Manoeuvre Step

Ogni nave (in ordine di Iniziativa) distribuisce il suo **TAC Speed** tra:

1. Movimento (cambio di fascia)
2. Combat manoeuvring
3. Evasive Action (TAC Speed rimanente usato come reazione nella fase di attacco)

---

## 6. Step 2 — Attack Step

### Formula di attacco

```text
2D + Gunner (specialità appropriata) + DEX DM ≥ 8
```

Un Pilot che spara da un fixed-mount subisce **DM-2**.

### Modificatori comuni

| Condizione | DM |
| --- | --- |
| Short Range | +1 |
| Long Range | -2 |
| Very Long Range | -4 |
| Distant Range | -6 |
| Pulse Laser | +2 |
| Beam Laser | +4 |
| Per 1.000 tonnellate del bersaglio | +1 (max DM+6) |
| Sensor Lock attivo | +2 |
| Evasive Action (Pilot) | -Pilot skill per ogni TAC Speed speso |

### Scala danno

Spacecraft e Ground usano scale diverse:

| Attaccante → Bersaglio | DM to hit | Danno |
| --- | --- | --- |
| Ground weapon → Ground target | +0 | x1 |
| Ground weapon → Spacecraft | -2 | /10 |
| Spacecraft weapon → Spacecraft | +0 | x1 |
| Spacecraft weapon → Ground target | +2 | x10 |

---

## 7. Armi Spaziali

| Arma | TL | Range | Danno | Tonnellate | Costo | Traits |
| --- | --- | --- | --- | --- | --- | --- |
| Beam Laser | 10 | Medium | 1D | — | MCr0.5 | — |
| Pulse Laser | 9 | Long | 2D | — | MCr1 | — |
| Missile Rack | 7 | Special | 4D | — | MCr0.75 | Smart |
| Missile (Nuclear) | — | Special | 1DD | — | — | Radiation, Smart |
| Particle Barbette | 11 | Very Long | 4D* | 5 | MCr8 | Radiation |
| Sandcaster | 9 | Special | Special | — | MCr0.25 | — |

*Particle Barbette: dopo aver sottratto l'armatura, moltiplicare il danno x3.

### Torrette

| Tipo | Tons | Costo |
| --- | --- | --- |
| Single Turret | 1 | MCr0.2 |
| Double Turret | 1 | MCr0.5 |
| Triple Turret | 1 | MCr1 |

**Double/Triple turret con stessa arma:** un solo tiro; ogni arma aggiuntiva aggiunge **+1 al totale di danno per ogni dado dell'arma** (non un dado extra). Esempio: 3× Pulse Laser (2D) = 2D+4; 3× Beam Laser (1D) = 1D+2. I missili **non** ricevono questo bonus.  
**Double/Triple con armi diverse:** si può usare un solo tipo per round.  
**Sandcaster collegati:** +1 all'armatura negata dagli attacchi laser per ogni sandcaster aggiuntivo oltre il primo.

---

## 8. Danno alla Nave

```text
Danno = (danno arma + Effect del tiro) - Armatura
```

Il risultato viene sottratto dagli **Hull Points**.  
Se gli Hull Points arrivano a 0: la nave è **distrutta** (irrecuperabile).

### Critical Hits

Scattano quando: l'Effect del tiro è **≥ 6** E il danno penetra l'armatura.

- **Severity** = Effect del tiro - 5
- Tirare 2D sulla tabella Critical Hit Location

### Danno Sostenuto

Ogni volta che il danno cumulativo raggiunge il **10% degli Hull Points iniziali**, tirare sulla Critical Hit Location table → Severity 1 automatica.

### Called Shots (Short range o meno)

Dichiarare la location prima del tiro. DM-2 all'attacco. Se critico, l'attaccante sceglie la location.

---

## 9. Critical Hit Location (2D)

| 2D | Posizione |
| --- | --- |
| 2 | Sensors |
| 3 | Power Plant |
| 4 | Fuel |
| 5 | Weapon |
| 6 | Armour |
| 7 | Hull |
| 8 | Stutterwarp Drive |
| 9 | Cargo |
| 10 | Stutterwarp (FTL) |
| 11 | Crew |
| 12 | Bridge |

---

## 10. Critical Hit Effects (per Severity 1–6)

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

### Stutterwarp Drive

| Sev | Effetto |
| --- | --- |
| 1 | Tutti i check Pilot DM-1 |
| 2 | Pilot DM-1, TAC Speed -1 |
| 3 | Pilot DM-1, TAC Speed -1 |
| 4 | Pilot DM-1, TAC Speed -1 |
| 5 | TAC Speed a 0 |
| 6 | TAC Speed a 0, Hull Severity +1 |

### Cargo

| Sev | Effetto |
| --- | --- |
| 1 | 10% del cargo distrutto |
| 2 | 1D x 10% del cargo distrutto |
| 3 | 2D x 10% del cargo distrutto |
| 4 | Tutto il cargo distrutto |
| 5 | Tutto il cargo distrutto, Hull Severity +1 |
| 6 | Tutto il cargo distrutto, Hull Severity +1 |

### Stutterwarp (FTL)

| Sev | Effetto |
| --- | --- |
| 1 | Tutti i check stutterwarp DM-2 |
| 2 | Stutterwarp disabilitato (solo viaggio FTL) |
| 3 | Stutterwarp distrutto |
| 4 | Stutterwarp distrutto, Hull Severity +1 |
| 5 | Stutterwarp distrutto, Hull Severity +1 |
| 6 | Stutterwarp distrutto, Hull Severity +1 |

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

---

## 11. Reazioni (durante il turno avversario)

### Evasive Action — Pilot

- Ogni punto di **TAC Speed** non speso = 1 tentativo di schivata
- L'attacco subisce DM negativo = livello di skill del Pilot

### Point Defence — Gunner (turret)

- Gunner (turret) check vs salvo di missili in arrivo
- Effect = missili rimossi dal salvo
- DM+1 con double turret con 2 laser, DM+2 con triple turret con 3 laser
- Solo una volta per round per gunner; arma usata per Point Defence non può attaccare nello stesso round

### Disperse Sand — Gunner (turret)

- Gunner (turret) check vs attacco laser
- Successo: aggiunge 1D + Effect all'armatura della nave vs quell'attacco
- Usa un canister di sabbia
- Vs boarding party: 8D danno (scala Ground) a ogni bersaglio nel gruppo

---

## 12. Step 3 — Actions Step

### Improve Initiative — Captain

- **Leadership check**
- Effect (anche negativo) aggiunto all'Iniziativa per il round successivo

### Stutterwarp Escape — Engineer

- Come un normale stutterwarp, ma difficoltà +1 livello su Astrogation e Engineer (stutterwarp)
- Tempo ridotto a 1D minuti (entro il round)

### Offline System — Engineer

- **Engineer (power) check, 1 round, EDU** *(difficoltà non specificata nel CRB — si assume Average 8+)*
- Spegne qualsiasi numero di sistemi, libera Power per gli altri
- Un round aggiuntivo per riaccenderli

### Overload Stutterwarp — Engineer

- **Difficult (10+) Engineer (stutterwarp), 1 round, INT**
- Successo: TAC Speed +1 per il round successivo
- Fallimento con Effect ≤ -6: Stutterwarp critical hit Severity 1
- DM cumulativo -2 ad ogni tentativo (rimosso con manutenzione: 1D ore)

### Overload Plant — Engineer

- **Difficult (10+) Engineer (power), 1 round, INT**
- Successo: Power +10% per il round successivo
- Fallimento con Effect ≤ -6: Power Plant critical hit Severity 1
- DM cumulativo -2 ad ogni tentativo

### Repair System — Engineer

- **Average (8+) Engineer check, 1 round, INT o EDU**
- DM negativo = Severity del critical hit
- DM cumulativo +1 ogni round sulla stessa riparazione
- Riparazione temporanea (dura 1D ore); se nuovo critical hit sulla stessa location: ricominciare da capo
- Hull damage e armi distrutte NON sono riparabili in combattimento

### Reload Turret — Gunner

- Qualsiasi Traveller con la skill Gunner
- La torretta non può attaccare in quel round

### Sensor Lock — Sensor Operator

- **Electronics (sensors) check**
- Successo: tutti gli attacchi vs quel bersaglio guadagnano DM+2 finché il lock non viene rotto

### Electronic Warfare — Sensor Operator

- **Opposed Electronics (comms) check** vs sensor operator del bersaglio
- Può anche distruggere/deviare missili in un salvo: **Difficult (10+) Electronics (sensors)**
- Effect = missili rimossi dal salvo
- Una sola volta per salvo per round (anche con più sensor operator)

### Boarding Action — Marine

- Solo a **Adjacent range**, durante l'Actions Step
- Impiega **2D round** per completarsi
- Risoluzione: entrambi tirano 2D + modificatori; il difensore sottrae il suo totale dall'attaccante

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

| Totale (attaccante - difensore) | Risultato |
| --- | --- |
| -7 o meno | Attaccanti sconfitti; il difensore può contrattaccare con DM+4 |
| -4 a -6 | Attaccanti sconfitti; devono ritirarsi o vengono catturati/uccisi |
| -1 a -3 | Combattimento continua in 1D round; difensore DM+2 al prossimo roll; nave difesa perde 2D Hull |
| 0 | Combattimento continua in 1D round |
| 1 a 3 | Combattimento continua in 1D round; attaccante DM+2 al prossimo roll; nave difesa perde 2D Hull |
| 4 a 6 | Boarding riuscito; nave subisce 1D danno ignorando armatura; 2D round per pacificare |
| 7 o più | Boarding immediato; il controllo della nave passa agli attaccanti |

### Reassignment — chiunque

- Cambia ruolo; nessuna altra azione in questo round; nuovo ruolo attivo dal round successivo

---

## 13. Combattimento Missilistico

### Lancio

- Missili verso bersagli a **Adjacent o Close**: perdono il trait **Smart**
- Si lanciano in **salvo** (tutti i missili vs singolo bersaglio nello stesso round)
- I missili hanno Thrust 10 e raggiungono il bersaglio dopo:

| Range al lancio | Round all'impatto |
| --- | --- |
| Medium e meno | Immediato |
| Long | 1 round |
| Very Long | 4 round |
| Distant | 10 round |

Dopo 10 round senza impatto: missili esauriti, diventano inerti.

### Rilevare il lancio

- Routine (6+) Electronics (sensors) alla nave che riceve (se il lanciatore è già rilevato)
- Average (8+) se il lanciatore non è ancora stato rilevato
- DM+1 per ogni 10 missili nel salvo (max DM+6)
- Missili non rilevati: Average (8+) all'inizio di ogni round successivo

### Contromisure

- **Electronic Warfare**: Difficult (10+) Electronics (sensors); Effect = missili rimossi dal salvo
- **Fuga**: aumentare la fascia di distanza (raro, guadagna tempo per EW o jump)
- **Point Defence**: Gunner (turret) check appena prima dell'impatto

### Attacco dei missili

- Formula: nessun Gunner skill, nessun modificatore di range
- **DM+1 per ogni missile rimanente nel salvo**
- Smart: usa TL del missile o della nave lanciante, il più alto
- Missili da Distant range: DM-2 all'attacco

### Impatto

- Danno: singolo missile (nessun Effect aggiunto)
- Il danno totale viene moltiplicato per l'Effect (ma Effect ≤ numero di missili rimanenti)

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
| **TAC Speed** | Rating del motore Stutterwarp — usato per Iniziativa, movimento, schivate. Assente senza Stutterwarp. |
| **Sensors** | Tipo e DM (per Electronic Warfare e Sensor Lock) |
| **Computer** | Modello + Bandwidth (limite software installabili) |
| **Weapons** | Lista: tipo, mount, TL, range, danno, traits |
| **Power** | Totale disponibile / richiesto da sistemi e armi |

### Software rilevanti per il combattimento

| Software | TL | Bandwidth | Costo (MCr) | Effetto |
| --- | --- | --- | --- | --- |
| Manoeuvre | 8 | 0 | incluso | Controllo base |
| Intellect | 11 | 0 | incluso | Comandi vocali |
| Evade/1–3 | 9–13 | 10–25 | 1–3 | DM negativo pari al rating su tutti gli attacchi in entrata (non richiede TAC Speed) |
| Fire Control/1–5 | 9–13 | 5–25 | 2–10 | x attacchi automatici, o DM ai gunner |
| Auto-Repair/1–2 | 10–12 | 10–20 | 5–10 | x tentativi di riparazione automatici per round |

### Critical Hit Tracks (6 livelli ciascuna)

Una nave ha le seguenti track, ognuna con 6 livelli di severità:

- Sensors · Power Plant · Fuel · Weapon · Armour · Hull
- Stutterwarp Drive · Cargo · Stutterwarp (FTL) · Crew · Bridge

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

Fonti: Traveller 2022 Core Rulebook pp. 159–175; 2300AD Core Book 1 p. 11
