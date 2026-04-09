import { useEffect, useState } from 'react'
import socket from '../socket/socket'

function ConnectionTest() {
  const [status, setStatus] = useState('disconnected')
  const [messages, setMessages] = useState([])
  const [playerCount, setPlayerCount] = useState(0)

  useEffect(() => {
    socket.on('connect', () => {
      setStatus('connected')
      addMessage(`Connected with ID: ${socket.id}`)
    })

    socket.on('pong_test', (data) => {
      addMessage(`Server replied: ${data.message}`)
    })

    socket.on('player_count', (data) => {
      setPlayerCount(data.count)
    })

    socket.on('disconnect', () => {
      setStatus('disconnected')
      setPlayerCount(0)
      addMessage('Disconnected from server')
    })

    // cleanup: remove listeners when component unmounts
    return () => {
      socket.off('connect')
      socket.off('pong_test')
      socket.off('player_count')
      socket.off('disconnect')
    }
  }, [])

  function addMessage(text) {
    setMessages(prev => [...prev, { text, time: new Date().toLocaleTimeString() }])
  }

  function handleConnect() {
    socket.connect()
  }

  function handlePing() {
    socket.emit('ping_test', { from: 'React client', sentAt: Date.now() })
    addMessage('Sent ping to server...')
  }

  function handleDisconnect() {
    socket.disconnect()
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <p>Status: <strong>{status}</strong></p>
      <p>Players Online: <strong>{playerCount}</strong></p>
      <div style={{ display: 'flex', gap: '8px', margin: '1rem 0' }}>
        <button onClick={handleConnect}>Connect</button>
        <button onClick={handlePing} disabled={status !== 'connected'}>Send Ping</button>
        <button onClick={handleDisconnect} disabled={status !== 'connected'}>Disconnect</button>
      </div>
      <div>
        {messages.map((m, i) => (
          <p key={i} style={{ margin: '4px 0', fontSize: '13px' }}>
            [{m.time}] {m.text}
          </p>
        ))}
      </div>
    </div>
  )
}

export default ConnectionTest