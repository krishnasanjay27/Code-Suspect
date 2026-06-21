import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.js'
import Lobby from './pages/Lobby.js'
import Room from './pages/Room.js'
import RoleReveal from './pages/RoleReveal.js'
import GameTopBar from './components/GameTopBar.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/room/:roomId/game" element={
          <div className="min-h-screen bg-[#e8e0d0]">
            <GameTopBar />
            <div className="p-8 text-[#6b6050] font-mono text-sm">
              Code editor goes here (Phase 3)
            </div>
          </div>
        } />
        <Route path="/room/:roomId/role-reveal" element={<RoleReveal />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
)