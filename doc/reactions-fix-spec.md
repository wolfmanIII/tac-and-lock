# Specifica di Implementazione — Fix Reazioni (Deploy Sand / Point Defence / Evasione)

> Stato: **da implementare** — §3 (Evasione) e §5/§5bis (Point Defence PDC, Commands) verificati riga per riga contro il manuale primario (`doc/Ebook - 2300AD core book 3.pdf`, testo estratto con `pdftotext` + lettura pagine 53-62) e pronti per l'implementazione. §§A/B sono le due decisioni prese durante la riverifica (Deploy Sand rimosso, Point Defence/missili spostati in un documento di redesign dedicato) — §§1-2 originali sono superati e mantenuti solo come riferimento storico.
> Origine: audit regole vs codice del 2026-07-01 (confronto `doc/space-combat-rules.md` / CLAUDE.md con l'implementazione effettiva), riverificato il 2026-07-01 contro il PDF sorgente dopo un richiamo esplicito a non fidarsi della sola documentazione derivata.

## ⚠ A. "Deploy Sand" — RISOLTO: rimozione totale (non esiste in 2300AD B3)

Ricerca del termine "sand" sull'intero testo estratto delle 114 pagine del PDF (`pdftotext` + `grep -i`): **zero occorrenze** meccaniche (l'unico match è un nome proprio nei credits, "Sandrine Thirache"). Il meccanismo di `deploySand`/`sandArmourBonus`/`sandcaster` (weapon `sandcaster` in `data/weapons.js`, note: *"Trav2022 CRB p.164"*) risulta interamente importato dal Traveller CRB, che CLAUDE.md autorizza **solo** per le tabelle di critical hit interno (p.158–159) e i weapon traits (p.75) — non per intere meccaniche come i sandcaster.

**Decisione presa**: rimozione completa, nessuna house-rule. Il §1 originale ("Deploy Sand → reazione inline in AttackModal") è quindi **superato** — non va implementato. Rimuovere invece:
- `deploySand` action da `battleStore.js`, campo `sandArmourBonus` dallo stato nave
- weapon `sandcaster` da `data/weapons.js`
- voce `deploy_sand` da `crewActions.js` + relativo case in `ActionModal.jsx`
- ogni riferimento a `sandArmourBonus` in `AttackModal.jsx` (calcolo `effectiveArmour`) e `ShipDetailModal`/`ShipBentoCard` se presente

## ⚠ B. Il modello "salvo missilistico" — RISOLTO: redesign fedele a B3 in documento separato

Ricerca del termine "salvo" sull'intero testo estratto: **zero occorrenze**. Il manuale (p.55-56) descrive missili e droni come **veicoli pilotati da remoto che eseguono l'intera Firing Solution a 3 step** (Sensor Operator → Remote Pilot via Electronics (remote ops) → Gunner) su più round — non un "lancia e dimentica, un tiro all'impatto" con `salvoSize`/DM+1 per missile rimanente. L'intercettazione PDC (p.56) colpisce inoltre **un bersaglio alla volta** (fino a TL-4 per round), non un intero salvo con un tiro.

**Decisione presa**: redesign completo, non minimo-intervento. Il §2 originale ("Point Defence → tiro reale inline in MissileImpactModal", basato sul modello a salvo) è quindi **superato** — sostituito dal documento dedicato **[`doc/drone-combat-redesign-spec.md`](./drone-combat-redesign-spec.md)**, che ridisegna `utils/missiles.js`, `MissileLaunchModal.jsx`, `MissileImpactModal.jsx` e la relativa fetta di `battleStore.js` per modellare ogni drone/missile come unità pilotata individualmente, con Firing Solution completa e intercettazione uno-a-uno.

---

## 0. Decisione architetturale di fondo (contesto storico)

L'audit iniziale aveva trovato una causa comune a Deploy Sand e Point Defence: **erano modellate come "crew action" generiche (fase Actions, gate su `currentActorIndex`)**, ma per regola dovrebbero scattare *nell'istante* in cui un attacco/impatto si risolve — un momento che nella struttura a fasi sequenziali del round (Manoeuvre→Attack→Actions, tutte le navi in ordine iniziativa per fase) non coincide mai con il turno Actions della nave difensore.

