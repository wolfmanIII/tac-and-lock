// Trav2022 CRB pp.162–163 — Critical hit locations and severity effects.
// 2300AD substitutions: M-Drive → Stutterwarp Drive; J-Drive → Stutterwarp (FTL).

/**
 * Roll 2D6 on this table to determine which system is hit.
 * @type {Record<number, string>}
 */
export const CRITICAL_LOCATION_TABLE = {
  2:  'sensors',
  3:  'bridge',
  4:  'hull',
  5:  'weapon',
  6:  'armour',
  7:  'crew',
  8:  'stutterwarpDrive', // Tactical manoeuvre drive (was M-Drive)
  9:  'powerPlant',
  10: 'stutterwarpFtl',   // FTL stutterwarp (was J-Drive)
  11: 'fuel',
  12: 'computer',
}

/** All 11 trackable critical hit systems. */
export const CRITICAL_HIT_SYSTEMS = [
  'sensors',
  'bridge',
  'hull',
  'weapon',
  'armour',
  'crew',
  'stutterwarpDrive',
  'powerPlant',
  'stutterwarpFtl',
  'fuel',
  'computer',
]

/**
 * Severity 1–6 effects per system.
 * `mechanics` defines trackable game state changes applied when severity is reached.
 *
 * Mechanic types:
 *   sensors_dm        — DM applied to all sensor and targeting rolls
 *   sensors_offline   — sensors non-functional
 *   bridge_dm         — DM to all bridge crew actions
 *   bridge_offline    — bridge non-functional
 *   hull_breach       — compartment breached; crew need vacc suits
 *   ship_destroyed    — ship is destroyed
 *   weapon_damage_dm  — DM to next weapon damage roll (first affected weapon)
 *   weapon_offline    — one weapon system offline
 *   weapon_destroyed  — one weapon system permanently destroyed
 *   armour_reduce     — reduce current armour value by amount
 *   crew_casualty     — number of crew incapacitated (roll 2D6 to determine count)
 *   tacSpeed_reduce   — reduce effective TAC Speed by amount
 *   tacSpeed_zero     — TAC Speed reduced to 0
 *   power_dm          — DM to all powered-system checks
 *   power_offline     — power plant offline; no weapons or sensors
 *   stutterwarp_ftl_damaged — FTL incapable
 *   stutterwarp_ftl_destroyed — FTL drive destroyed
 *   fuel_leak         — fuel lost per round (GM tracks amount)
 *   fuel_critical     — imminent explosion if not addressed
 *   computer_dm       — DM to all software-aided actions
 *   computer_offline  — all software offline; manual control only
 *
 * @type {Record<string, Record<number, { label: string, mechanics: { type: string, value?: any }[] }>>}
 */
