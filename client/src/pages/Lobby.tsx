import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import socket from '../socket/socket.js'
import useGameStore from '../store/gameStore.js'
import type { Player, Room } from '../types/game.js'
import TextType from '../components/TextType.js';
type Mode = 'home' | 'create' | 'join'

interface JoinCreateResponse {
  success: boolean
  error?: string
  roomId?: string
  player?: Player
  room?: Room
}

// player color → tailwind bg class
const COLOR_MAP: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
  teal: 'bg-teal-500',
}

export default function Lobby() {
  const navigate = useNavigate()
  const { setPlayer, setRoom, setConnected } = useGameStore()

  const [mode, setMode] = useState<Mode>('home')
  const [nickname, setNickname] = useState('')
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // clear error when user starts typing
  useEffect(() => { setError('') }, [nickname, roomId])

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

  function validateNickname(): boolean {
    if (!nickname.trim()) { setError('Enter a nickname'); return false }
    if (nickname.trim().length < 2) { setError('Nickname must be at least 2 characters'); return false }
    return true
  }

  async function handleCreate() {
    if (!validateNickname()) return
    setLoading(true)
    await ensureConnected()

    socket.emit('create_room', { nickname: nickname.trim() }, (res: JoinCreateResponse) => {
      setLoading(false)
      if (!res.success || !res.player || !res.room || !res.roomId) {
        return setError(res.error ?? 'Failed to create room')
      }
      setPlayer(res.player)
      setRoom(res.room)
      navigate(`/room/${res.roomId}`)
    })
  }

  async function handleJoin() {
    if (!validateNickname()) return
    if (!roomId.trim()) return setError('Enter a Room ID')
    if (roomId.trim().length !== 6) return setError('Room ID must be 6 characters')
    setLoading(true)
    await ensureConnected()

    socket.emit('join_room', {
      roomId: roomId.trim().toUpperCase(),
      nickname: nickname.trim(),
    }, (res: JoinCreateResponse) => {
      setLoading(false)
      if (!res.success || !res.player || !res.room || !res.roomId) {
        return setError(res.error ?? 'Failed to join room')
      }
      setPlayer(res.player)
      setRoom(res.room)
      navigate(`/room/${res.roomId}`)
    })
  }

  return (
    <div className="min-h-screen bg-[#e8e0d0] flex flex-col items-center justify-center p-4 font-mono">

      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-[#2a2a2a] tracking-widest uppercase mb-1">
          Code Suspect
        </h1>

        <p className="text-[#6b6050] text-sm tracking-wide">
          <TextType
            text={[
              "Debug the code.",
              "Find the saboteur.",
              "Trust no one."
            ]}
            typingSpeed={75}
            pauseDuration={1500}
            deletingSpeed={50}
            showCursor
            cursorCharacter="_"
          />
        </p>
      </div>

    

      {/* Card */ }
  <div className="w-full max-w-sm bg-[#f5f0e8] border-2 border-[#b0a090] rounded-none shadow-[4px_4px_0px_#b0a090]">

    {/* Card header bar */}
    <div className="bg-[#2a2a2a] px-4 py-2 flex items-center gap-2">
      {/* <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" /> */}
      <span className="ml-2 text-[#888] text-xs tracking-widest uppercase">
        {mode === 'home' ? 'main menu' : mode === 'create' ? 'create room' : 'join room'}
      </span>
    </div>

    <div className="p-6">

      {/* HOME mode — two big buttons */}
      {mode === 'home' && (
        <div className="space-y-3">
          <p className="text-xs text-[#6b6050] uppercase tracking-widest mb-4 text-center">
            Choose an option
          </p>
          <button
            onClick={() => setMode('create')}
            className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#f5f0e8] font-bold py-3 px-4 text-sm tracking-widest uppercase transition-colors border-b-4 border-[#111] active:border-b-0 active:translate-y-1"
          >
            Create Room
          </button>
          <button
            onClick={() => setMode('join')}
            className="w-full bg-[#f5f0e8] hover:bg-[#ede8e0] text-[#2a2a2a] font-bold py-3 px-4 text-sm tracking-widest uppercase transition-colors border-2 border-[#2a2a2a] border-b-4 active:border-b-2 active:translate-y-0.5"
          >
            Join Room
          </button>
        </div>
      )}

      {/* CREATE mode */}
      {mode === 'create' && (
        <div className="space-y-4">
          <NicknameInput
            value={nickname}
            onChange={setNickname}
            onEnter={handleCreate}
          />
          {error && <ErrorMsg text={error} />}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:opacity-50 text-[#f5f0e8] font-bold py-3 text-sm tracking-widest uppercase transition-colors border-b-4 border-[#111] active:border-b-0 active:translate-y-1"
          >
            {loading ? 'Connecting...' : 'Create Room →'}
          </button>
          <BackButton onClick={() => { setMode('home'); setError('') }} />
        </div>
      )}

      {/* JOIN mode */}
      {mode === 'join' && (
        <div className="space-y-4">
          <NicknameInput
            value={nickname}
            onChange={setNickname}
            onEnter={handleJoin}
          />
          <div>
            <label className="block text-xs font-bold text-[#6b6050] uppercase tracking-widest mb-1.5">
              Room ID
            </label>
            <input
              className="w-full bg-[#2a2a2a] text-[#f5f0e8] border-2 border-[#444] px-3 py-2.5 text-lg font-bold tracking-[0.4em] uppercase text-center focus:outline-none focus:border-[#888] placeholder-[#555] rounded-none"
              placeholder="_ _ _ _ _ _"
              value={roomId}
              maxLength={6}
              onChange={e => setRoomId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              spellCheck={false}
            />
          </div>
          {error && <ErrorMsg text={error} />}
          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full bg-[#2a2a2a] hover:bg-[#3a3a3a] disabled:opacity-50 text-[#f5f0e8] font-bold py-3 text-sm tracking-widest uppercase transition-colors border-b-4 border-[#111] active:border-b-0 active:translate-y-1"
          >
            {loading ? 'Joining...' : 'Join Room →'}
          </button>
          <BackButton onClick={() => { setMode('home'); setError('') }} />
        </div>
      )}

    </div>
  </div>

  {/* Footer flavor text */ }
  <p className="mt-6 text-[#9a9080] text-xs tracking-wide text-center">
    2–6 players · One saboteur · Find them before time runs out
  </p>

    </div >
  )
}

// ─── Sub-components ──────────────────────────────────────────

function NicknameInput({
  value, onChange, onEnter
}: {
  value: string
  onChange: (v: string) => void
  onEnter: () => void
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-[#6b6050] uppercase tracking-widest mb-1.5">
        Nickname
      </label>
      <input
        className="w-full bg-[#2a2a2a] text-[#f5f0e8] border-2 border-[#444] px-3 py-2.5 text-sm font-bold tracking-wider focus:outline-none focus:border-[#888] placeholder-[#555] rounded-none"
        placeholder="Enter your nickname"
        value={value}
        maxLength={16}
        autoFocus
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter()}
        spellCheck={false}
      />
      <p className="text-[10px] text-[#9a9080] mt-1">{value.length}/16 characters</p>
    </div>
  )
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <div className="bg-red-900/20 border border-red-800 px-3 py-2">
      <p className="text-red-400 text-xs font-bold tracking-wide">
        ⚠ {text}
      </p>
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-[#6b6050] hover:text-[#2a2a2a] text-xs uppercase tracking-widest py-1 transition-colors"
    >
      ← Back
    </button>
  )
}