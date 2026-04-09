import http from 'http'
import app from './app.js'
import { Server } from 'socket.io'
import { log } from 'console'
const PORT = process.env.PORT || 3001

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

io.on('connection', (socket) => {
  console.log(`player connected ${socket.id}`);
  io.emit('player_count', { count: io.engine.clientsCount })
  socket.on('ping_test', (data) => {
    console.log('recieved data: ', data);
    socket.emit('pong_test', { message: 'pong from server', echo: data })

  })
  socket.on('disconnect', () => {
    console.log(`player disconnected ${socket.id}`);

  })

})

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})