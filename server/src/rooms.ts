import { nanoid } from 'nanoid'

// Master rooms map — everything lives here
// roomId => {
//   id, code, hostId, phase, players: Map(socketId => playerObj), createdAt
// }

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
  code: string
  players: Map<string, Player>
  createdAt: number
}

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
    players: [...room.players.values()]
  }
}

// Red, Blue, Green, Orange, Purple, Teal — matches the screenshot palette
const COLORS = ['red', 'blue', 'green', 'orange', 'purple', 'teal']

function assignColor(index: number) {
  return COLORS[index % COLORS.length]
}

export {
  createRoom,
  joinRoom,
  removePlayer,
  getRoom,
  getRoomBySocketId,
  serializeRoom
}