export const CRITICAL_HIT_EFFECTS = {
  sensors: {
    1: {
      label: 'Sensor interference — DM-1 to all sensor rolls.',
      mechanics: [{ type: 'sensors_dm', value: -1 }],
    },
    2: {
      label: 'Sensor array damaged — DM-2 to sensors, effective range halved.',
      mechanics: [{ type: 'sensors_dm', value: -2 }],
    },
    3: {
      label: 'Sensors severely damaged — DM-3 to sensors, limited to Short range.',
      mechanics: [{ type: 'sensors_dm', value: -3 }],
    },
    4: {
      label: 'Sensors offline — cannot perform sensor checks or targeting.',
      mechanics: [{ type: 'sensors_offline', value: true }],
    },
    5: {
      label: 'Sensor array destroyed — sensors offline, DM-2 to all attack rolls.',
      mechanics: [
        { type: 'sensors_offline', value: true },
        { type: 'sensors_dm', value: -2 },
      ],
    },
    6: {
      label: 'Total sensor loss — sensors destroyed, DM-4 to all attacks, no EW possible.',
      mechanics: [
        { type: 'sensors_offline', value: true },
        { type: 'sensors_dm', value: -4 },
      ],
    },
  },

  bridge: {
    1: {
      label: 'Bridge hit — DM-1 to all bridge crew checks.',
      mechanics: [{ type: 'bridge_dm', value: -1 }],
    },
    2: {
      label: 'Bridge damaged — DM-2 to all bridge crew checks.',
      mechanics: [{ type: 'bridge_dm', value: -2 }],
    },
    3: {
      label: 'Bridge heavily damaged — DM-3 to all checks; 1 crew casualty.',
      mechanics: [
        { type: 'bridge_dm', value: -3 },
        { type: 'crew_casualty', value: 1 },
      ],
    },
    4: {
      label: 'Bridge depressurised — crew must use vacc suits; DM-2 to all actions.',
      mechanics: [
        { type: 'hull_breach', value: true },
        { type: 'bridge_dm', value: -2 },
      ],
    },
    5: {
      label: 'Bridge crippled — offline; DM-6 to all ship actions; 1D crew casualties.',
      mechanics: [
        { type: 'bridge_offline', value: true },
        { type: 'crew_casualty', value: 'D6' },
      ],
    },
    6: {
      label: 'Bridge destroyed — 2D crew casualties; ship on backup systems only.',
      mechanics: [
        { type: 'bridge_offline', value: true },
        { type: 'crew_casualty', value: '2D6' },
      ],
    },
  },

  hull: {
    1: {
      label: 'Minor hull breach — atmosphere venting in one compartment.',
      mechanics: [{ type: 'hull_breach', value: true }],
    },
    2: {
      label: 'Significant breach — multiple compartments venting.',
      mechanics: [{ type: 'hull_breach', value: true }],
    },
    3: {
      label: 'Major breach — primary structure damaged; DM-1 to all checks.',
      mechanics: [
        { type: 'hull_breach', value: true },
        { type: 'bridge_dm', value: -1 },
      ],
    },
    4: {
      label: 'Structural compromise — ship handling severely degraded; 1D crew casualties.',
      mechanics: [
        { type: 'hull_breach', value: true },
        { type: 'crew_casualty', value: 'D6' },
      ],
    },
    5: {
      label: 'Hull integrity critical — imminent structural failure; 2D crew casualties.',
      mechanics: [
        { type: 'hull_breach', value: true },
        { type: 'crew_casualty', value: '2D6' },
      ],
    },
    6: {
      label: 'Hull destroyed — ship is destroyed.',
      mechanics: [{ type: 'ship_destroyed', value: true }],
    },
  },

  weapon: {
    1: {
      label: 'Weapon hit — one turret/barbette suffers DM-1 to next damage roll.',
      mechanics: [{ type: 'weapon_damage_dm', value: -1 }],
    },
    2: {
      label: 'Weapon damaged — one weapon offline until repaired (DC Average 8+).',
      mechanics: [{ type: 'weapon_offline', value: 1 }],
    },
    3: {
      label: 'Weapon destroyed — one weapon permanently destroyed.',
      mechanics: [{ type: 'weapon_destroyed', value: 1 }],
    },
    4: {
      label: 'Multiple weapons hit — two weapons offline until repaired.',
      mechanics: [{ type: 'weapon_offline', value: 2 }],
    },
    5: {
      label: 'Weapons crippled — two weapons destroyed, all remaining suffer DM-2.',
      mechanics: [
        { type: 'weapon_destroyed', value: 2 },
        { type: 'weapon_damage_dm', value: -2 },
      ],
    },
    6: {
      label: 'Weapons destroyed — all weapons destroyed.',
      mechanics: [{ type: 'weapon_destroyed', value: 99 }],
    },
  },

  armour: {
    1: {
      label: 'Armour ablated — Armour reduced by 2.',
      mechanics: [{ type: 'armour_reduce', value: 2 }],
    },
    2: {
      label: 'Armour damaged — Armour reduced by 4.',
      mechanics: [{ type: 'armour_reduce', value: 4 }],
    },
    3: {
      label: 'Armour seriously degraded — Armour reduced by 6.',
      mechanics: [{ type: 'armour_reduce', value: 6 }],
    },
    4: {
      label: 'Armour halved — current Armour value halved (round down).',
      mechanics: [{ type: 'armour_halve', value: true }],
    },
    5: {
      label: 'Armour destroyed — Armour reduced to 0.',
      mechanics: [{ type: 'armour_reduce', value: 999 }],
    },
    6: {
      label: 'Armour catastrophically stripped — Armour 0; DM-2 to all future hull rolls.',
      mechanics: [
        { type: 'armour_reduce', value: 999 },
        { type: 'bridge_dm', value: -2 },
      ],
    },
  },

  crew: {
    1: {
      label: 'Crew casualty — 1 crew member incapacitated.',
      mechanics: [{ type: 'crew_casualty', value: 1 }],
    },
    2: {
      label: 'Crew casualties — 1D crew incapacitated.',
      mechanics: [{ type: 'crew_casualty', value: 'D6' }],
    },
    3: {
      label: 'Crew heavily hit — 2D crew casualties; DM-1 to all actions.',
      mechanics: [
        { type: 'crew_casualty', value: '2D6' },
        { type: 'bridge_dm', value: -1 },
      ],
    },
    4: {
      label: 'Key crew incapacitated — GM chooses: Pilot, Captain, or Engineer out.',
      mechanics: [{ type: 'crew_casualty', value: 'key' }],
    },
    5: {
      label: 'Bridge crew hit — all bridge crew take 2D6 damage; DM-2 to all checks.',
      mechanics: [
        { type: 'crew_casualty', value: '2D6' },
        { type: 'bridge_dm', value: -2 },
      ],
    },
    6: {
      label: 'Mass crew casualties — 3D crew killed; roles may be vacated.',
      mechanics: [{ type: 'crew_casualty', value: '3D6' }],
    },
  },

  stutterwarpDrive: {
    // Tactical stutterwarp (replaces M-Drive). // 2300AD substitution
    1: {
      label: 'Stutterwarp hit — TAC Speed reduced by 1 (min 1).',
      mechanics: [{ type: 'tacSpeed_reduce', value: 1 }],
    },
    2: {
      label: 'Drive damaged — TAC Speed reduced by 2.',
      mechanics: [{ type: 'tacSpeed_reduce', value: 2 }],
    },
    3: {
      label: 'Drive seriously damaged — TAC Speed halved (round down, min 1).',
      mechanics: [{ type: 'tacSpeed_halve', value: true }],
    },
    4: {
      label: 'Drive crippled — TAC Speed reduced to 1.',
      mechanics: [{ type: 'tacSpeed_reduce', value: 99 }, { type: 'tacSpeed_minimum', value: 1 }],
    },
    5: {
      label: 'Drive offline — TAC Speed 0; cannot manoeuvre.',
      mechanics: [{ type: 'tacSpeed_zero', value: true }],
    },
    6: {
      label: 'Drive destroyed — stutterwarp tactical drive destroyed; drift only.',
      mechanics: [{ type: 'tacSpeed_zero', value: true }],
    },
  },

  powerPlant: {
    1: {
      label: 'Power fluctuation — DM-1 to all powered systems this round.',
      mechanics: [{ type: 'power_dm', value: -1 }],
    },
    2: {
      label: 'Power reduced — DM-2 to powered systems; one weapon must be powered down.',
      mechanics: [{ type: 'power_dm', value: -2 }],
    },
    3: {
      label: 'Power compromised — only essential systems; DM-2; weapons at half effectiveness.',
      mechanics: [{ type: 'power_dm', value: -2 }],
    },
    4: {
      label: 'Emergency power — minimal life support only; sensors and weapons offline.',
      mechanics: [
        { type: 'power_dm', value: -4 },
        { type: 'sensors_offline', value: true },
        { type: 'weapon_offline', value: 99 },
      ],
    },
    5: {
      label: 'Power plant offline — all powered systems fail.',
      mechanics: [{ type: 'power_offline', value: true }],
    },
    6: {
      label: 'Power plant destroyed — ship dead in space; 1D crew casualties.',
      mechanics: [
        { type: 'power_offline', value: true },
        { type: 'crew_casualty', value: 'D6' },
      ],
    },
  },

  stutterwarpFtl: {
    // FTL stutterwarp (replaces J-Drive). // 2300AD substitution
    1: {
      label: 'FTL matrix disrupted — stutterwarp efficiency reduced; next jump takes +1 day.',
      mechanics: [{ type: 'stutterwarp_ftl_damaged', value: true }],
    },
    2: {
      label: 'FTL coils damaged — power draw increased; DM-1 to stutterwarp jumps.',
      mechanics: [{ type: 'stutterwarp_ftl_damaged', value: true }],
    },
    3: {
      label: 'FTL drive seriously damaged — DM-2 to jumps; repair needed before long range.',
      mechanics: [{ type: 'stutterwarp_ftl_damaged', value: true }],
    },
    4: {
      label: 'FTL drive disabled — cannot perform stutterwarp until repaired.',
      mechanics: [{ type: 'stutterwarp_ftl_damaged', value: true }],
    },
    5: {
      label: 'FTL drive destroyed — stutterwarp beyond field repair.',
      mechanics: [{ type: 'stutterwarp_ftl_destroyed', value: true }],
    },
    6: {
      label: 'FTL drive explodes — stutterwarp destroyed; 2D structural damage to hull.',
      mechanics: [
        { type: 'stutterwarp_ftl_destroyed', value: true },
        { type: 'crew_casualty', value: '2D6' },
      ],
    },
  },

  fuel: {
    1: {
      label: 'Minor fuel leak — losing fuel; monitor closely.',
      mechanics: [{ type: 'fuel_leak', value: 1 }],
    },
    2: {
      label: 'Fuel leak — losing fuel each round; repair required.',
      mechanics: [{ type: 'fuel_leak', value: 2 }],
    },
    3: {
      label: 'Significant fuel loss — major leak; range severely reduced.',
      mechanics: [{ type: 'fuel_leak', value: 3 }],
    },
    4: {
      label: 'Major fuel breach — critical fuel loss; emergency dump or risk explosion.',
      mechanics: [{ type: 'fuel_leak', value: 5 }],
    },
    5: {
      label: 'Fuel critical — dump or explode next round (GM call). 1D crew casualties.',
      mechanics: [
        { type: 'fuel_critical', value: true },
        { type: 'crew_casualty', value: 'D6' },
      ],
    },
    6: {
      label: 'Fuel explosion — catastrophic; ship destroyed.',
      mechanics: [{ type: 'ship_destroyed', value: true }],
    },
  },

  computer: {
    1: {
      label: 'Software glitch — DM-1 to all software-aided actions.',
      mechanics: [{ type: 'computer_dm', value: -1 }],
    },
    2: {
      label: 'Computer hit — DM-2; one software package crashes.',
      mechanics: [{ type: 'computer_dm', value: -2 }],
    },
    3: {
      label: 'Computer damaged — DM-3; multiple software offline.',
      mechanics: [{ type: 'computer_dm', value: -3 }],
    },
    4: {
      label: 'Computer severely hit — only basic navigation; DM-4 to all software actions.',
      mechanics: [{ type: 'computer_dm', value: -4 }],
    },
    5: {
      label: 'Computer offline — all software non-functional; manual operations only.',
      mechanics: [{ type: 'computer_offline', value: true }],
    },
    6: {
      label: 'Computer destroyed — total loss; ship on emergency backup.',
      mechanics: [{ type: 'computer_offline', value: true }],
    },
  },
}

/** Labels for each critical hit system. */
export const CRITICAL_HIT_SYSTEM_LABELS = {
  sensors:          'Sensors',
  bridge:           'Bridge',
  hull:             'Hull',
  weapon:           'Weapon',
  armour:           'Armour',
  crew:             'Crew',
  stutterwarpDrive: 'Stutterwarp Drive',
  powerPlant:       'Power Plant',
  stutterwarpFtl:   'Stutterwarp (FTL)',
  fuel:             'Fuel',
  computer:         'Computer',
}
