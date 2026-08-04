export default function ChatPanel({ roomId }: { roomId: string }) {
  return (
    <div className="flex flex-col h-full bg-[#252526] border-l-2 border-[#3a3a4a] font-mono">
      <div className="bg-[#2a2a2a] px-3 py-2 border-b border-[#3a3a4a]">
        <p className="text-[#888] text-[10px] font-bold tracking-widest uppercase">
          Chat
        </p>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#555] text-xs">No messages yet...</p>
      </div>
      <div className="p-2 border-t border-[#3a3a4a]">
        <input
          disabled
          className="w-full bg-[#1e1e1e] border border-[#3a3a4a] px-2 py-1.5 text-xs text-[#888] font-mono"
          placeholder="Type..."
        />
      </div>
    </div>
  )
}