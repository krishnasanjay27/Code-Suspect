import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import socket from '../socket/socket'
import useGameStore from '../store/gameStore'

type Player = {
  id: string
  nickname: string
  color: string
  isHost: boolean
  isAlive: boolean
  joinedAt: number
}

type RoomType = {
  id: string
  hostId: string
  phase: 'lobby' | 'playing' | 'finished'
  players: Player[]
}

type RoomUpdatePayload = {
  room: RoomType
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const room = useGameStore((state) => state.room)
  const player = useGameStore((state) => state.player)
  const setRoom = useGameStore((state) => state.setRoom)

  useEffect(() => {
    // if room state missing (e.g. refresh)
    if (!room || !player) {
      navigate('/')
      return
    }

    const handlePlayerJoined = ({ room }: RoomUpdatePayload) => {
      setRoom(room)
    }

    const handlePlayerLeft = ({ room }: RoomUpdatePayload) => {
      setRoom(room)
    }

    socket.on('player_joined', handlePlayerJoined)
    socket.on('player_left', handlePlayerLeft)

    return () => {
      socket.off('player_joined', handlePlayerJoined)
      socket.off('player_left', handlePlayerLeft)
    }
  }, [room, player, navigate, setRoom])

  if (!room || !player) return null

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <p className="text-gray-500 text-sm mb-1">Room</p>

      <h1 className="text-2xl font-bold mb-6 font-mono tracking-widest">
        {roomId}
      </h1>

      <p className="text-gray-400 text-sm mb-4">
        Players in room:
      </p>

      <ul className="space-y-2">
        {room.players.map((p) => (
          <li key={p.id} className="flex items-center gap-3">

            {/* Tailwind-safe color mapping */}
            <span
              className={`w-3 h-3 rounded-full ${getColorClass(p.color)}`}
            />

            <span className="text-sm">{p.nickname}</span>

            {p.isHost && (
              <span className="text-xs text-yellow-500">
                host
              </span>
            )}

            {p.id === player.id && (
              <span className="text-xs text-gray-600">
                (you)
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

/*
Tailwind cannot detect dynamic classes like:
bg-${p.color}-500

So we map them manually
*/

function getColorClass(color: string) {
  const map: Record<string, string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
    teal: 'bg-teal-500'
  }

  return map[color] ?? 'bg-gray-500'
}