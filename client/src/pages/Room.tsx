import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import socket from '../socket/socket.js'
import useGameStore from '../store/gameStore.js'
import type { Room } from '../types/game.js'

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { room, player, setRoom } = useGameStore()

  useEffect(() => {
    if (!room || !player) {
      navigate('/')
      return
    }

    socket.on('player_joined', ({ room: r }: { room: Room }) => setRoom(r))
    socket.on('player_left',   ({ room: r }: { room: Room }) => setRoom(r))

    return () => {
      socket.off('player_joined')
      socket.off('player_left')
    }
  }, [])

  if (!room || !player) return null

  return (
    <div className="min-h-screen bg-[#e8e0d0] flex items-center justify-center font-mono">
      <div className="text-center">
        <p className="text-[#6b6050] text-xs uppercase tracking-widest mb-1">Room</p>
        <h1 className="text-4xl font-bold text-[#2a2a2a] tracking-widest mb-6">{roomId}</h1>
        <p className="text-[#9a9080] text-sm">
          Waiting room coming next...
        </p>
        <div className="mt-4 space-y-1">
          {room.players.map(p => (
            <p key={p.id} className="text-sm text-[#2a2a2a]">
              {p.nickname} {p.isHost ? '(host)' : ''} {p.id === player.id ? '← you' : ''}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}