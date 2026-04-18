import { io, Socket } from 'socket.io-client'

const socket: Socket = io(
  import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3001',
  { autoConnect: false }
)

export default socket