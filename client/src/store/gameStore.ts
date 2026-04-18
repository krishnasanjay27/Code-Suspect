import { create } from 'zustand'
import type { Player, Room, PlayerRole } from '../types/game.js'

interface GameState {
  connected: boolean
  player: Player | null
  room: Room | null
  role: PlayerRole

  setConnected: (val: boolean) => void
  setPlayer: (player: Player) => void
  setRoom: (room: Room) => void
  setRole: (role: PlayerRole) => void
  reset: () => void
}

const useGameStore = create<GameState>((set) => ({
  connected: false,
  player: null,
  room: null,
  role: null,

  setConnected: (val) => set({ connected: val }),
  setPlayer: (player) => set({ player }),
  setRoom: (room) => set({ room }),
  setRole: (role) => set({ role }),
  reset: () => set({ connected: false, player: null, room: null, role: null }),
}))

export default useGameStore