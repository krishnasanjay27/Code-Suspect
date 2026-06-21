import useGameStore from '../store/gameStore.js'

// matches the screenshot: top-center pill showing "38s"
export default function PhaseTimer() {
  const timer = useGameStore(s => s.timer)
  const phase = useGameStore(s => s.phase)

  // no visible timer during lobby or result phases
  if (phase === 'lobby' || phase === 'result') return null

  const isUrgent = timer <= 10 && timer > 0

  return (
    <div
      className={`
        inline-flex items-center justify-center
        px-5 py-2 border-2 font-mono font-black text-lg
        transition-colors duration-300
        ${isUrgent
          ? 'bg-red-950 border-red-600 text-red-400 animate-pulse'
          : 'bg-[#f5f0e8] border-[#2a2a2a] text-[#2a2a2a]'
        }
      `}
    >
      {timer}s
    </div>
  )
}