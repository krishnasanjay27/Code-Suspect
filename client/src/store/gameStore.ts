import { create } from 'zustand'
import type { Player, Room, PlayerRole, GamePhase } from '../types/game.js'

interface GameState {
  // ─── Connection ──────────────────────────────
  connected: boolean

  // ─── This player ─────────────────────────────
  player: Player | null
  role: PlayerRole

  // ─── Room ────────────────────────────────────
  room: Room | null

  // ─── Game ────────────────────────────────────
  phase: GamePhase
  timer: number          // seconds remaining
  round: number          // current round (1–4)
  totalRounds: number    // always 4
  code: string           // current shared code
  changeLog: ChangeEntry[]

  // ─── Actions ─────────────────────────────────
  setConnected: (val: boolean) => void
  setPlayer: (player: Player) => void
  setRole: (role: PlayerRole) => void
  setRoom: (roomOrUpdater: Room | ((prev: Room | null) => Room | null)) => void
  setPhase: (phase: GamePhase) => void
  setTimer: (seconds: number) => void
  setRound: (round: number) => void
  setCode: (code: string) => void
  addChangeEntry: (entry: ChangeEntry) => void
  reset: () => void
}

export interface ChangeEntry {
  playerId: string
  nickname: string
  color: string
  line: number
  timestamp: number
  preview: string   // short snippet of what changed
}

const initialState = {
  connected: false,
  player: null,
  role: null,
  room: null,
  phase: 'lobby' as GamePhase,
  timer: 0,
  round: 1,
  totalRounds: 4,
  code: '',
  changeLog: [],
}

const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setConnected: (val) => set({ connected: val }),
  setPlayer:    (player) => set({ player }),
  setRole:      (role) => set({ role }),

  setRoom: (roomOrUpdater) =>
    set((state) => ({
      room: typeof roomOrUpdater === 'function'
        ? roomOrUpdater(state.room)
        : roomOrUpdater,
    })),

  setPhase: (phase) => set({ phase }),
  setTimer: (timer) => set({ timer }),
  setRound: (round) => set({ round }),
  setCode:  (code)  => set({ code }),

  addChangeEntry: (entry) =>
    set((state) => ({
      changeLog: [...state.changeLog, entry].slice(-50) // keep last 50
    })),

  reset: () => set(initialState),
}))

export default useGameStore