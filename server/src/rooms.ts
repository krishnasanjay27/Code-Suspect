import { nanoid } from 'nanoid'
import type { Player, Room, PlayerRole, PlayerColor } from './types.js'

// Master rooms map — everything lives here
// roomId => {
//   id, code, hostId, phase, players: Map(socketId => playerObj), createdAt
// }

const rooms = new Map<string, Room>()

function generateRoomId(): string {
  // 6 uppercase chars — easy to share verbally: "join room XKCD42"
  return nanoid(6).toUpperCase()
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

export {
  createRoom,
  joinRoom,
  removePlayer,
  getRoom,
  getRoomBySocketId,
  serializeRoom,
  assignRoles
}