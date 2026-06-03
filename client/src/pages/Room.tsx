import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import socket from '../socket/socket.js'
import useGameStore from '../store/gameStore.js'
import type { Room, Player } from '../types/game.js'

// maps the color string from server → Tailwind bg class
const COLOR_CLASS: Record<string, string> = {
  red:    'bg-red-500',
  blue:   'bg-blue-500',
  green:  'bg-green-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  teal:   'bg-teal-500',
}

// text color for the player name label
const TEXT_CLASS: Record<string, string> = {
  red:    'text-red-600',
  blue:   'text-blue-600',
  green:  'text-green-600',
  orange: 'text-orange-600',
  purple: 'text-purple-600',
  teal:   'text-teal-600',
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { room, player, setRoom } = useGameStore()
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)

  const isHost = room?.hostId === player?.id
  const canStart = (room?.players.length ?? 0) >= 2

  useEffect(() => {
    // guard: if state is missing (e.g. page refresh) go back to lobby
    if (!room || !player) {
      navigate('/')
      return
    }

    socket.on('player_joined', ({ room: r }: { room: Room }) => {
      setRoom(r)
    })

    socket.on('player_left', ({ room: r }: { room: Room }) => {
      setRoom(r)
    })

    socket.on('host_changed', ({ newHost }: { newHost: Player }) => {
      // update room so the new host sees the Start button
      setRoom(prev => prev ? { ...prev, hostId: newHost.id } : prev)
    })

    socket.on('game_started', ({ room: r }: { room: Room }) => {
      setRoom(r)
      navigate(`/room/${roomId}/game`)
    })

    return () => {
      socket.off('player_joined')
      socket.off('player_left')
      socket.off('host_changed')
      socket.off('game_started')
    }
  }, [])

  function handleCopyRoomId() {
    if (!roomId) return
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleStartGame() {
    if (!roomId || !canStart) return
    setStarting(true)
    socket.emit('start_game', { roomId })
  }

  if (!room || !player) return null

  return (
    <div className="min-h-screen bg-[#e8e0d0] flex flex-col items-center justify-center p-4 font-mono">

      {/* Page title */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-[#2a2a2a] tracking-widest uppercase">
          Code Suspect
        </h1>
        <p className="text-[#6b6050] text-xs tracking-widest mt-1 uppercase">
          Waiting for players
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">

        {/* Room ID card */}
        <div className="bg-[#f5f0e8] border-2 border-[#b0a090] shadow-[3px_3px_0_#b0a090]">
          <div className="bg-[#2a2a2a] px-4 py-1.5">
            <span className="text-[#888] text-[10px] tracking-widest uppercase">
              Room ID — share this with friends
            </span>
          </div>
          <div className="px-4 py-4 flex items-center justify-between gap-4">
            <span className="text-4xl font-black text-[#2a2a2a] tracking-[0.3em]">
              {roomId}
            </span>
            <button
              onClick={handleCopyRoomId}
              className="text-[10px] font-bold uppercase tracking-widest border-2 border-[#2a2a2a] px-3 py-2 hover:bg-[#2a2a2a] hover:text-[#f5f0e8] transition-colors whitespace-nowrap"
            >
              {copied ? '✓ Copied!' : 'Copy ID'}
            </button>
          </div>
        </div>

        {/* Players card */}
        <div className="bg-[#f5f0e8] border-2 border-[#b0a090] shadow-[3px_3px_0_#b0a090]">
          <div className="bg-[#2a2a2a] px-4 py-1.5 flex justify-between items-center">
            <span className="text-[#888] text-[10px] tracking-widest uppercase">
              Players
            </span>
            <span className="text-[#888] text-[10px] tracking-widest">
              {room.players.length} / 6
            </span>
          </div>

          <div className="divide-y divide-[#d5cfc5]">
            {room.players.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                isYou={p.id === player.id}
                isHost={p.id === room.hostId}
              />
            ))}

            {/* empty slots */}
            {Array.from({ length: Math.max(0, 2 - room.players.length) }).map((_, i) => (
              <EmptySlot key={i} />
            ))}
          </div>
        </div>

        {/* Status / action area */}
        <div className="bg-[#f5f0e8] border-2 border-[#b0a090] shadow-[3px_3px_0_#b0a090] px-4 py-4">
          {isHost ? (
            <div className="space-y-3">
              {!canStart && (
                <p className="text-[10px] text-[#6b6050] uppercase tracking-widest text-center">
                  Need at least 2 players to start
                </p>
              )}
              <button
                onClick={handleStartGame}
                disabled={!canStart || starting}
                className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:opacity-40 disabled:cursor-not-allowed text-[#f5f0e8] font-black py-3.5 text-sm tracking-widest uppercase transition-colors border-b-4 border-[#111] active:border-b-0 active:translate-y-1"
              >
                {starting ? 'Starting...' : '▶  Start Game'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 py-1">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-[#b0a090] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <span className="text-[#6b6050] text-xs uppercase tracking-widest">
                Waiting for host to start
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Flavor footer */}
      <p className="mt-6 text-[#9a9080] text-[10px] tracking-wide text-center uppercase">
        One among you is the saboteur
      </p>

    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────

function PlayerRow({
  player, isYou, isHost
}: {
  player: Player
  isYou: boolean
  isHost: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {/* colored dot */}
      <div className={`w-4 h-4 rounded-full flex-shrink-0 ${COLOR_CLASS[player.color] ?? 'bg-gray-400'}`} />

      {/* nickname */}
      <span className={`flex-1 text-sm font-bold tracking-wide ${TEXT_CLASS[player.color] ?? 'text-gray-700'}`}>
        {player.nickname}
      </span>

      {/* badges */}
      <div className="flex items-center gap-2">
        {isHost && (
          <span className="text-[10px] font-bold bg-[#2a2a2a] text-[#f5f0e8] px-2 py-0.5 tracking-widest uppercase">
            Host
          </span>
        )}
        {isYou && (
          <span className="text-[10px] text-[#9a9080] tracking-widest uppercase">
            You
          </span>
        )}
      </div>
    </div>
  )
}

function EmptySlot() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 opacity-30">
      <div className="w-4 h-4 rounded-full border-2 border-dashed border-[#b0a090]" />
      <span className="text-xs text-[#6b6050] tracking-widest uppercase">
        Waiting for player...
      </span>
    </div>
  )
}