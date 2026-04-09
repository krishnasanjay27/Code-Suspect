import ConnectionTest from './components/ConnectionTest'

function App() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Code Suspect
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Social deduction. Collaborative debugging.
        </p>
        <div className="flex gap-3">
          <button className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
            Create Room
          </button>
          <button className="flex-1 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
            Join Room
          </button>
        </div>
      </div>
    </div>
  )
}

export default App