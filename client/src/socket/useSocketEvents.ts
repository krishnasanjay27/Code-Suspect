import { useEffect } from 'react'
import socket from './socket.js'
import useGameStore from '../store/gameStore.js'
import type { Room, Player, PlayerRole, GamePhase } from '../types/game.js'
import type { ChangeEntry } from '../store/gameStore.js'

export function useSocketEvents() {
  const {
    setConnected, setRoom, setPhase,
    setTimer, setRole, setRound, setCode,
    addChangeEntry, setPendingNavigation
  } = useGameStore()

  useEffect(() => {
    // ─── Connection ──────────────────────────────────────────
    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    // ─── Room events ─────────────────────────────────────────
    socket.on('player_joined', ({ room }: { room: Room }) => {
      setRoom(room)
    })

    socket.on('player_left', ({ room }: { room: Room }) => {
      setRoom(room)
    })

    socket.on('host_changed', ({ newHost }: { newHost: Player }) => {
      setRoom(prev => prev ? { ...prev, hostId: newHost.id } : prev)
    })

    // ─── Game events ─────────────────────────────────────────
    socket.on('game_started', ({ room }: { room: Room }) => {
      setRoom(room)
      setPhase('role_reveal')
      setPendingNavigation(`/room/${room.id}/role-reveal`)
    })

    socket.on('role_assigned', ({ role }: { role: PlayerRole }) => {
      setRole(role)
    })

    socket.on('phase_changed', ({ phase, round, duration, snippet }: {
      phase: GamePhase
      round: number
      duration: number | null
      snippet?: { topic: string; code: string }
    }) => {
      setPhase(phase)
      setRound(round)
      setTimer(duration ?? 0)
      if (snippet) {
        setCode(snippet.code)
      }
    })

    socket.on('timer_tick', ({ seconds }: { seconds: number }) => {
      setTimer(seconds)
    })

    // ─── Code events ─────────────────────────────────────────
    socket.on('code_updated', ({ code }: { code: string }) => {
      setCode(code)
    })

    socket.on('code_changed', ({ entry }: { entry: ChangeEntry }) => {
      addChangeEntry(entry)
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('player_joined')
      socket.off('player_left')
      socket.off('host_changed')
      socket.off('game_started')
      socket.off('role_assigned')
      socket.off('phase_changed')
      socket.off('timer_tick')
      socket.off('code_updated')
      socket.off('code_changed')
    }
  }, [])
}