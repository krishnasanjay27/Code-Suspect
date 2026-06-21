import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocketEvents } from './socket/useSocketEvents.js'
import useGameStore from './store/gameStore.js'

export default function App() {
  useSocketEvents()
  const navigate = useNavigate()
  const pendingNavigation = useGameStore(s => s.pendingNavigation)
  const setPendingNavigation = useGameStore(s => s.setPendingNavigation)

  useEffect(() => {
    if (pendingNavigation) {
      navigate(pendingNavigation)
      setPendingNavigation(null)
    }
  }, [pendingNavigation])

  return null
}