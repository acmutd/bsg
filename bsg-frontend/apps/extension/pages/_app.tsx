import '../../../packages/ui-styles/global.css'
import { useState, useRef, useEffect } from 'react'
import type { AppProps } from 'next/app'
import '@bsg/ui-styles/global.css';
import {Poppins} from 'next/font/google'
import { Button } from '@bsg/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faSmile, faCopy } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import RoomChoice from './room-choice'
import { SignInWithChromeIdentity, getUserInfoFromToken } from '../firebase/auth/signIn/googleImplementation/chromeExtensionAuth'
import { useChatSocket } from '../hooks/useChatSocket'

const poppins = Poppins({ weight: '400', subsets: ['latin'] })

type Participant = { id: string; name?: string; avatarUrl?: string }

export default function App({ Component, pageProps }: AppProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<{ code: string, options?: any } | null>(null)
  const [copied, setCopied] = useState(false)
  const [userProfile, setUserProfile] = useState<Participant | null>(null)
  const [chatInput, setChatInput] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize WebSocket Hook
  const { messages, isConnected, joinRoom, sendChatMessage } = useChatSocket(userProfile?.id);

  // copy room code to clipboard (works in extension and locally)
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
      // fallback
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
    const text = chatInput.trim()
    if (!text || !currentRoom) return
    
    // Send message via WebSocket
    sendChatMessage(currentRoom.code, text);
    
    // REMOVED: Optimistic update. 
    // The server will echo the message back to us, so we don't need to add it manually here.
    // This prevents the "double message" issue for the sender.
    
    setChatInput('')
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  // join/create handlers
  const handleJoin = (roomCode: string) => {
    setCurrentRoom({ code: roomCode, options: {} })
    joinRoom(roomCode);
  }

  const handleCreate = (roomCode: string, options: any) => {
    setCurrentRoom({ code: roomCode, options: { ...options } })
    // Currently just joins the room code generated. 
    // Future: Send 'create-room' request if backend distinguishes it.
    joinRoom(roomCode);
  }

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
              onClick={async () => {
                try {
                  // Sign in via chrome identity + firebase
                  await SignInWithChromeIdentity()
                  // Then request token non-interactively and fetch user info
                  if (typeof chrome !== 'undefined' && chrome.identity) {
                    chrome.identity.getAuthToken({ interactive: false }, async (tokenResult) => {
                      if (chrome.runtime.lastError) {
                        // fallback to interactive token if needed
                        chrome.identity.getAuthToken({ interactive: true }, async (tResult) => {
                          let t: string | undefined
                          if (!tResult) return
                          if (typeof tResult === 'string') t = tResult
                          else if ((tResult as any).token) t = (tResult as any).token
                          if (!t) return
                          const info = await getUserInfoFromToken(t)
                          setUserProfile({ id: info.email || info.id || info.sub || 'me', name: info.name, avatarUrl: info.picture })
                          setLoggedIn(true)
                        })
                        return
                      }
                      let t: string | undefined
                      if (!tokenResult) return
                      if (typeof tokenResult === 'string') t = tokenResult
                      else if ((tokenResult as any).token) t = (tokenResult as any).token
                      if (!t) return
                      const info = await getUserInfoFromToken(t)
                      setUserProfile({ id: info.email || info.id || info.sub || 'me', name: info.name, avatarUrl: info.picture })
                      setLoggedIn(true)
                    })
                  } else {
                    // Non-extension environment: just mark logged in (Dev mode)
                    // Generate random ID to prevent collision in local testing
                    const randomSuffix = Math.floor(Math.random() * 10000);
                    setUserProfile({ 
                        id: `dev-user-${randomSuffix}@example.com`, 
                        name: `Dev User ${randomSuffix}`, 
                        avatarUrl: '' 
                    })
                    setLoggedIn(true)
                  }
                } catch (err) {
                  //console.error('Sign-in failed', err)
                  // Generate random ID to prevent collision in local testing
                    const randomSuffix = Math.floor(Math.random() * 10000);
                    setUserProfile({ 
                        id: `dev-user-${randomSuffix}@example.com`, 
                        name: `Dev User ${randomSuffix}`, 
                        avatarUrl: '' 
                    })
                    setLoggedIn(true)
                }
              }}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white transition-colors"
              style={{ background: 'hsl(var(--primary))' }}
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
        onJoin={handleJoin}
        onCreate={handleCreate}
      />
    )
  }

  const participants: Participant[] = currentRoom.options?.participants || []

  return (
    <div className={`${poppins.className} flex items-center justify-center bg-gradient-to-b from-[#141416] to-[#101012] p-0 min-h-screen`}>
      {/* Shell: top/bottom borders, full width */}
      <div
        id="bsg-shell"
        className="w-full bg-gradient-to-b from-[#1f1f22] to-[#161617] overflow-hidden flex flex-col"
        style={{
          height: '100vh',
          boxSizing: 'border-box',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header className="bg-[#1e1e1f] border-b border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="text-xs text-gray-300 mb-1">Room Code:</div>
              <div className="bg-gray-700 text-white p-2 rounded-lg font-mono text-lg tracking-widest flex items-center space-x-2">
                <div className="text-2xl font-semibold">{currentRoom.code}</div>
                <button onClick={() => copyRoomCode(currentRoom.code)} aria-label="Copy room code" className="p-1 rounded hover:bg-gray-600">
                  <FontAwesomeIcon icon={faCopy} className="text-gray-200 text-sm" />
                </button>
                {copied && <div className="text-xs text-green-400 ml-2">copied</div>}
                {!isConnected && <div className="text-xs text-red-500 ml-2">Disconnected</div>}
              </div>
            </div>

            {/* Participant avatars (lobby) */}
            <div className="flex items-center gap-2 ml-4">
              {participants.map((p) => (
                <img key={p.id} src={p.avatarUrl} alt={p.name || p.id} title={p.name || p.id}
                  className="w-8 h-8 rounded-full border border-gray-600 object-cover" />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* show current user's avatar */}
            {userProfile && (
              <img
                src={userProfile?.avatarUrl}
                alt={userProfile?.name}
                className="w-8 h-8 rounded-full border-2"
                style={{ borderColor: 'hsl(var(--primary))' }}
              />
            )}
            <Button onClick={() => { setCurrentRoom(null); setLoggedIn(false) }} className="bg-gray-700 text-white rounded-md px-3 py-1 hover:bg-gray-600">
              Exit
            </Button>
          </div>
        </header>

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{
            minHeight: 0
          }}
        >
          {messages.map((msg, i) => (
            <div key={i} className="flex">
              {msg.isSystem ? (
                <div className="w-full text-center text-gray-400 text-sm my-2">
                  {msg.data}
                </div>
              ) : msg.userHandle === userProfile?.id ? (
                <div className="text-white p-2 rounded-lg max-w-xs break-words self-end ml-auto" style={{ background: 'hsl(var(--primary))' }}>
                  <div className="text-xs text-gray-300 mb-1">You</div>
                  {msg.data}
                </div>
              ) : (
                <div className="bg-gray-700 self-start text-white p-2 rounded-lg max-w-xs break-words">
                  <div className="text-xs text-gray-300 mb-1">{msg.userHandle}</div>
                  {msg.data}
                </div>
              )}
            </div>
          ))}
        </div>

         {/* sticky input bar inside the shell */}
        <div className="border-t border-gray-700/40 bg-[#0f1112] p-3 flex-shrink-0" style={{ zIndex: 30 }}>
           <div style={{ width: '100%', maxWidth: 920 }} className="mx-auto flex items-center gap-2">
            <input
              id="chat-input"
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
              className="flex-1 px-3 py-2 rounded-lg bg-[hsl(var(--inputBackground))] border border-gray-700 text-white focus:outline-none"
              aria-label="Message"
            />
            <Button
              onClick={sendMessage}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
              style={{ background: 'hsl(var(--primary))' }}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-white" style={{ transform: 'translateX(-1px)' }} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}