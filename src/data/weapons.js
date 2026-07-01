// 2300AD B3 p.60–61 — Canonical 2300AD spacecraft weapons.
// CRB weapons (pulse_laser, beam_laser, particle_barbette, etc.) retained as legacy
// stand-ins for profiles created before B3 weapons were added; do not use for new profiles.
// Range DMs: Adjacent +2, Close +0, Short -6 per B3 p.57. Beyond Short → -20 (out of range).

/**
 * Attack DM vs target band for each weapon.
 * Values represent penalty (negative) or bonus vs the weapon's optimal range.
 *
 * @typedef {{ Adjacent: number, Close: number, Short: number, Medium: number, Long: number, VeryLong: number, Distant: number }} RangeDmTable
 *
 * @typedef {{
 *   id: string,
 *   name: string,
 *   mount: 'turret' | 'barbette' | 'bay',
 *   TL: number,
 *   damage: string,      // dice notation, e.g. "2D"
 *   damageBonus: number, // flat bonus per additional weapon in same turret (double/triple rule)
 *   optimalRange: string,
 *   rangeDm: RangeDmTable,
 *   traits: string[],
 *   notes: string,
 * }} WeaponDef
 */

/** @type {Record<string, WeaponDef>} */
export const WEAPONS = {
  // ── Trav2022 CRB weapons ───────────────────────────────────────────────────

  pulse_laser: {
    id: 'pulse_laser',
    name: 'Pulse Laser',
    mount: 'turret',
    TL: 9,
    damage: '2D',
    damageBonus: 2, // +2 per additional laser in turret (multi-weapon rule, Trav2022 CRB p.167)
    optimalRange: 'Short',
    rangeDm: {
      Adjacent: -1,
      Close:     0,
      Short:     0,
      Medium:   -2,
      Long:     -4,
      VeryLong: -6,
      Distant:  -8,
    },
    traits: [],
    notes: 'High damage at short range. Standard turret laser.',
  },

  beam_laser: {
    id: 'beam_laser',
    name: 'Beam Laser',
    mount: 'turret',
    TL: 9,
    damage: '1D',
    damageBonus: 1, // +1 per additional beam laser in turret
    optimalRange: 'Medium',
    rangeDm: {
      Adjacent: -2,
      Close:    -1,
      Short:     0,
      Medium:    0,
      Long:     -1,
      VeryLong: -3,
      Distant:  -5,
    },
    traits: [],
    notes: 'Lower damage, longer effective range than pulse laser.',
  },

  missile_rack: {
    id: 'missile_rack',
    name: 'Missile Rack',
    mount: 'turret',
    TL: 6,
    damage: '4D',   // per missile on impact // Trav2022 CRB p.168
    damageBonus: 0, // missiles do not gain the multi-weapon bonus // Trav2022 CRB p.167
    optimalRange: 'Long',
    rangeDm: {
      Adjacent:  0,
      Close:     0,
      Short:     0,
      Medium:    0,
      Long:      0,
      VeryLong:  0,
      Distant:   0,
    },
    traits: ['Smart', 'AP5'],
    notes: 'Attack roll deferred to missile impact round. Missiles travel N rounds before impact.',
  },

  particle_barbette: {
    id: 'particle_barbette',
    name: 'Particle Barbette',
    mount: 'barbette',
    TL: 8,
    damage: '4D',
    damageBonus: 0, // barbettes are single-mount
    optimalRange: 'Long',
    rangeDm: {
      Adjacent: -3,
      Close:    -2,
      Short:    -1,
      Medium:    0,
      Long:      0,
      VeryLong: -1,
      Distant:  -3,
    },
    traits: ['Radiation'],
    notes: 'Ignores armour (AP∞). On hit, crew in targeted compartment take 2D6 radiation exposure.',
  },

  // ── 2300AD canonical weapons — B3 p.60–61 ────────────────────────────────

  ll88: {
    id: 'll88',
    name: 'Darlan LL-88',
    mount: 'turret',
    TL: 10,
    damage: '1D-1',
    damageBonus: 0,
    optimalRange: 'Close',      // Range: Close // 2300AD B3 p.60
    rangeDm: {
      Adjacent:  2,
      Close:     0,
      Short:   -20,
      Medium:  -20,
      Long:    -20,
      VeryLong:-20,
      Distant: -20,
    },
    traits: ['Obsolete', 'Accurate'], // 2300AD B3 p.60
    notes: 'Darlan LL-88. Older surplus beam laser. Obsolete (−1 dmg/die), Accurate (DM+1 to hit). // 2300AD B3 p.60',
  },

  darlan_g2: {
    id: 'darlan_g2',
    name: 'Darlan G2 (Laser Drill)',
    mount: 'turret',
    TL: 10,
    damage: '1D-1',
    damageBonus: 0,
    optimalRange: 'Adjacent',   // Range: Adjacent // 2300AD B3 p.60
    rangeDm: {
      Adjacent:  2,
      Close:     0,
      Short:   -20,
      Medium:  -20,
      Long:    -20,
      VeryLong:-20,
      Distant: -20,
    },
    traits: ['Obsolete'],       // 2300AD B3 p.60
    notes: 'Darlan G2 industrial laser drill. Adjacent range only. Obsolete (−1 dmg/die). // 2300AD B3 p.60',
  },

  allen_bmz50: {
    id: 'allen_bmz50',
    name: 'Allen BMZ-50',
    mount: 'turret',
    TL: 11,
    damage: '3D',
    damageBonus: 0,
    optimalRange: 'Close',      // Range: Close // 2300AD B3 p.60
    rangeDm: {
      Adjacent:  2,
      Close:     0,
      Short:   -20,
      Medium:  -20,
      Long:    -20,
      VeryLong:-20,
      Distant: -20,
    },
    traits: ['AP4', 'EM', 'Inefficient', 'Slow'], // 2300AD B3 p.60
    notes: 'Allen BMZ-50 particle beam. AP 4, EM (extra crit roll), Inefficient (×2 power), Slow (DM−2 to hit). // 2300AD B3 p.60',
  },

  ll98: {
    id: 'll98',
    name: 'LL98 Liquid Laser',
    mount: 'turret',
    TL: 11,
    damage: '2D',
    damageBonus: 1,
    optimalRange: 'Close',  // Darlan LL-98: Range Close // 2300AD B3 p.60
    rangeDm: {
      Adjacent:  2,
      Close:     0,
      Short:   -20, // beyond max range
      Medium:  -20,
      Long:    -20,
      VeryLong:-20,
      Distant: -20,
    },
    traits: ['Accurate'],  // 2300AD B3 p.60
    notes: 'Darlan LL-98. Standard 2300AD beam laser. Retractable surface mount. // 2300AD B3 p.60, p.80',
  },

  ea1000: {
    id: 'ea1000',
    name: 'EA1000 Energy Assault',
    mount: 'turret',
    TL: 12,
    damage: '2D',
    damageBonus: 2,
    optimalRange: 'Close', // laser-type weapon, Close range
    rangeDm: {
      Adjacent:  2,
      Close:     0,
      Short:   -20,
      Medium:  -20,
      Long:    -20,
      VeryLong:-20,
      Distant: -20,
    },
    traits: [],
    notes: '2300AD fighter primary energy weapon. Fixed retractable mount. // 2300AD B3 p.78',
  },

  aero12: {
    id: 'aero12',
    name: 'Aero-12 Missile',
    mount: 'turret',
    TL: 12,
    damage: '4D',
    damageBonus: 0,
    optimalRange: 'Long',
    rangeDm: {
      Adjacent: 0,
      Close:    0,
      Short:    0,
      Medium:   0,
      Long:     0,
      VeryLong: 0,
      Distant:  0,
    },
    traits: ['Smart', 'AP5'],
    notes: 'Smart anti-vehicle missile. Internal bay mount. // 2300AD B3 p.70',
  },

  anti_missile_laser: {
    id: 'anti_missile_laser',
    name: 'Quinn Type 17 PDC',
    mount: 'turret',
    TL: 12,
    damage: '1D',             // 2300AD B3 p.60
    damageBonus: 0,
    optimalRange: 'Adjacent', // Range: Adjacent // 2300AD B3 p.60
    rangeDm: {
      Adjacent:  2,
      Close:     0,  // Point Defence works at Close range (intercept role)
      Short:   -20,
      Medium:  -20,
      Long:    -20,
      VeryLong:-20,
      Distant: -20,
    },
    traits: ['Reaction', 'Point Defence', 'Rapid Fire'], // 2300AD B3 p.60
    notes: 'Quinn Optronics PDC Type 17. Beam laser cluster. DM+2 vs missiles/drones/fighters at Close. // 2300AD B3 p.60',
  },

  autocannon_25mm: {
    id: 'autocannon_25mm',
    name: '25mm Rotary Autocannon',
    mount: 'turret',
    TL: 10,
    damage: '2D',
    damageBonus: 1,
    optimalRange: 'Close',
    rangeDm: {
      Adjacent:  2,
      Close:     0,
      Short:   -20,
      Medium:  -20,
      Long:    -20,
      VeryLong:-20,
      Distant: -20,
    },
    traits: [],
    notes: 'Short-range rotary cannon. Retractable mount. // 2300AD B3 p.70',
  },

  grumbler: {
    id: 'grumbler',
    name: "Kaefer 'Grumbler' Laser",
    mount: 'turret',
    TL: 12,               // 2300AD B3 p.60
    damage: '2D+2',
    damageBonus: 0,
    optimalRange: 'Short', // Range: Short — extended range pulse laser // 2300AD B3 p.60
    rangeDm: {
      Adjacent:  2,
      Close:     0,
      Short:    -6,  // can fire at Short (unique for a non-missile weapon) // 2300AD B3 p.57
      Medium:  -20,
      Long:    -20,
      VeryLong:-20,
      Distant: -20,
    },
    traits: ['Advanced', 'Inefficient'], // 2300AD B3 p.60 — NOT 'Extended Range'
    notes: "Kaefer 'Grumbler' High Power Laser Array. TL12. Advanced (+1 dmg/die), Inefficient (×2 power). // 2300AD B3 p.60, p.110",
  },

  kingfisher: {
    id: 'kingfisher',
    name: 'Kaefer Kingfisher Missile',
    mount: 'turret',
    TL: 10,
    damage: '8D',
    damageBonus: 0,
    optimalRange: 'Long',
    rangeDm: {
      Adjacent: 0,
      Close:    0,
      Short:    0,
      Medium:   0,
      Long:     0,
      VeryLong: 0,
      Distant:  0,
    },
    traits: ['Smart', 'AP16', 'One Use'],
    notes: 'Kaefer anti-ship missile. High damage, deep armour penetration. // 2300AD B3 p.110',
  },

  tri_beamer: {
    id: 'tri_beamer',
    name: 'Kaefer Tri-Beamer',
    mount: 'turret',
    TL: 12,
    damage: '5D',
    damageBonus: 0,
    optimalRange: 'Adjacent',
    rangeDm: {
      Adjacent:  0,
      Close:    -2,
      Short:    -4,
      Medium:   -6,
      Long:     -8,
      VeryLong:-10,
      Distant: -12,
    },
    traits: ['AP12', 'Auto 3'],
    notes: 'Kaefer close-range rapid-fire weapon. Devastating only at Adjacent range. // 2300AD B3 p.110',
  },
}

/** Ordered list for UI display — B3 canonical weapons first, CRB legacy last. */
export const WEAPON_IDS = [
  // 2300AD B3 p.60–61
  'll88',
  'darlan_g2',
  'll98',
  'anti_missile_laser',
  'grumbler',
  'allen_bmz50',
  // B3 / 2300AD extended
  'ea1000',
  'autocannon_25mm',
  'aero12',
  'kingfisher',
  'tri_beamer',
  // CRB legacy (retained for backwards compatibility only)
  'pulse_laser',
  'beam_laser',
  'missile_rack',
  'particle_barbette',
]
