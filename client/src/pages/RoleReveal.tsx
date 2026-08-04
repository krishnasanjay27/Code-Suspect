import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore.js'

const REVEAL_DURATION = 4000 // ms before auto-navigate

export default function RoleReveal() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const role = useGameStore(s => s.role)
  const player = useGameStore(s => s.player)
  const phase = useGameStore(s => s.phase)

  const [countdown, setCountdown] = useState(3)
  const [visible, setVisible] = useState(false)

  const isSaboteur = role === 'saboteur'

  // guard
  useEffect(() => {
    if (!role || !player) {
      navigate('/')
    }
  }, [])

  // entrance animation — slight delay so CSS transition fires
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  // countdown ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // navigate when server transitions to coding phase
  useEffect(() => {
    if (phase === 'coding') {
      navigate(`/room/${roomId}/game`)
    }
  }, [phase, navigate, roomId])

  if (!role || !player) return null

  return (
    <div
      className={`
        min-h-screen flex flex-col items-center justify-center
        font-mono transition-all duration-700 p-6
        ${isSaboteur
          ? 'bg-[#1a0a0a]'
          : 'bg-[#0a0a1a]'
        }
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >

      {/* Scanline overlay for retro feel */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)',
          zIndex: 1,
        }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">

        {/* Top label */}
        <p
          className={`
            text-xs tracking-[0.4em] uppercase font-bold
            ${isSaboteur ? 'text-red-600' : 'text-blue-600'}
          `}
        >
          Your role has been assigned
        </p>

        {/* Main card */}
        <div
          className={`
            w-full border-2 shadow-lg
            transition-transform duration-500
            ${visible ? 'translate-y-0' : 'translate-y-8'}
            ${isSaboteur
              ? 'bg-[#2a0a0a] border-red-800 shadow-red-900/50'
              : 'bg-[#0a0a2a] border-blue-800 shadow-blue-900/50'
            }
          `}
        >
          {/* Card titlebar */}
          <div
            className={`px-4 py-2 flex items-center gap-2 border-b
              ${isSaboteur ? 'bg-red-950 border-red-800' : 'bg-blue-950 border-blue-800'}
            `}
          >
            <div className={`w-2 h-2 rounded-full ${isSaboteur ? 'bg-red-500' : 'bg-blue-500'}`} />
            <span className={`text-[10px] tracking-[0.3em] uppercase font-bold
              ${isSaboteur ? 'text-red-400' : 'text-blue-400'}
            `}>
              {isSaboteur ? 'classified' : 'assignment'}
            </span>
          </div>

          <div className="px-6 py-8 flex flex-col items-center gap-6">

            {/* Role icon */}
            <div
              className={`
                w-24 h-24 flex items-center justify-center text-5xl
                border-2 rounded-none
                ${isSaboteur
                  ? 'border-red-700 bg-red-950/50'
                  : 'border-blue-700 bg-blue-950/50'
                }
              `}
            >
              {isSaboteur ? '🐛' : '🔍'}
            </div>

            {/* Role name */}
            <div className="text-center">
              <p className={`
                text-4xl font-black tracking-widest uppercase mb-2
                ${isSaboteur ? 'text-red-400' : 'text-blue-400'}
              `}>
                {isSaboteur ? 'Saboteur' : 'Debugger'}
              </p>
              <p className="text-[#888] text-xs tracking-wider">
                {player.nickname}
              </p>
            </div>

            {/* Objective */}
            <div
              className={`
                w-full border px-4 py-3 text-center
                ${isSaboteur
                  ? 'border-red-900 bg-red-950/30'
                  : 'border-blue-900 bg-blue-950/30'
                }
              `}
            >
              <p className={`text-xs leading-relaxed tracking-wide
                ${isSaboteur ? 'text-red-300' : 'text-blue-300'}
              `}>
                {isSaboteur
                  ? 'Introduce bugs into the shared code without being detected. Vote against others to avoid elimination.'
                  : 'Find and fix the bugs. Identify the Saboteur among your team before time runs out.'
                }
              </p>
            </div>

          </div>
        </div>

        {/* Countdown */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-[#555] text-[10px] tracking-[0.3em] uppercase">
            Game begins in
          </p>
          <div className="flex items-center gap-3">
            {[3, 2, 1].map(n => (
              <div
                key={n}
                className={`
                  w-10 h-10 flex items-center justify-center
                  border font-black text-lg transition-all duration-300
                  ${countdown >= n
                    ? isSaboteur
                      ? 'border-red-700 text-red-400 bg-red-950/50'
                      : 'border-blue-700 text-blue-400 bg-blue-950/50'
                    : 'border-[#333] text-[#444] bg-transparent'
                  }
                `}
              >
                {n}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}