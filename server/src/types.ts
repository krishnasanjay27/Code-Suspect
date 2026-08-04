export type PlayerColor = 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'teal'
export type GamePhase = 'lobby' | 'role_reveal' | 'coding' | 'discussion' | 'voting' | 'result'
export type PlayerRole = 'saboteur' | 'debugger'

export interface Player {
  id: string
  nickname: string
  color: PlayerColor
  isHost: boolean
  isAlive: boolean
  joinedAt: number
  role?: PlayerRole   // optional — only set after game starts, never sent to clients
}

export interface TestCase {
  id: string
  name: string
  assertion: string
}

export interface Snippet {
  id: string
  title: string
  code: string
  testCases: TestCase[]
}

export interface Room {
  id: string
  hostId: string
  phase: GamePhase
  code: string
  round: number
  players: Map<string, Player>
  createdAt: number
  currentSnippet?: Snippet
}