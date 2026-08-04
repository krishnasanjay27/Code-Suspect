import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore.js'
import { useShallow } from 'zustand/react/shallow'
import GameTopBar from '../components/GameTopBar.js'
import CodeEditor from '../components/CodeEditor.js'
import TestPanel from '../components/TestPanel.js'
import socket from '../socket/socket.js'
import ChatPanel from '../components/ChatPanel.js'  // placeholder for Phase 4

export default function Game() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const { room, player, phase } = useGameStore(
    useShallow(s => ({ room: s.room, player: s.player, phase: s.phase }))
  )

  // guard
  useEffect(() => {
    if (!room || !player) navigate('/')
  }, [room, player, navigate])

  // navigate away when game ends or returns to lobby
  useEffect(() => {
    if (phase === 'lobby') navigate('/')
    if (phase === 'result') navigate(`/room/${roomId}/result`)
    if (phase === 'role_reveal') navigate(`/room/${roomId}/role-reveal`)
    if (phase === 'discussion') navigate(`/room/${roomId}/discussion`)
    if (phase === 'voting') navigate(`/room/${roomId}/voting`)
  }, [phase, navigate, roomId])

  if (!room || !player || !roomId) return null

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] overflow-hidden">

      {/* Top bar — round badge, timer, alive count */}
      <GameTopBar />

      {/* Main game area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left panel — players + test cases */}
        <div className="w-48 flex-shrink-0 flex flex-col overflow-hidden">
          <TestPanel />
        </div>

        {/* Center — Monaco code editor */}
        <CodeEditor roomId={roomId} />

        {/* Right panel — chat */}
        <div className="w-56 flex-shrink-0 flex flex-col overflow-hidden">
          <ChatPanel roomId={roomId} />
        </div>

      </div>

      {/* Bottom — EMERGENCY button */}
      <div className="flex items-center justify-center py-3 bg-[#1e1e1e] border-t-2 border-[#2a2a2a]">
        <EmergencyButton roomId={roomId} />
      </div>

    </div>
  )
}

function EmergencyButton({ roomId }: { roomId: string }) {
  const phase = useGameStore(s => s.phase)

  function handleEmergency() {
    if (phase !== 'coding') return
    socket.emit('emergency', { roomId })
  }

  return (
    <button
      onClick={handleEmergency}
      disabled={phase !== 'coding'}
      className="
        flex items-center gap-2 px-8 py-2.5
        bg-red-700 hover:bg-red-600 disabled:opacity-40
        border-2 border-red-500 border-b-4 border-b-red-900
        active:border-b-2 active:translate-y-0.5
        text-white font-black text-sm tracking-widest uppercase
        font-mono transition-all
      "
    >
      ⚠ Emergency
    </button>
  )
}