La riverifica contro il manuale (§A, §B) ha cambiato l'esito per entrambe:
- **Deploy Sand**: il problema di tempistica è diventato irrilevante — la meccanica va rimossa perché non esiste in 2300AD B3, non perché mal temporizzata.
- **Point Defence**: il problema di tempistica resta valido, ma va risolto nell'ambito del redesign completo del combattimento missili/droni (`doc/drone-combat-redesign-spec.md`), perché anche il modello "salvo" a cui era agganciata non è fedele al manuale.

**Restano validi da questo audit iniziale**: il problema di tempistica identico su "Commands" (ex Leading Fire, §5bis) e la fix di Evasione automatica (§3) sotto.

### Problemi trattati in questo documento

1. ~~Deploy Sand strutturalmente inutilizzabile~~ — **rimosso**, vedi §A.
2. ~~Point Defence non è una vera reazione~~ — **spostato**, vedi §B e `doc/drone-combat-redesign-spec.md`.
3. **Evasione non applicata automaticamente** — `ManoeuvreModal.jsx` calcola e salva correttamente `ship.evasionDm`, ma `AttackModal.jsx:156` usa uno stato locale scollegato che il GM deve ricopiare a mano. Fix in §3.
4. **"Commands" (ex Leading Fire) non canonico, battle-wide invece che per-nave, stesso problema di tempistica** — fix in §5bis.

---

## 1. ~~Deploy Sand~~ — RIMOSSO (vedi §A)

Sezione superata. Deploy Sand va rimosso interamente, non corretto. Dettagli di rimozione in §A e nella tabella file impattati (§6).

## 2. ~~Point Defence (modello salvo)~~ — SOSTITUITO (vedi §B)

Sezione superata. Point Defence viene ridisegnata insieme all'intero combattimento missili/droni in [`doc/drone-combat-redesign-spec.md`](./drone-combat-redesign-spec.md), non più come intervento minimo su `MissileImpactModal`.

---

## 3. Evasione automatica in `AttackModal.jsx`

**Correzione rispetto alla prima stesura**: verificato il testo esatto della regola (p.54): *"Evade: ... With Effect 1–4, there is DM-1 for all enemy **Electronics (sensors) and Gunner checks**. On Effect 5+, this becomes DM-2. With Effect -5 or worse enemies receive DM+1 to all Electronics (sensors) and Gunner checks."* — l'evasione penalizza **sia** il check Sensor Operator (Step 1) **sia** il check Gunner (Step 3), non solo il secondo. La fix va quindi applicata a `step1Dms` oltre che a `step3Dms`:

```js
// step1Dms (Sensor Operator, Step 1) — riga ~182, aggiungere:
const evasionDm = target?.evasionDm ?? 0
const total = sensorSkill + intDm + sig.effective + sensorQDm + timeLagDm + evasionDm
```

con la stessa riga aggiunta a `rows` (`['Target evasion', evasionDm]`). Il resto della sezione sotto (lo stesso valore letto in `step3Dms`) resta invariato.

**Riga 156** — sostituire:

```js
const [evasionDm, setEvasionDm] = useState(0)
```

con un default derivato dal bersaglio, restando comunque editabile dal GM (per i casi senza crew tracciato):

```js
const [evasionDmOverride, setEvasionDmOverride] = useState(null)
const evasionDm = evasionDmOverride ?? (target?.evasionDm ?? 0)
```

**Riga ~408**, l'input numerico nello `STEP_SETUP`:

```jsx
<input
  type="number" min={-10} max={2} value={evasionDm}
  onChange={(e) => setEvasionDmOverride(Math.min(2, Number(e.target.value) || 0))}
/>
{evasionDmOverride === null && (target?.evasionDm ?? 0) !== 0 && (
  <span className="text-[10px] text-sky-400">auto da Manoeuvre Step</span>
)}
```

**Reset override**: quando cambia `targetId`, azzerare `evasionDmOverride` a `null` (altrimenti il valore del bersaglio precedente resterebbe "congelato"):

```js
useEffect(() => { setEvasionDmOverride(null) }, [targetId])
```

