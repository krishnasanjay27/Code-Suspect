import http from 'http'
import { Server, Socket } from 'socket.io'
import app from './app.js'
import {
  createRoom,
  joinRoom,
  removePlayer,
  getRoom,
  serializeRoom,
  assignRoles
} from './rooms.js'

const PORT = process.env.PORT || 3001

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
  }
})

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

  socket.on('start_game', ({ roomId }: { roomId: string }) => {
    const room = getRoom(roomId)
    if (!room) return
    if (room.hostId !== socket.id) return   // only host can start
    if (room.players.size < 2) return       // need at least 2

    // 1. assign roles — returns Map<socketId, role>
    const roleAssignments = assignRoles(roomId)
    if (!roleAssignments) return

    // 2. update room phase
    room.phase = 'role_reveal'
    room.round = 1

    // 3. tell each player their role PRIVATELY
    roleAssignments.forEach((role, socketId) => {
      io.to(socketId).emit('role_assigned', { role })
      //    ^^^^^^^^^^
      // io.to(socketId) targets ONE specific socket
      // same as socket.emit but from outside the socket's own handler
    })

    // 4. tell EVERYONE the game has started and phase changed
    // note: we send the room WITHOUT role info — serializeRoom never includes roles
    io.to(roomId).emit('game_started', {
      room: serializeRoom(room)
    })

    console.log(`Game started in room ${roomId} — saboteur is ${[...roleAssignments.entries()].find(([, r]) => r === 'saboteur')?.[0]
      }`)
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
})

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})