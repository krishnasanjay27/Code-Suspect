import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Lobby from './pages/Lobby.js'
import Room from './pages/Room.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/room/:roomId/game" element={<div className="text-white p-8 font-mono">Game screen coming in Phase 3</div>} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)