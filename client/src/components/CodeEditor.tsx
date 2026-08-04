import { useRef, useEffect, useCallback } from 'react'
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import useGameStore from '../store/gameStore.js'
import socket from '../socket/socket.js'

interface CodeEditorProps {
  roomId: string
}

export default function CodeEditor({ roomId }: CodeEditorProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const isRemoteUpdate = useRef(false)  // prevents echo on remote code changes

  const code    = useGameStore(s => s.code)
  const role    = useGameStore(s => s.role)
  const phase   = useGameStore(s => s.phase)
  const setCode = useGameStore(s => s.setCode)

  // only the saboteur can edit during the coding phase
  const isEditable = role === 'saboteur' && phase === 'coding'

  // when remote code_updated arrives, update editor without triggering onChange
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const currentValue = editor.getValue()
    if (currentValue === code) return  // no-op if already in sync

    isRemoteUpdate.current = true
    
    // Save view state (scroll position, cursor) so Debuggers don't jump to the top
    const viewState = editor.saveViewState()
    
    editor.setValue(code)
    
    if (viewState) {
      editor.restoreViewState(viewState)
    }
    
    isRemoteUpdate.current = false
  }, [code])

  // sync read-only state when phase or role changes
  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly: !isEditable })
  }, [isEditable])

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor

    editor.updateOptions({ readOnly: !isEditable })

    // set initial code from store (populated when coding phase starts)
    editor.setValue(code)
  }

  const handleChange: OnChange = useCallback((value) => {
    if (isRemoteUpdate.current) return    // don't emit changes that came from server
    if (!value || !isEditable) return

    setCode(value)
    socket.emit('code_change', { roomId, code: value })
  }, [isEditable, roomId])

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-2 border-[#3a3a4a]">
      <Editor
        height="100%"
        defaultLanguage="python"
        theme="vs-dark"
        onChange={handleChange}
        onMount={handleMount}
        options={{
          // match your screenshots
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          renderLineHighlight: 'line',
          cursorBlinking: 'smooth',
          // disable features that don't make sense in a game
          contextmenu: false,
          folding: false,
          // read-only players see a cleaner cursor
          readOnly: !isEditable,
          domReadOnly: !isEditable,
        }}
        loading={
          <div className="flex-1 flex items-center justify-center bg-[#1e1e1e]">
            <p className="text-[#555] font-mono text-xs tracking-widest uppercase">
              Loading editor...
            </p>
          </div>
        }
      />
    </div>
  )
}