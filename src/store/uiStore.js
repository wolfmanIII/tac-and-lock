import { create } from 'zustand'

/**
 * @typedef {'dashboard' | 'battle' | 'help'} Screen
 *
 * @typedef {{
 *   screen: Screen,
 *   gotoScreen: (s: Screen) => void,
 *
 *   activeModal: string | null,
 *   modalPayload: any,
 *   openModal: (id: string, payload?: any) => void,
 *   closeModal: () => void,
 *
 *   selectedShipId: string | null,
 *   selectShip: (id: string | null) => void,
 *   clearSelection: () => void,
 *
 *   contextMenu: { x: number, y: number, shipId: string } | null,
 *   showContextMenu: (x: number, y: number, shipId: string) => void,
 *   hideContextMenu: () => void,
 *
 *   audioEnabled: boolean,
 *   toggleAudio: () => void,
 * }} UIStore
 */

export const useUIStore = create((set) => ({
  // === SCREEN ===
  screen: 'dashboard',
  gotoScreen: (screen) => set({ screen }),

  // === MODAL ===
  activeModal:  null,
  modalPayload: null,
  openModal:  (id, payload = null) => set({ activeModal: id, modalPayload: payload }),
  closeModal: ()                   => set({ activeModal: null, modalPayload: null }),

  // === SHIP SELECTION ===
  selectedShipId: null,
  selectShip:     (id) => set({ selectedShipId: id }),
  clearSelection: ()   => set({ selectedShipId: null }),

  // === CONTEXT MENU ===
  contextMenu:     null,
  showContextMenu: (x, y, shipId) => set({ contextMenu: { x, y, shipId } }),
  hideContextMenu: ()             => set({ contextMenu: null }),

  // === AUDIO ===
  audioEnabled: true,
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
}))
