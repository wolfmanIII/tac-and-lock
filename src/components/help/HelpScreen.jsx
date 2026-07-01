/**
 * HelpScreen — in-app field manual.
 * Sidebar TOC + scrollable content. Pattern from thrust-and-drift.
 */

import { useState } from 'react'
import { useUIStore } from '../../store/uiStore.js'

const SECTIONS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'dashboard',  label: 'Dashboard' },
  { id: 'phase-flow', label: 'Phase Flow' },
  { id: 'setup',      label: '— Setup' },
  { id: 'initiative', label: '— Initiative' },
  { id: 'manoeuvre',  label: '— Manoeuvre' },
  { id: 'attack',     label: '— Attack' },
  { id: 'reactions',  label: '— Reactions' },
  { id: 'actions',    label: '— Crew Actions' },
  { id: 'crits',      label: 'Critical Hits' },
  { id: 'missiles',   label: 'Drones / Missiles' },
  { id: 'boarding',   label: 'Boarding' },
  { id: 'signature',  label: 'Signature' },
  { id: 'undo-redo',  label: 'Undo / Redo' },
  { id: 'save',       label: 'Save & Resume' },
]

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-4 space-y-3">
      <h2 className="font-display text-(--neon-cyan) tracking-widest text-sm border-b border-slate-800 pb-1">
        {title}
      </h2>
      <div className="space-y-3 font-mono text-xs text-slate-300 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function Sub({ title, children }) {
  return (
    <div className="space-y-1.5">
      <h3 className="font-display text-slate-200 tracking-widest text-xs">{title}</h3>
      <div className="text-slate-400 space-y-1.5 pl-3 border-l border-slate-800">
        {children}
      </div>
    </div>
  )
}

function KV({ k, v }) {
  return (
    <div className="flex gap-2">
      <span className="text-(--neon-cyan) shrink-0 w-36">{k}</span>
      <span className="text-slate-400">{v}</span>
    </div>
  )
}

function Note({ children }) {
  return (
    <p className="bg-slate-900/60 border border-slate-700 rounded px-3 py-2 text-slate-400 italic">
      {children}
    </p>
  )
}

