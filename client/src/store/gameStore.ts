import { create } from 'zustand'

type Player = {
  id: string
  nickname: string
  color: string
  isHost: boolean
  isAlive: boolean
  joinedAt: number
}

type Room = {
  id: string
  hostId: string
  phase: 'lobby' | 'playing' | 'finished'
  players: Player[]
}

type GameStore = {
  connected: boolean
  setConnected: (val: boolean) => void

  player: Player | null
  setPlayer: (player: Player | null) => void

  room: Room | null
  setRoom: (room: Room | null) => void

  updateRoom: (updatedRoom: Room) => void

  reset: () => void
}

const useGameStore = create<GameStore>((set) => ({
  // connection
  connected: false,
  setConnected: (val) => set({ connected: val }),

  // this player
  player: null,
  setPlayer: (player) => set({ player }),

  // room
  room: null,
  setRoom: (room) => set({ room }),

  // update just the player list inside room (common operation)
  updateRoom: (updatedRoom) => set({ room: updatedRoom }),

  // clear everything (on leave / game over)
  reset: () =>
    set({
      connected: false,
      player: null,
      room: null
    })
}))

export default useGameStore