Nessun'altra modifica: `step3Dms` già usa `evasionDm` così com'è (riga 233), quindi eredita automaticamente il nuovo comportamento.

---

## 4. Modifiche ai dati — `crewActions.js`

Rimuovere le voci `point_defence` e `deploy_sand` dal blocco `gunner: [...]` (righe 131-154) — `deploy_sand` perché rimosso interamente (§A), `point_defence` perché la sua meccanica viene ridisegnata in [`doc/drone-combat-redesign-spec.md`](./drone-combat-redesign-spec.md) come parte del nuovo modello a intercettazione uno-a-uno, non più come crew action generica. Rimuovere i relativi `case` in `ActionModal.jsx` (righe 162-171) e il rendering del picker `INCOMING SALVO` (righe 300-316), oltre a `selectedSalvoId`/`incomingSalvos` se non più usati altrove.

`ALL_CREW_ACTIONS`/`groupedActions` si aggiornano automaticamente (derivati da `CREW_ACTIONS`).

---

## 5. Point Defence PDC — RISOLTO: non sono due fonti in disaccordo, sono due regole diverse

**Correzione rispetto alla prima stesura di questo documento**: non è un conflitto tra due fonti — sono due regole B3 distinte con lo stesso nome, verificate entrambe sul manuale primario (`Ebook - 2300AD core book 3.pdf`, testo estratto con `pdftotext`):

- **Trait arma "Point Defence"** (p.59, tabella Weapon Traits): *"DM+2 against missiles, drones and fighters. It can only be used at Close range."* — si applica quando un'arma con questo trait spara **normalmente** (Attack Step) contro missili/droni/caccia come bersaglio. Questo è il valore già corretto nella tabella "Weapon Traits" di CLAUDE.md.
- **Azione/reazione "Point Defence"** (p.55, Gunner Actions): *"Point defence requires a Difficult (10+) Gunner check (DEX), with DM-2 for missiles and drones under 10 tons. If a PDC is used, it receives DM+4 instead of DM-2, although PDCs are typically operated by the ship's computer."* — questa è la reazione di intercettazione dedicata (Gunner DEX, Difficult 10+), rinforzata da p.56: *"Each incoming fighter or drone can be engaged by a Point Defence Cluster (PDC), up to a maximum number of targets equal to TL-4. This requires a Difficult (10+) Gunner check, adding the Fire Control score. Note that there is an additional DM+4 for a PDC."*

Per la reazione che sto implementando (intercettare un salvo/bersaglio in arrivo), il valore corretto resta **DM+4 per armi PDC, DM−2 per armi non-PDC** — confermato da due passaggi indipendenti (p.55 e p.56), non da uno solo. `crewActions.js:140` va comunque corretto perché descrive l'azione di reazione citando però il valore del trait (+2 invece di +4) — un errore di trascrizione, non un vero conflitto tra fonti.

```js
export const PD_PDC_DM     = 4   // Point Defence trait weapon (e.g. Quinn Type 17 PDC) // 2300AD B3 p.55
export const PD_NON_PDC_DM = -2  // conventional weapon mount used for point defence // 2300AD B3 p.55
```

---

## 5bis. "Leading Fire" non è una regola canonica B3 — due bug aggiuntivi confermati

Rileggendo p.54 ("Captain Actions") per verificare il punto precedente, è emerso che il manuale **non contiene una regola chiamata "Leading Fire"**. Le uniche due azioni Captain descritte sono:

- **Commands** (p.54) — skill **Leadership** (non Tactics naval), Routine/8+ ("one command per combat round per level of their Leadership skill"), DM+1 (Effect 1–4) o DM+2 (Effect 5–6) **a un solo membro dell'equipaggio scelto** per quel round; chi disobbedisce subisce DM−1.
- **Tactics** (p.54, dettagliato p.56) — assist Tactics(naval) Difficult(10+) INT al singolo check Gunner dello Step 3 della Firing Solution. Il parametro `captainAssistDm` esiste già in `combat.js`'s `computeAttackDMs`, ma **non è mai letto** da `AttackModal.jsx`'s `step3Dms` (che costruisce i DM inline invece di riusare quell'helper) — quindi questo assist, pur "documentato come implementato", oggi non esiste in pratica.

L'attuale "Leading Fire" (`crewActions.js`, Tactics naval Average 8+, bonus a *tutti* gli attacchi della nave per l'intero round) è un mix homebrew mai verificato contro il manuale. Verificando l'implementazione sono emersi altri due problemi concreti, oltre alla non-canonicità:

