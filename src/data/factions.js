/** @type {{ id: string, label: string, color: string }[]} */
export const FACTIONS = [
  { id: 'players', label: 'Players',  color: '#60a5fa' }, // blue-400
  { id: 'npc',     label: 'NPC',      color: '#f87171' }, // red-400
  { id: 'neutral', label: 'Neutral',  color: '#a3a3a3' }, // neutral-400
]

/** @type {Record<string, string>} */
export const FACTION_COLOR = Object.fromEntries(FACTIONS.map((f) => [f.id, f.color]))