function Table({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr className="border-b border-slate-700">
            {headers.map((h) => (
              <th key={h} className="text-left py-1 pr-4 font-display tracking-widest text-slate-400 text-[10px]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-800/50">
              {row.map((cell, j) => (
                <td key={j} className={`py-1 pr-4 align-top ${j === 0 ? 'text-slate-200' : 'text-slate-400'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function HelpScreen({ onBack } = {}) {
  const gotoScreen = useUIStore((s) => s.gotoScreen)
  const handleBack = onBack ?? (() => gotoScreen('dashboard'))
  const [active, setActive] = useState('overview')

  const scrollTo = (id) => {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="w-full h-full flex bg-slate-950 overflow-hidden">

      {/* ── Sidebar TOC ─────────────────────────────────────────────── */}
      <aside className="w-52 shrink-0 border-r border-slate-800 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 shrink-0">
          <p className="font-display text-xs text-(--neon-cyan) tracking-widest">// FIELD MANUAL</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`w-full text-left px-4 py-1.5 font-mono text-xs transition-colors ${
                active === id
                  ? 'text-(--neon-cyan) bg-(--neon-cyan)/5'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="shrink-0 px-4 py-3 border-t border-slate-800 space-y-2">
          <a
            href="/field-manual.pdf"
            download="tac-and-lock-field-manual.pdf"
            className="block w-full py-2 border border-slate-700 text-slate-400 font-display text-xs tracking-widest rounded hover:border-slate-500 hover:text-slate-200 transition-colors text-center"
          >
            ⬇ DOWNLOAD PDF
          </a>
          <button
            onClick={handleBack}
            className="w-full py-2 border border-slate-700 text-slate-400 font-display text-xs tracking-widest rounded hover:border-slate-500 hover:text-slate-200 transition-colors"
          >
            ⬅ BACK
          </button>
        </div>
      </aside>

      {/* ── Content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-8 py-6 space-y-10">

        {/* OVERVIEW */}
        <Section id="overview" title="Overview">
          <p>
            <span className="text-(--neon-cyan) font-bold">Tac &amp; Lock</span> is a browser-based Virtual Tabletop tool for running{' '}
            <span className="text-slate-200">2300AD</span> space combat at the gaming table.
            GM-operated, designed for shared-screen play.
          </p>
          <p>
            Rules source: <span className="text-slate-200">2300AD Core Book 3: Vehicles and Spacecraft pp.52–62</span> (primary).
            Traveller 2022 CRB used only for internal critical hit tables (p.158–159) and weapon traits (p.75).
            Where B3 and CRB diverge, B3 wins.
          </p>
          <p>
            Combat uses <span className="text-slate-200">range bands</span> — no hex grid, no velocity vectors.
            Seven bands (Adjacent → Distant) define all spatial relationships.
            Ships spend TAC Speed to move between bands.
          </p>
        </Section>

        {/* DASHBOARD */}
        <Section id="dashboard" title="Dashboard">
          <p>Pre-battle lobby. Left panel: ship profiles. Right panel: operations console.</p>
          <Sub title="SHIP PROFILES">
            <KV k="+ NEW PROFILE"    v="Create a new ship from scratch." />
            <KV k="✎ Edit"           v="Modify an existing profile." />
            <KV k="⧉ Duplicate"      v="Clone a profile as a starting point." />
            <KV k="⊗ Delete"         v="Remove a profile (confirmation required)." />
            <KV k="↓ IMPORT"         v="Load profiles from a .json file." />
            <KV k="↑ EXPORT"         v="Save all profiles to a .json file." />
            <KV k="📖 CATALOG"       v="Browse canonical 2300AD vessels and add them to profiles." />
          </Sub>
          <Sub title="OPERATIONS CONSOLE">
            <KV k="▶ ENTER BATTLE"   v="Enter the battle screen." />
            <KV k="↓ RESUME FROM FILE" v="Load a saved .json session — preview shows roster before confirm." />
            <KV k="💾 SAVE"          v="Download the current session as .json." />
            <KV k="📖 FIELD MANUAL"  v="This screen." />
          </Sub>
          <Sub title="SHIP PROFILE FIELDS">
            <KV k="TAC Speed"        v="Tactical Speed — band-change points per round." />
            <KV k="Signature"        v="Base EM signature. Modified dynamically in battle." />
            <KV k="Sensors"          v="Type (Basic Military / Improved / Advanced) + DM." />
            <KV k="Software"         v="Fire Control/1–3, Auto-Repair/1–2, etc." />
            <KV k="Crew"             v="Named members with Tactics, Pilot, Engineer, Gunner, Electronics skill ratings." />
          </Sub>
        </Section>

        {/* PHASE FLOW */}
        <Section id="phase-flow" title="Phase Flow">
          <p>Each round follows this sequence. HUD shows current round and phase. Click <span className="text-slate-200">NEXT PHASE ⟶</span> to advance.</p>
          <Table
            headers={['Phase', 'What happens']}
            rows={[
              ['Setup',      'Add ships to the battle via right-click → Add ship.'],
              ['Initiative', 'Opposed Tactics(naval) check — order fixed for the engagement.'],
              ['Manoeuvre',  'Each ship spends TAC Speed to approach or flee.'],
              ['Attack',     'Each ship in initiative order fires, launches drones, or resolves a drone attack.'],
              ['Actions',    'Each ship in initiative order performs one crew action.'],
            ]}
          />
          <Note>At the end of Actions the round counter increments and the sequence repeats from Manoeuvre.</Note>
        </Section>

        {/* SETUP */}
        <Section id="setup" title="Setup Phase">
          <p>Right-click the background → <span className="text-slate-200">Add ship</span>. Choose profile, faction, and initial range band.</p>
          <p>Ships appear as bento cards grouped by faction. Each card shows hull bar, TAC Speed, armour, effective signature, weapons, critical tracks, and inbound drone ETA.</p>
          <p>Right-click a card → context menu. Available actions depend on phase and initiative turn.</p>
          <Sub title="CONTEXT MENU GATING">
            <KV k="Ship Sheet"       v="Always available." />
            <KV k="Manoeuvre…"       v="Manoeuvre phase · current actor only." />
            <KV k="Attack…"          v="Attack phase · current actor only · unfired slots remain." />
            <KV k="Launch Drone…"    v="Attack phase · current actor only. Launches one drone/missile unit (no salvo size)." />
            <KV k="Crew Action…"     v="Actions phase · current actor only." />
            <KV k="Resolve drone attack…" v="Appears once one of this ship's own drones closes to Close/Adjacent range." />
            <KV k="Assign Crew…"     v="Always available." />
            <KV k="Remove from battle" v="Always available." />
          </Sub>
        </Section>

        {/* INITIATIVE */}
        <Section id="initiative" title="Initiative">
          <p>Formula: <span className="text-slate-200">2D6 + Tactics(naval) + INT DM</span> — opposed check. // B3 p.54</p>
          <p>The Captain (or lead tactician) of each ship makes an opposed Tactics(naval) check. Highest total acts first. Ties re-roll. Order is fixed for the entire engagement.</p>
          <p><span className="text-amber-400">Surprise:</span> a surprised ship cannot act in the first round.</p>
          <Sub title="HOW TO ROLL">
            <p>Right-click background → <span className="text-slate-200">Roll Initiative</span>.</p>
            <KV k="Player ships"  v="Enter 2D6 dice manually. Select Tactics skill and INT DM." />
            <KV k="NPC ships"     v="Auto-rolled on confirm." />
            <KV k="🎲 button"     v="Opt-in auto-roll for player ships." />
          </Sub>
        </Section>

        {/* MANOEUVRE */}
        <Section id="manoeuvre" title="Manoeuvre Step">
          <p>Each ship in initiative order may spend TAC Speed to change range bands. // B3 p.52</p>
          <p>Right-click a ship → <span className="text-slate-200">Manoeuvre…</span></p>
          <Sub title="CONTROLS">
            <KV k="⬇ APPROACH"   v="Move toward the selected ship." />
            <KV k="⬆ FLEE"       v="Move away from the selected ship." />
            <KV k="APPLY"        v="Pool meets band cost — band shifts, TAC Speed spent." />
            <KV k="ALLOCATE"     v="Pool below cost — TAC Speed allocated, band unchanged. Progress bar shows % toward next change." />
            <KV k="GM SET"       v="Override — sets the band directly, no TAC Speed cost." />
          </Sub>
          <Note>TAC Speed accumulates across rounds within the same band pair. A ship that cannot cover the full cost in one round contributes partial thrust; the band changes when the pool is met.</Note>
          <Sub title="BAND COSTS // B3 p.52">
            <Table
              headers={['Band', 'Distance', 'TAC Speed cost']}
              rows={[
                ['Adjacent',  '< 100 km',           '1'],
                ['Close',     '≤ 150,000 km',        '1'],
                ['Short',     '≤ 300,000 km',        '2'],
                ['Medium',    '≤ 450,000 km',        '5'],
                ['Long',      '≤ 600,000 km',       '10'],
                ['Very Long', '≤ 750,000 km',       '25'],
                ['Distant',   '> 750,000 km',       '50'],
              ]}
            />
          </Sub>
        </Section>

        {/* ATTACK */}
        <Section id="attack" title="Attack Step — Firing Solution">
          <p>Each ship in initiative order may attack. The attack is a <span className="text-slate-200">3-step task chain</span> — positive Effect from each step carries forward as a DM to the next. // B3 p.56</p>
          <p>Right-click a ship → <span className="text-slate-200">Attack…</span></p>

          <Sub title="STEP 1 — SENSOR OPERATOR (Very Difficult 12+) Electronics(sensors) INT">
            <Table
              headers={['DM source', 'Value']}
              rows={[
                ['Target Signature',  '+Signature rating'],
                ['Sensor quality',    'Basic Military +0 / Improved +1 / Advanced +2'],
                ['Sensor Time-lag',   'Adj +1 / Close +0 / Short −1 / Med −2 / Long −3 / VL −4 / Dist −5'],
                ['Sensor Lock',       '+sensorLockDm (if active)'],
                ['Engineer assist',   'Routine (8+) Engineer(power) — adds Effect as DM'],
              ]}
            />
          </Sub>

          <Sub title="STEP 2 — PILOT (Difficult 10+) Pilot DEX">
            <Table
              headers={['DM source', 'Value']}
              rows={[
                ['TAC Speed available', '+tacSpeedAvailable'],
                ['Engineer assist',     'Routine (8+) Engineer(power) — adds Effect as DM'],
                ['Effect from Step 1',  'Positive Effect carries forward'],
              ]}
            />
          </Sub>

          <Sub title="STEP 3 — GUNNER (Difficult 10+) Gunner INT — target 10+">
            <Table
              headers={['DM source', 'Value']}
              rows={[
                ['Fire Control software', '+1 per level (FC/1 = +1, /2 = +2, /3 = +3)'],
                ['Effect from Step 2',    'Positive Effect carries forward'],
                ['EW jamming',            '−max(1, Effect) (applied to attacker)'],
                ['Sensor Lock',           '+sensorLockDm (on target ship)'],
                ['Command (Captain)',     '+1 or +2 if targeting gunner_turret this round'],
                ['Weapon trait Accurate', '+1'],
                ['Weapon trait Slow',     '−2'],
                ['Evasion (opposed Pilot)', '−1/−2, or +1 vs a badly-failed evasion — applies to both Sensor and Gunner checks'],
                ['Captain Tactics assist', 'Optional inline roll, Difficult (10+) Tactics(naval) INT — Effect adds to this check only'],
              ]}
            />
          </Sub>

          <Note>Stationary targets (reaction drive off, in orbit): DM+2 and damage doubled. // B3 p.56</Note>

          <Sub title="DAMAGE">
            <p>Roll weapon damage. Subtract Armour. Apply net to Hull Points.</p>
            <KV k="Advanced trait"  v="+1 damage per die" />
            <KV k="Obsolete trait"  v="−1 damage per die" />
            <KV k="AP X trait"      v="Ignores X points of Armour" />
          </Sub>
        </Section>

        {/* REACTIONS */}
        <Section id="reactions" title="Attack Step — Reactions">
          <p>The defender declares reactions before each attack resolves.</p>

          <Sub title="EVADE">
            <p>Opposed Pilot (DEX) check, declared during the Manoeuvre Step. Effect 1–4: <span className="text-slate-200">DM−1</span>; Effect 5+: <span className="text-slate-200">DM−2</span>; Effect ≤−5: enemy gains <span className="text-slate-200">DM+1</span>. Applies to both the enemy's Sensor Operator and Gunner checks for the rest of the round.</p>
          </Sub>

          <Sub title="POINT DEFENCE">
            <p>Against a single incoming drone/missile — resolved inline in the <span className="text-slate-200">Drone Attack</span> modal, before the Firing Solution. <span className="text-slate-200">Difficult (10+) Gunner (DEX)</span> check.</p>
            <p>Success: destroys that one drone. DM+4 for PDC weapons (e.g. Quinn Type 17), DM−2 for conventional mounts — a PDC can attempt up to TL−4 separate intercepts per round (GM-tracked).</p>
          </Sub>
        </Section>

        {/* ACTIONS */}
        <Section id="actions" title="Actions Step — Crew Actions">
          <p>Each ship in initiative order may perform one crew action. Right-click a ship → <span className="text-slate-200">Crew Action…</span></p>
          <p>Select the action, configure options, roll (if required), click <span className="text-slate-200">APPLY RESULT</span>.</p>

          <Sub title="CAPTAIN">
            <KV k="Commands" v="Average (8+) Leadership (INT or SOC). Order one crew role. Effect 1–4 → DM+1, Effect 5–6 → DM+2 to their actions. Declared in this round's Actions Step, activates for the following round (Manoeuvre + Attack + Actions)." />
            <KV k="Tactics assist" v="Optional inline roll inside the Attack modal, Difficult (10+) Tactics(naval) INT — adds its Effect to that single Gunner check only." />
          </Sub>

          <Sub title="ENGINEER">
            <KV k="Overload Stutterwarp" v="Difficult (10+) Engineer(stutterwarp) INT. Success: TAC Speed +1 this round. Failure: critical hit on Stutterwarp." />
            <KV k="Emergency Repair"     v="Average (8+) Engineer INT/EDU. System mode: reduce one critical severity by 1. Hull mode: restore 1 Hull Point." />
          </Sub>

          <Sub title="SENSOR OPERATOR">
            <KV k="Sensor Lock"       v="Average (8+) Electronics(sensors) INT. Success: target gains sensorLockDm = max(1, Effect). All attacks vs that ship gain this DM. Resets at round end." />
            <KV k="Electronic Warfare" v="Average (8+) Electronics(countermeasures) INT. Success: target suffers DM−max(1, Effect) on all attacks. Resets at round end." />
            <KV k="EW Countermeasures" v="Average (8+) Electronics(countermeasures) INT. Success: clears an active EW jam on this ship." />
            <KV k="Active Sensors"    v="Easy (6+) Electronics(sensors). Signature +1 while active (toggle off in Ship Sheet)." />
          </Sub>

          <Sub title="GUNNER">
            <KV k="Point Defence"  v="Moved to the Drone Attack modal — see REACTIONS above. Intercepts one drone at a time, not a crew action." />
            <KV k="Evasive Action" v="Automatic. Spend 1 TAC Speed → apply evasionDm to attacks this round." />
          </Sub>

          <Sub title="MECHANIC / ENGINEER">
            <KV k="Damage Control" v="Average (8+) Mechanic INT/EDU. Pick an active hazard (fire, breach, fuel leak, radiation). Success removes it. Effect ≥ 4: suppressed 1D rounds." />
          </Sub>

          <Sub title="MARINES">
            <KV k="Boarding Action" v="Average (8+) Gun Combat/Melee. Opposed roll vs defender — see Boarding section." />
            <KV k="Repel Boarders"  v="Average (8+) Gun Combat/Melee. Defender's roll for boarding resolution." />
          </Sub>

          <Note>Hazards are added by the GM via Ship Sheet → ACTIVE HAZARDS. Add labels like "Hull Fire", "Coolant Leak", "Radiation Exposure" — Damage Control clears them one at a time.</Note>
        </Section>

        {/* CRITICAL HITS */}
        <Section id="crits" title="Critical Hits">
          <Sub title="SURFACE FIXTURE DAMAGE // B3 p.58">
            <p>Triggered on any hit with <span className="text-slate-200">Effect ≥ 3</span>, even non-penetrating. Roll 2D:</p>
            <Table
              headers={['2D', 'System', '1st Hit', '2nd Hit']}
              rows={[
                ['2',    'Fire Control',    'DM−2 to attack rolls', '—'],
                ['3–4',  'Weapon',          '−1D damage, DM−2 to attacks', 'Disabled'],
                ['5',    'Sensors',         'DM−2 to Electronics(sensors)', '—'],
                ['6–8',  'Radiator',        'See Radiator rules', '—'],
                ['9',    'Sensors',         'DM−2 to Electronics(sensors)', '—'],
                ['10–11','Discharge Vanes', 'Disabled', 'Destroyed'],
                ['12',   'Other System',    'Disabled', 'Destroyed'],
              ]}
            />
          </Sub>

          <Sub title="INTERNAL CRITICAL HITS // B3 p.58 + CRB p.158–159">
            <p>Triggered when Effect ≥ 6, or when hull reaches 0. Roll 2D for location (CRB p.158).</p>
            <p>2300AD substitutions:</p>
            <KV k="J-Drive →" v="Stutterwarp Drive (severity reduces TAC Speed by −1 per level)" />
            <KV k="M-Drive →" v="Reaction Drive (1st crit: inoperable; 2nd: destroyed)" />
          </Sub>

          <Sub title="ACTIVE HAZARDS">
            <p>Some critical hits generate ongoing hazards (fire, hull breach, fuel leak, radiation). The GM adds hazards via <span className="text-slate-200">Ship Sheet → ACTIVE HAZARDS</span>. A successful <span className="text-slate-200">Damage Control</span> action removes one hazard.</p>
          </Sub>
        </Section>

        {/* DRONES / MISSILES */}
        <Section id="missiles" title="Drones / Missiles">
          <p>2300AD B3 has no "salvo" abstraction — each drone/missile is an individually piloted unit that closes range on its own TAC Speed and resolves its own 3-step Firing Solution, exactly like a ship. // B3 p.55–56, p.61</p>

          <Sub title="LAUNCHING">
            <p>Right-click attacker → <span className="text-slate-200">Launch Drone…</span> Pick target, weapon (Ritage-1/2, 'Whiskey', or vehicle-sourced missiles), and how many separate units to launch. Each unit is tracked independently in the Drone Tracker and closes one range band per round.</p>
          </Sub>

          <Sub title="RESOLVING AN ATTACK">
            <p>Once a ship's own drone reaches Close/Adjacent range, right-click that ship → <span className="text-slate-200">Resolve drone attack…</span> (or click it in the Drone Tracker). This opens the same 3-step Firing Solution as a normal attack:</p>
            <KV k="Step 1 — Sensor" v="Hand-off from a sensor operator (no penalty) or self-generated by the Remote Pilot (Piloting action, DM−2)." />
            <KV k="Step 2 — Position Vessel" v="Remote Pilot, Electronics(remote ops) DEX, +drone TAC Speed." />
            <KV k="Step 3 — Gunner" v="Difficult (10+), Fire Control + range DM at the drone's current band + target's reactive DMs." />
          </Sub>

          <Sub title="POINT DEFENCE">
            <p>Resolved inline, at the top of the same modal — one drone at a time. <span className="text-slate-200">Difficult (10+) Gunner (DEX)</span>, DM+4 for PDC weapons / DM−2 for conventional mounts. Success destroys that specific drone before it can attack.</p>
          </Sub>

          <Sub title="ENDURANCE">
            <p>Each drone has a maximum number of rounds (Endurance, from its weapon stats) before it goes inert if it never reaches its target.</p>
          </Sub>
        </Section>

        {/* BOARDING */}
        <Section id="boarding" title="Boarding">
          <p>Close-quarters resolution. One opposed roll per round. Only at <span className="text-slate-200">Adjacent range</span> during the Actions Step.</p>
          <p>Attacker declares <span className="text-slate-200">Boarding Action</span>; defender declares <span className="text-slate-200">Repel Boarders</span>.</p>
          <p>Both roll 2D6 + Gun Combat/Melee + modifiers. Attacker total − Defender total = difference.</p>

          <Sub title="MODIFIERS">
            <Table
              headers={['Condition', 'DM']}
              rows={[
                ['Superior armour', '+1'],
                ['Superior weapons', '+1'],
                ['Superior skill / tactics', '+2'],
                ['Outnumber defender', '+1'],
                ['Vastly outnumber defender', '+3'],
                ['Defender without assigned marines', '−2'],
              ]}
            />
          </Sub>

          <Sub title="RESULT TABLE (attacker − defender)">
            <Table
              headers={['Difference', 'Result', 'Hull damage']}
              rows={[
                ['−7 or less', 'Attackers defeated; defender may counter-attack DM+4', '—'],
                ['−4 to −6',  'Attackers defeated; must retreat or are captured', '—'],
                ['−1 to −3',  'Combat continues; defender DM+2 next round', '2D Hull to defending ship'],
                ['0',          'Combat continues; no advantage', '—'],
                ['1 to 3',     'Combat continues; attacker DM+2 next round', '2D Hull to defending ship'],
                ['4 to 6',     'Boarding succeeded; 2D rounds to pacify', '1D Hull (ignores Armour)'],
                ['7 or more',  'Immediate boarding; ship control passes to attackers', '—'],
              ]}
            />
          </Sub>
          <Note>DM carry-over to next round is noted in the log. The GM enters it manually as a modifier in the next boarding roll.</Note>
        </Section>

        {/* SIGNATURE */}
        <Section id="signature" title="Signature">
          <p>Every ship has a base <span className="text-slate-200">Signature</span> value — used as a positive DM in enemy Electronics(sensors) checks during Firing Solution Step 1. // B3 p.57</p>
          <p>Open the <span className="text-slate-200">Ship Sheet</span> to see the breakdown and toggle conditions.</p>

          <Sub title="AUTOMATIC MODIFIERS">
            <Table
              headers={['Condition', 'Signature DM']}
              rows={[
                ['Hull damage > 50%', '+1'],
                ['Power Plant critical hit', '+1'],
                ['EW active on this ship', '+2'],
              ]}
            />
          </Sub>

          <Sub title="GM TOGGLES (Ship Sheet → Signature Conditions)">
            <Table
              headers={['Condition', 'DM']}
              rows={[
                ['Radiators Retracted',   '−1'],
                ['Heat Sink Active',      '−4'],
                ['Solar Panels Extended', '+2'],
                ['Spin Habitat Retracted','−1'],
                ['Reaction Drive Active', '+4 / +6 / +8 (rockets / thrusters / nuclear)'],
                ['Active Sensors On',     '+1'],
                ['Stealth',               '−4'],
              ]}
            />
          </Sub>
        </Section>

        {/* UNDO / REDO */}
        <Section id="undo-redo" title="Undo / Redo">
          <p>Every game state change pushes a snapshot to the undo stack (50-step maximum).</p>
          <KV k="↩ Undo" v="Restore the previous state. Appears in HUD when stack is non-empty." />
          <KV k="↪ Redo" v="Re-apply an undone action. Appears in HUD when redo stack is non-empty." />
          <Note>The battle log is not rolled back on undo — an ↩ Undo entry is appended instead.</Note>
        </Section>

        {/* SAVE & RESUME */}
        <Section id="save" title="Save & Resume">
          <Sub title="AUTOSAVE">
            <p>The app autosaves to IndexedDB after every significant action. On return, click <span className="text-slate-200">🔄 RESUME</span> on the Dashboard to restore instantly.</p>
          </Sub>
          <Sub title="MANUAL SAVE">
            <p>Click <span className="text-slate-200">💾 SAVE</span> in the HUD to download the full session as a <code className="text-(--neon-cyan)">.json</code> file.</p>
          </Sub>
          <Sub title="RESUME FROM FILE">
            <p>Dashboard → <span className="text-slate-200">↓ RESUME FROM FILE</span>. Select a <code className="text-(--neon-cyan)">.json</code> file. A preview shows the full roster before you confirm loading.</p>
          </Sub>
          <Sub title="PROFILE EXPORT / IMPORT">
            <p>Ship profiles are independent from battle sessions. Use <span className="text-slate-200">↑ EXPORT</span> / <span className="text-slate-200">↓ IMPORT</span> in the profile panel to share or back up profiles separately.</p>
          </Sub>
          <Note>Clicking 🏠 in the HUD returns to the Dashboard. A confirmation modal warns that unsaved battle data will be lost.</Note>
        </Section>

      </main>
    </div>
  )
}
