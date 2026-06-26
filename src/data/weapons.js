// Trav2022 CRB p.168 — Spacecraft weapons (turrets & barbettes).
// 2300AD uses TL10–12 weaponry; only weapons available in CRB are listed.

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

  sandcaster: {
    id: 'sandcaster',
    name: 'Sandcaster',
    mount: 'turret',
    TL: 5,
    damage: '0',    // not an attack weapon
    damageBonus: 0,
    optimalRange: 'Short',
    rangeDm: {
      Adjacent:  0,
      Close:     0,
      Short:     0,
      Medium:    0,
      Long:      0,
      VeryLong:  0,
      Distant:   0,
    },
    traits: ['Reaction'],
    notes: 'Reaction weapon. Absorbs 1D3 laser damage per sandcaster deployed against a salvo. Each linked sandcaster adds +1 Armour vs that attack.',
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
}

/** Ordered list for UI display. */
export const WEAPON_IDS = [
  'pulse_laser',
  'beam_laser',
  'missile_rack',
  'sandcaster',
  'particle_barbette',
]
