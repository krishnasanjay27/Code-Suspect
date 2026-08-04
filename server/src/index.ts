import http from 'http'
import { Server, Socket } from 'socket.io'
import app from './app.js'
import {
  createRoom,
  joinRoom,
  removePlayer,
  getRoom,
  serializeRoom,
  assignRoles,
  transitionPhase,
  triggerEmergency
} from './rooms.js'
import { runTests } from './evaluator.js'

const PORT = process.env.PORT || 3001

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
  }
})

// debounce map — one timer per room to avoid running tests on every keystroke
const evalTimers = new Map<string, NodeJS.Timeout>()

io.on('connection', (socket: Socket) => {
  console.log(`Socket connected: ${socket.id}`)

  // ─── CREATE ROOM ───────────────────────────────────────────
  socket.on(
    'create_room',
    (
      { nickname }: { nickname: string },
      callback: Function
    ) => {
      const { roomId, player } = createRoom(socket, nickname)

      socket.join(roomId)

      console.log(`Room ${roomId} created by ${nickname}`)

      callback({
        success: true,
        roomId,
        player,
        room: serializeRoom(getRoom(roomId)!)
      })
    }
  )

  // ─── JOIN ROOM ─────────────────────────────────────────────
  socket.on(
    'join_room',
    (
      { roomId, nickname }: { roomId: string; nickname: string },
      callback: Function
    ) => {
      const result = joinRoom(roomId, socket, nickname)

      if ('error' in result) {
        return callback({
          success: false,
          error: result.error
        })
      }

      socket.join(roomId)

      console.log(`${nickname} joined room ${roomId}`)

      callback({
        success: true,
        roomId,
        player: result.player,
        room: serializeRoom(getRoom(roomId)!)
      })

      socket.to(roomId).emit('player_joined', {
        player: result.player,
        room: serializeRoom(getRoom(roomId)!)
      })
    }
  )

  // Start GAME
  socket.on('start_game', ({ roomId }) => {
    const room = getRoom(roomId)
    if (!room) return
    if (room.hostId !== socket.id) return
    if (room.players.size < 2) return

    const roleAssignments = assignRoles(roomId)
    if (!roleAssignments) return

    roleAssignments.forEach((role, socketId) => {
      io.to(socketId).emit('role_assigned', { role })
    })

    io.to(roomId).emit('game_started', { room: serializeRoom(room) })

    // hand off to the state machine — it owns everything from here
    transitionPhase(roomId, 'role_reveal', io)
  })

  socket.on('emergency', ({ roomId }) => {
    triggerEmergency(roomId, io)
  })

  // ─── DISCONNECTING ─────────────────────────────────────────
  socket.on('disconnecting', () => {
    const result = removePlayer(socket.id)

    if (!result) return

    const { roomId, room } = result

    if (!room) {
      console.log(`Room ${roomId} deleted — no players left`)
      return
    }

    io.to(roomId).emit('player_left', {
      socketId: socket.id,
      room: serializeRoom(room)
    })

    if (result.newHost) {
      io.to(roomId).emit('host_changed', {
        newHost: result.newHost
      })

      console.log(
        `Host transferred to ${result.newHost.nickname}`
      )
    }
  })

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)
  })

  socket.on('code_change', async ({
  roomId,
  code,
}: {
  roomId: string
  code: string
}) => {
  const room = getRoom(roomId)
  if (!room) return
  if (room.phase !== 'coding') return

  // only the saboteur can change code — validate server-side
  const player = room.players.get(socket.id)
  if (!player || player.role !== 'saboteur') return

  // update the canonical code in room state
  room.code = code

  // broadcast updated code to all OTHER players (not back to sender)
  socket.to(roomId).emit('code_updated', { code })

  // debounce test evaluation — run tests 800ms after the last keystroke
  // avoids spawning a Python process on every single character typed
  const existing = evalTimers.get(roomId)
  if (existing) clearTimeout(existing)

  const timer = setTimeout(async () => {
    evalTimers.delete(roomId)
    if (!room.currentSnippet) return

    const results = await runTests(code, room.currentSnippet.testCases)

    // broadcast to everyone — all players see the same test panel
    io.to(roomId).emit('test_results', { results })

    // log for debugging
    const passed = results.filter(r => r.passed).length
    console.log(`Room ${roomId} tests: ${passed}/${results.length} passing`)
  }, 800)

  evalTimers.set(roomId, timer)
})
})

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})