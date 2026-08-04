import { customAlphabet } from 'nanoid'
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6)
import type { Player, Room, PlayerRole, PlayerColor } from './types.js'
import { canTransition } from './stateMachine.js'
import type { GamePhase, Snippet } from './types.js'

export const DEFAULT_SNIPPET: Snippet = {
  id: 'snip-1',
  title: 'Two Sum',
  code: `def two_sum(nums, target):
    # TODO: Implement two sum
    pass
`,
  testCases: [
    { id: 't1', name: 'Base case', assertion: 'two_sum([2, 7, 11, 15], 9) == [0, 1]' },
    { id: 't2', name: 'Negative numbers', assertion: 'two_sum([-1, -2, -3, -4, -5], -8) == [2, 4]' },
    { id: 't3', name: 'Zeroes', assertion: 'two_sum([0, 4, 3, 0], 0) == [0, 3]' }
  ]
}
// Master rooms map — everything lives here
// roomId => {
//   id, code, hostId, phase, players: Map(socketId => playerObj), createdAt
// }
const PHASE_DURATIONS: Record<GamePhase, number | null> = {
  lobby: null,
  role_reveal: 4,
  coding: 90,
  discussion: 45,
  voting: 20,
  result: 6,
}

const rooms = new Map<string, Room>()

function generateRoomId(): string {
  // 6 uppercase alphanumeric chars — easy to share verbally: "join room XKCD42"
  return nanoid()
}

function createRoom(hostSocket: any, nickname: string) {
  const roomId = generateRoomId()

  const player: Player = {
    id: hostSocket.id,
    nickname,
    color: assignColor(0),
    isHost: true,
    isAlive: true,
    joinedAt: Date.now()
  }

  rooms.set(roomId, {
    id: roomId,
    hostId: hostSocket.id,
    phase: 'lobby',
    code: '',
    round: 1,
    players: new Map([[hostSocket.id, player]]),
    createdAt: Date.now()
  })

  return { roomId, player }
}

function joinRoom(roomId: string, socket: any, nickname: string) {
  const room = rooms.get(roomId)

  if (!room) {
    return { error: 'Room not found' }
  }

  if (room.phase !== 'lobby') {
    return { error: 'Game already in progress' }
  }

  if (room.players.size >= 6) {
    return { error: 'Room is full (max 6 players)' }
  }

  if ([...room.players.values()].some(p => p.nickname === nickname)) {
    return { error: 'Nickname already taken in this room' }
  }

  const player: Player = {
    id: socket.id,
    nickname,
    color: assignColor(room.players.size),
    isHost: false,
    isAlive: true,
    joinedAt: Date.now()
  }

  room.players.set(socket.id, player)

  return { player }
}

function removePlayer(socketId: string) {
  for (const [roomId, room] of rooms.entries()) {
    if (!room.players.has(socketId)) continue

    room.players.delete(socketId)

    if (room.players.size === 0) {
      rooms.delete(roomId)
      clearRoomTimer(roomId)
      return { roomId, room: null, newHost: null }
    }

    let newHost: Player | null = null

    if (room.hostId === socketId) {
      const nextPlayer = room.players.values().next().value
      if (nextPlayer) {
        nextPlayer.isHost = true
        room.hostId = nextPlayer.id
        newHost = nextPlayer
      }
    }

    return { roomId, room, newHost }
  }

  return null
}

function getRoom(roomId: string) {
  return rooms.get(roomId) ?? null
}

function getRoomBySocketId(socketId: string) {
  for (const room of rooms.values()) {
    if (room.players.has(socketId)) return room
  }

  return null
}

// serialize for sending over the wire — Map → Array
function serializeRoom(room: Room) {
  return {
    id: room.id,
    hostId: room.hostId,
    phase: room.phase,
    round: room.round,
    players: [...room.players.values()].map(p => ({
      id: p.id,
      nickname: p.nickname,
      color: p.color,
      isHost: p.isHost,
      isAlive: p.isAlive,
      // role is intentionally omitted here
    }))
  }
}

// Red, Blue, Green, Orange, Purple, Teal — matches the screenshot palette
const COLORS: PlayerColor[] = ['red', 'blue', 'green', 'orange', 'purple', 'teal']

function assignColor(index: number): PlayerColor {
  return COLORS[index % COLORS.length]
}

