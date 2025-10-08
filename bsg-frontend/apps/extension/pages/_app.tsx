import '../../../packages/ui-styles/global.css'
import { useState, useRef, useEffect } from 'react'
import type { AppProps } from 'next/app'
import '@bsg/ui-styles/global.css'
import { Poppins } from 'next/font/google'
import { Button } from '@bsg/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faPaperPlane, faSmile, faCopy } from '@fortawesome/free-solid-svg-icons'
import RoomChoice from '../pages/room-choice'

const poppins = Poppins({ weight: '400', subsets: ['latin'], variable: '--poppins' })

export default function App({ Component, pageProps }: AppProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<{ code: string, options?: any } | null>(null)
  const [messages, setMessages] = useState<string[]>([
    'Welcome to BSG Chat!',
    'YAARRRRG, this be a demo.',
  ])
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // copy room code to clipboard
  function copyRoomCode(roomCode: string) {
    if (!roomCode) return
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'COPY_TO_CLIPBOARD', text: roomCode }, (resp) => {
          const ok = resp && resp.ok
          if (ok) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            return
          }
          doLocalCopy(roomCode)
        })
        return
      }
    } catch (e) {
      console.warn('chrome.runtime not available for copy, falling back', e)
    }
    doLocalCopy(roomCode)
  }

  function doLocalCopy(roomCode: string) {
    const ta = document.createElement('textarea')
    ta.value = roomCode
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch {}
    ta.remove()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function sendMessage() {
    const text = inputRef.current?.value.trim()
    if (!text) return
    setMessages((msgs) => [...msgs, `You: ${text}`])
    inputRef.current!.value = ''
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  // --- RENDER LOGIC ---
  if (!loggedIn) {
    return (
      <div className={`${poppins.className} min-h-screen bg-[#262626] flex items-center justify-center px-4 py-8`}>
        <div className="bg-[#333333] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-8 pt-16 space-y-8">
          <div className="flex justify-center mb-2">
            <span className="text-5xl font-extrabold tracking-wide text-white drop-shadow-lg">BSG_</span>
          </div>
          <div className="flex flex-col justify-center items-center gap-y-4">
            <Button
            onClick={() => setLoggedIn(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white 
            bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] transition-colors"
            >
              <FontAwesomeIcon icon={faGoogle} />
              <span>Sign in with Google</span>
              </Button>

          </div>
        </div>
      </div>
    )
  }

  // Show RoomChoice if not yet in a room
  if (!currentRoom) {
    return (
      <RoomChoice
        onJoin={(room) => setCurrentRoom({ code: room })}
        onCreate={(roomCode, options) => setCurrentRoom({ code: roomCode, options })}
      />
    )
  }

  // Once in a room, show chat UI
  return (
    <div className="flex flex-col h-screen bg-[#262626]">
      <header className="bg-[#1e1e1f] border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col items-start">
          <div className="text-xs text-gray-300 mb-1">Room Code:</div>
          <div className="bg-gray-700 text-white p-2 rounded-lg font-mono text-lg tracking-widest flex items-center space-x-2">
            <div className="text-2xl font-semibold">{currentRoom.code}</div>
            <button onClick={() => copyRoomCode(currentRoom.code)} aria-label="Copy room code" className="p-1 rounded hover:bg-gray-600">
              <FontAwesomeIcon icon={faCopy} className="text-gray-200 text-sm" />
            </button>
            {copied && <div className="text-xs text-green-400 ml-2">copied</div>}
          </div>
        </div>

        <Button onClick={() => { setCurrentRoom(null); setLoggedIn(false) }} className="bg-gray-700 text-white rounded-md px-3 py-1 hover:bg-gray-600">
          Exit
        </Button>
      </header>

      <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="flex">
            <div className={`${msg.startsWith('You:') ? 'bg-green-600 self-end' : 'bg-gray-700 self-start'} text-white p-2 rounded-lg max-w-xs`}>
              {msg}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1e1e1f] border-t border-gray-700 px-4 py-3 flex items-center space-x-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600">
          <FontAwesomeIcon icon={faSmile} className="text-gray-300 text-lg" />
        </button>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          className="flex-1 bg-[#2a2a2a] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage()
            }
          }}
        />
        {/* use the same green button style so colors match the rest of the UI */}
        <Button
        onClick={sendMessage}
        className="w-10 h-10 rounded-full flex items-center justify-center 
        bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] transition-colors"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="text-white" style={{ transform: 'translateX(-1px)' }} />
          </Button>

      </div>
    </div>
  )
}
