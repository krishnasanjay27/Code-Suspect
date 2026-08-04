import { useEffect, useState } from 'react'
import socket from '../socket/socket.js'
import useGameStore from '../store/gameStore.js'

interface TestResult {
  id: string
  name: string
  passed: boolean
  error: string | null
}

const COLOR_RING: Record<string, string> = {
  red: 'ring-red-500', blue: 'ring-blue-500', green: 'ring-green-500',
  orange: 'ring-orange-500', purple: 'ring-purple-500', teal: 'ring-teal-500',
}

const COLOR_BG: Record<string, string> = {
  red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-green-500',
  orange: 'bg-orange-500', purple: 'bg-purple-500', teal: 'bg-teal-500',
}

const COLOR_TEXT: Record<string, string> = {
  red: 'text-red-700', blue: 'text-blue-700', green: 'text-green-700',
  orange: 'text-orange-700', purple: 'text-purple-700', teal: 'text-teal-700',
}

export default function TestPanel() {
  const room = useGameStore(s => s.room)
  const phase = useGameStore(s => s.phase)
  const [results, setResults] = useState<TestResult[]>([])
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set())

  // reset when a new round starts
  useEffect(() => {
    if (phase === 'coding') {
      setResults([])
      setLockedIds(new Set())
    }
  }, [phase])

  useEffect(() => {
    socket.on('test_results', ({ results: incoming }: { results: TestResult[] }) => {
      setResults(incoming)

      // lock any test that passed — "Tests lock once passed ✓"
      setLockedIds(prev => {
        const next = new Set(prev)
        incoming.forEach(r => { if (r.passed) next.add(r.id) })
        return next
      })
    })

    return () => { socket.off('test_results') }
  }, [])

  const passCount  = results.filter(r => r.passed).length
  const totalCount = results.length

  return (
    <div className="flex flex-col h-full bg-[#f5f0e8] border-r-2 border-[#b0a090] font-mono">

      {/* Header */}
      <div className="bg-[#2a2a2a] px-3 py-2">
        <p className="text-[#f5f0e8] text-[10px] font-bold tracking-widest uppercase">
          Players
        </p>
      </div>

      {/* Player list */}
      <div className="px-3 py-3 border-b-2 border-[#b0a090] space-y-1.5">
        {room?.players.map(p => (
          <div key={p.id} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${COLOR_BG[p.color] || 'bg-gray-500'}`} />
            <span className={`text-xs font-bold ${COLOR_TEXT[p.color] || 'text-gray-700'}`}>
              {p.nickname}
            </span>
          </div>
        ))}
      </div>

      {/* Test cases header */}
      <div className="bg-[#2a2a2a] px-3 py-2 flex justify-between items-center">
        <p className="text-[#f5f0e8] text-[10px] font-bold tracking-widest uppercase">
          Test Cases
        </p>
        {totalCount > 0 && (
          <span className="text-[#888] text-[10px]">
            ({passCount}/{totalCount})
          </span>
        )}
      </div>

      {/* Test case rows */}
      <div className="flex-1 px-3 py-3 space-y-2">
        {results.length === 0 ? (
          <p className="text-[#9a9080] text-[10px] tracking-wide leading-relaxed">
            Waiting for code changes...
          </p>
        ) : (
          results.map(r => (
            <TestRow
              key={r.id}
              result={r}
              locked={lockedIds.has(r.id)}
            />
          ))
        )}
      </div>

      {/* Lock note */}
      {lockedIds.size > 0 && (
        <div className="px-3 py-2 border-t border-[#d5cfc5]">
          <p className="text-[#9a9080] text-[10px]">
            Tests lock once passed ✓
          </p>
        </div>
      )}

    </div>
  )
}

function TestRow({
  result, locked
}: {
  result: TestResult
  locked: boolean
}) {
  return (
    <div className={`
      flex items-start gap-2 px-2 py-2 border
      ${locked
        ? 'border-green-700 bg-green-950/20'
        : result.passed
          ? 'border-green-700 bg-green-950/10'
          : 'border-[#d5cfc5] bg-[#f5f0e8]'
      }
    `}>
      {/* status circle */}
      <div className={`
        w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5
        flex items-center justify-center
        ${result.passed
          ? 'border-green-600 bg-green-600'
          : 'border-[#b0a090] bg-transparent'
        }
      `}>
        {result.passed && (
          <svg width="8" height="8" viewBox="0 0 8 8">
            <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5"
              fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* name + error */}
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold leading-tight
          ${result.passed ? 'text-green-700' : 'text-[#2a2a2a]'}
        `}>
          {result.name}
        </p>
        {result.error && (
          <p className="text-[9px] text-red-500 mt-0.5 leading-tight truncate">
            {result.error}
          </p>
        )}
      </div>

      {/* locked badge */}
      {locked && (
        <span className="text-[9px] text-green-600 font-bold tracking-wide flex-shrink-0">
          LOCKED
        </span>
      )}
    </div>
  )
}