import type { GamePhase } from './types.js'

// the ONLY place that defines what transitions are legal
const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  lobby:        ['role_reveal'],
  role_reveal:  ['coding'],
  coding:       ['discussion'],          // normal timeout OR emergency
  discussion:   ['voting'],
  voting:       ['result'],
  result:       ['coding', 'lobby'],     // next round, or game over
}

export function canTransition(from: GamePhase, to: GamePhase): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertTransition(from: GamePhase, to: GamePhase): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid phase transition: ${from} → ${to}`)
  }
}