1. **`leadingFireDm` è a livello di battaglia, non per nave** (`battleStore.js:208`, `applyLeadingFire` riga 833) — il bonus di un capitano si applica oggi a **tutte le navi in gioco**, comprese quelle nemiche, perché `AttackModal.jsx` legge `useBattleStore((s) => s.leadingFireDm)` senza filtrare per nave.
2. **Stesso problema di tempistica di Deploy Sand** — se l'ordine resta agganciato all'Actions Step (fase finale del round), non può mai influenzare il tiro Pilota del Manoeuvre Step o il tiro Gunner dell'Attack Step **dello stesso round**, perché quegli step sono già passati quando l'azione diventa raggiungibile.

### Fix proposto: rinominare in "Commands" + wiring corretto per nave/ruolo/round

**Skill e target**: Leadership (INT o SOC), Average (8+) — numero invariato rispetto a "Leading Fire", solo la skill cambia. `requiresTarget` non punta più a una nave nemica ma a **un ruolo di equipaggio della propria nave** (`pilot`, `gunner_turret`, `gunner_bay`, `sensor_operator`, `engineer`, `marine`).

**Storage per nave, non per battaglia** — sostituire il campo globale `leadingFireDm` con due campi per-nave, riusando il pattern già esistente di `initiativeBonusNextRound` (bonus dichiarato in un round, applicato al successivo):

```js
// battleStore.js — stato iniziale nave
commandBonusNextRound: null, // { role, dm } | null — impostato in Actions Step, si attiva al round successivo
commandBonus:          null, // { role, dm } | null — attivo per il round corrente
```

```js
/** Captain issues a Command to one crew role. // 2300AD B3 p.54 */
applyCommand: wh(
  (shipId) => !!get().ships.find((s) => s.id === shipId),
  (shipId, role, dm) => {
    set((s) => ({
      ships: s.ships.map((sh) => sh.id !== shipId ? sh : { ...sh, commandBonusNextRound: { role, dm } }),
    }))
  },
),
```

**In `buildNextRoundState`** (riga 135-153), sostituire il reset diretto `leadingFireDm: 0` con la promozione a due stadi (stesso schema di `initiative`/`initiativeBonusNextRound` già presente poche righe sopra):

```js
commandBonus:          sh.commandBonusNextRound ?? null,
commandBonusNextRound: null,
```

Così un Command dichiarato durante l'Actions Step del round N diventa attivo per **tutto** il round N+1 (Manoeuvre + Attack + Actions), e viene ripulito solo all'inizio del round N+2 — esattamente come già avviene per il bonus di iniziativa.

**Consumo automatico** (dove i DM sono già calcolati in automatico):
- `AttackModal.jsx` step3Dms: `attacker.commandBonus?.role === 'gunner_turret' ? attacker.commandBonus.dm : 0`
- `ManoeuvreModal.jsx` `rollEvasion`: `ship.commandBonus?.role === 'pilot' ? ship.commandBonus.dm : 0`
- Per gli altri ruoli (`engineer`, `sensor_operator`, `marine`), il DM resta manuale: mostrare un badge "🎖 COMMAND: {role} +{dm}" su `ShipBentoCard`/`ShipDetailModal` (stesso pattern già usato per `evasionDm`), che il GM somma a mano nello `skillLevel` di `ActionModal` — coerente con il fatto che quei check sono già a DM manuale, non serve wiring aggiuntivo.

### Fix separato: cablare il vero "Tactics Assist" (Step 3, p.56)

Aggiungere in `AttackModal.jsx`, schermata `STEP_GUNNER`, un roll opzionale **prima** del blocco principale del Gunner:

```jsx
{/* Captain assist — Tactics (naval), Difficult (10+) // 2300AD B3 p.54, p.56 */}
<RollBlock
  dm={captainTacticsSkill + captainIntDm}
  onRoll={rollCaptainAssist}
  onManual={manualCaptainAssist}
  result={captainAssistResult}
  target={10}
/>
```

Su successo, `captainAssistDm = Math.max(0, captainAssistResult.effect)` entra come riga aggiuntiva nello `step3Dms.rows`/`total`, distinta dal Command (i due bonus non si escludono a vicenda: uno è un ordine generico dato in un round precedente, l'altro è un assist attivo nello stesso momento del tiro).

**Nota**: dato che questo assist è opzionale e specifico del singolo tiro Gunner (non persiste tra round), non necessita di storage — resta `useState` locale in `AttackModal`, come gli altri step della Firing Solution.

---

## 6. File impattati

| File | Modifica |
| --- | --- |
| `src/components/modals/AttackModal.jsx` | evasionDm auto-letto in step1Dms E step3Dms da `target.evasionDm` · commandBonus (gunner_turret) letto in step3Dms · nuovo roll opzionale Captain Tactics Assist · rimosso ogni riferimento a `sandArmourBonus` nel calcolo armatura |
| `src/components/modals/ManoeuvreModal.jsx` | `rollEvasion` legge `ship.commandBonus` se `role === 'pilot'` |
| `src/data/weapons.js` | rimossa weapon `sandcaster` |
| `src/data/crewActions.js` | rimosse voci `point_defence`, `deploy_sand`; `leading_fire` rinominata `commands` (skill Leadership, target = ruolo equipaggio) |
| `src/components/modals/ActionModal.jsx` | rimossi case/picker `point_defence`, `deploy_sand`; nuovo case `commands` con selettore ruolo; badge "🎖 COMMAND" per ruoli non auto-wired |
| `src/store/battleStore.js` | rimossi `sandArmourBonus`/`deploySand`; rimossi `leadingFireDm`/`applyLeadingFire` (battle-level); nuovi campi nave `commandBonus`/`commandBonusNextRound`; nuova azione `applyCommand`; `buildNextRoundState` aggiornato con la promozione a due stadi |
| `src/components/battle/ShipBentoCard.jsx` / `ShipDetailModal.jsx` | rimosso badge/UI legati a `sandArmourBonus`; aggiunto badge "🎖 COMMAND: {role} +{dm}" quando `ship.commandBonus` attivo |
| `CLAUDE.md` | rimossa ogni menzione di Deploy Sand/sandcaster come meccanica B3; sezione "Funzioni chiave" aggiornata: `applyLeadingFire`→`applyCommand`, aggiunto Captain Tactics Assist |
| `doc/space-combat-rules.md` | rimossa sezione Deploy Sand; sezione Captain aggiornata: "Leading Fire" → "Commands" (Leadership, singolo membro) + "Tactics" assist Step 3 distinto |
| `doc/drone-combat-redesign-spec.md` | **nuovo documento** — redesign completo di missili/droni (Point Defence inclusa), vedi §B |

---

## 7. Test E2E da aggiornare (`e2e/09-crew-actions.spec.js`)

- Rimuovere del tutto i test `deploy_sand` (funzionalità eliminata).
- Rimuovere i test `point_defence` via `ActionModal`/context menu (sostituiti da quelli nel nuovo documento drone/missili).
- Rinominare/aggiornare i test `leading_fire` → `commands` (verificare target-per-ruolo e persistenza per-nave, non più battle-wide).
- Aggiungere in un nuovo spec (o estendere `e2e/*attack*`):
  - evasione auto-popolata in `AttackModal` (sia Step 1 che Step 3) dopo un roll in `ManoeuvreModal`;
  - Command dichiarato in round N per `gunner_turret` → verifica che NON si applichi nell'Attack Step del round N, ma SI applichi nel round N+1, e SOLO alla nave che l'ha dichiarato;
  - Captain Tactics Assist → verifica che il suo Effect si sommi al totale dello Step 3 solo se rollato con successo in quello specifico tiro.

Test relativi a missili/droni/Point Defence: vedi [`doc/drone-combat-redesign-spec.md`](./drone-combat-redesign-spec.md).
