import useGameStore from '../store/gameStore.js'
import { useShallow } from 'zustand/react/shallow'
import PhaseTimer from './PhaseTimer.js'

const PHASE_LABELS: Record<string, string> = {
  role_reveal: 'Role reveal',
  coding: 'Object-Oriented Programming', // will come from the snippet bank later
  discussion: 'Discussion',
  voting: 'Voting',
  result: 'Round result',
}

export default function GameTopBar() {
  const { round, totalRounds, phase } = useGameStore(
    useShallow(s => ({ round: s.round, totalRounds: s.totalRounds, phase: s.phase }))
  )
  const room = useGameStore(s => s.room)

  const aliveCount = room?.players.filter(p => p.isAlive).length ?? 0

  return (
    <div className="w-full flex items-center justify-between px-6 py-3 bg-[#e8e0d0] border-b-2 border-[#b0a090] font-mono">

      {/* Left: round badge + phase label */}
      <div className="flex items-center gap-3">
        <div className="bg-[#2a2a2a] text-[#f5f0e8] text-xs font-bold px-3 py-1.5 tracking-wider">
          Round {round}/{totalRounds}
        </div>
        <span className="text-[#6b6050] text-sm">
          {PHASE_LABELS[phase] ?? ''}
        </span>
      </div>

      {/* Center: timer */}
      <PhaseTimer />

      {/* Right: alive count */}
      <div className="flex items-center gap-1.5 text-[#2a2a2a] text-sm font-bold">
        <span>👤</span>
        <span>{aliveCount} alive</span>
      </div>

    </div>
  )
}