function assignRoles(roomId: string): Map<string, PlayerRole> | null {
  const room = rooms.get(roomId)
  if (!room) return null

  const playerIds = [...room.players.keys()]

  // pick one random index — this is the saboteur
  const saboteurIndex = Math.floor(Math.random() * playerIds.length)

  const assignments = new Map<string, PlayerRole>()

  playerIds.forEach((id, index) => {
    const role: PlayerRole = index === saboteurIndex ? 'saboteur' : 'debugger'
    assignments.set(id, role)

    // store role on the player object server-side
    // we NEVER send this to other players — only used for validation
    const player = room.players.get(id)!
    player.role = role
  })

  return assignments
}
const activeTimers = new Map<string, NodeJS.Timeout>()

function transitionPhase(
  roomId: string,
  to: GamePhase,
  io: import('socket.io').Server
): boolean {
  const room = rooms.get(roomId)
  if (!room) return false

  if (!canTransition(room.phase, to)) {
    console.warn(`Blocked invalid transition: ${room.phase} → ${to} in room ${roomId}`)
    return false
  }

  // clear any leftover timer from the previous phase
  clearRoomTimer(roomId)

  room.phase = to

  // Set the snippet if transitioning to coding phase
  if (to === 'coding') {
    room.currentSnippet = DEFAULT_SNIPPET
    room.code = DEFAULT_SNIPPET.code
  }

  // broadcast the new phase to everyone, with the duration so clients can render a countdown
  const duration = PHASE_DURATIONS[to]
  io.to(roomId).emit('phase_changed', {
    phase: to,
    round: room.round,
    duration,
    snippet: room.currentSnippet
  })

  // if this phase has an automatic timeout, schedule the next transition
  if (duration !== null) {
    scheduleAutoAdvance(roomId, to, duration, io)
  }

  return true
}

// in scheduleAutoAdvance, server/src/rooms.ts — emit immediately before the interval starts
function scheduleAutoAdvance(
  roomId: string,
  currentPhase: GamePhase,
  seconds: number,
  io: import('socket.io').Server
) {
  let remaining = seconds

  // emit the starting value right away
  io.to(roomId).emit('timer_tick', { seconds: remaining })

  const interval = setInterval(() => {
    remaining -= 1
    io.to(roomId).emit('timer_tick', { seconds: remaining })

    if (remaining <= 0) {
      clearInterval(interval)
      activeTimers.delete(roomId)
      advanceFromPhase(roomId, currentPhase, io)
    }
  }, 1000)

  activeTimers.set(roomId, interval)
}

// decides where to go NEXT based on the current phase + game state
function advanceFromPhase(
  roomId: string,
  currentPhase: GamePhase,
  io: import('socket.io').Server
) {
  const room = rooms.get(roomId)
  if (!room) return

  // Guard: make sure we are still in the phase that scheduled this timer
  if (room.phase !== currentPhase) return

  switch (currentPhase) {
    case 'role_reveal':
      transitionPhase(roomId, 'coding', io)
      break
    case 'coding':
      transitionPhase(roomId, 'discussion', io)
      break
    case 'discussion':
      transitionPhase(roomId, 'voting', io)
      break
    case 'voting':
      transitionPhase(roomId, 'result', io)
      break
    case 'result':
      if (room.round < 4) {
        room.round += 1
        transitionPhase(roomId, 'coding', io)
      } else {
        transitionPhase(roomId, 'lobby', io)
      }
      break
  }
}

function clearRoomTimer(roomId: string) {
  const timer = activeTimers.get(roomId)
  if (timer) {
    clearInterval(timer)
    activeTimers.delete(roomId)
  }
}

// called by the EMERGENCY button — force-skip coding straight to discussion
function triggerEmergency(
  roomId: string,
  io: import('socket.io').Server
): boolean {
  const room = rooms.get(roomId)
  if (!room || room.phase !== 'coding') return false

  return transitionPhase(roomId, 'discussion', io)
}
// in scheduleAutoAdvance, server/src/rooms.ts — emit immediately before the interval starts

export {
  createRoom,
  joinRoom,
  removePlayer,
  getRoom,
  getRoomBySocketId,
  serializeRoom,
  assignRoles,
  transitionPhase,
  clearRoomTimer,
  triggerEmergency
}