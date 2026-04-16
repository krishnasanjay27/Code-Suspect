import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

type Room = {
  id: string
  hostId: string
  phase: 'lobby' | 'playing' | 'finished'
  players: Player[]
}

type ServerResponse = {
  success: boolean
  error?: string
  player?: Player
  room?: Room
  roomId?: string
}

export default function Lobby() {
  const navigate = useNavigate()

  const setPlayer = useGameStore((state) => state.setPlayer)
  const setRoom = useGameStore((state) => state.setRoom)
  const setConnected = useGameStore((state) => state.setConnected)

  const [nickname, setNickname] = useState<string>('')
  const [roomId, setRoomId] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  function ensureConnected(): Promise<void> {
    return new Promise((resolve) => {
      if (socket.connected) return resolve()

      socket.connect()

      socket.once('connect', () => {
        setConnected(true)
        resolve()
      })
    })
  }

  async function handleCreate(): Promise<void> {
    if (!nickname.trim()) {
      return setError('Enter a nickname first')
    }

    setLoading(true)
    setError('')

    await ensureConnected()

    socket.emit(
      'create_room',
      { nickname: nickname.trim() },
      (res: ServerResponse) => {
        setLoading(false)

        if (!res.success || !res.player || !res.room || !res.roomId) {
          return setError(res.error ?? 'Failed to create room')
        }

        setPlayer(res.player)
        setRoom(res.room)

        navigate(`/room/${res.roomId}`)
      }
    )
  }

  async function handleJoin(): Promise<void> {
    if (!nickname.trim()) {
      return setError('Enter a nickname first')
    }

    if (!roomId.trim()) {
      return setError('Enter a Room ID')
    }

    setLoading(true)
    setError('')

    await ensureConnected()

    socket.emit(
      'join_room',
      {
        roomId: roomId.trim().toUpperCase(),
        nickname: nickname.trim()
      },
      (res: ServerResponse) => {
        setLoading(false)

        if (!res.success || !res.player || !res.room || !res.roomId) {
          return setError(res.error ?? 'Failed to join room')
        }

        setPlayer(res.player)
        setRoom(res.room)

        navigate(`/room/${res.roomId}`)
      }
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Code Suspect
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Debug the code. Find the saboteur.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Nickname
            </label>

            <input
              className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
              placeholder="Enter your nickname"
              value={nickname}
              maxLength={16}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && handleCreate()
              }
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? 'Connecting...' : 'Create Room'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-xs text-gray-600">
              or join existing
            </span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Room ID
            </label>

            <input
              className="mt-1.5 w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500 transition-colors font-mono tracking-widest uppercase"
              placeholder="ABC123"
              value={roomId}
              maxLength={6}
              onChange={(e) =>
                setRoomId(e.target.value.toUpperCase())
              }
              onKeyDown={(e) =>
                e.key === 'Enter' && handleJoin()
              }
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full border border-gray-700 hover:border-gray-500 disabled:opacity-50 text-gray-300 hover:text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            Join Room
          </button>

          {error && (
            <p className="text-red-400 text-xs text-center pt-1">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}