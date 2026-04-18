export type PlayerColor = 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'teal'

export type GamePhase =
  | 'lobby'
  | 'role_reveal'
  | 'coding'
  | 'discussion'
  | 'voting'
  | 'result'

export type PlayerRole = 'saboteur' | 'debugger' | null

export interface Player {
  id: string
  nickname: string
  color: PlayerColor
  isHost: boolean
  isAlive: boolean
}

export interface Room {
  id: string
  hostId: string
  phase: GamePhase
  players: Player[]
}