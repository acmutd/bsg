"use client"
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
import { useChatSocket } from '../hooks/useChatSocket'




interface User {
  id: string,
  name: string,
  email: string,
  photo?: string

}

type AuthProvider = 'google' | 'github'


const poppins = Poppins({ weight: '400', subsets: ['latin'] })


export default function RedirectionToRoomScreen() {

  const [loggedIn, setLoggedIn] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<{ code: string, options?: any } | null>(null)
  const [copied, setCopied] = useState(false)
  const [user, SetUser] = useState(false)
  const [userProfile, setUserProfile] = useState<User | null>(null)



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
    const text = inputRef.current?.value.trim()
    if (!text || !currentRoom) return

    // Send message via WebSocket
    sendChatMessage(currentRoom.code, text, {
      name: userProfile?.name || 'Unknown', 
      photo: userProfile?.photo 
    });

    // REMOVED: Optimistic update.
    // The server will echo the message back to us, so we don't need to add it manually here.
    // This prevents the "double message" issue for the sender.

    inputRef.current!.value = ''
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
  

    useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
        if (response?.success) {
          setUserProfile(response.user)
          setLoggedIn(true)
        }
      })
    }
  }, [])


// // Show RoomChoice if logged in and not yet in a room
//     if (loggedIn && !currentRoom) {
//         return (
//           <RoomChoice
//             onJoin={handleJoin}
//             onCreate={handleCreate}
//           />
//         )
//       }

//     if(!currentRoom){
//       return (
//         <RoomChoice 
//             onJoin={handleJoin}
//             onCreate={handleCreate}
//         />
//       )
//     }

      if(currentRoom){
        
        const participants: User[] = currentRoom.options?.participants || []

        return (
        <div className="flex flex-col h-screen bg-[#262626]">
          <header className="bg-[#1e1e1f] border-b border-gray-700 px-4 py-3 flex items-center justify-between">
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
                  <img key={p.id} src={p.photo} alt={p.name || p.id} title={p.name || p.id}
                    className="w-8 h-8 rounded-full border border-gray-600 object-cover" />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* show current user's avatar */}
              {userProfile && (
                <img src={userProfile.photo} alt={userProfile.name} title={userProfile.name}
                  className="w-8 h-8 rounded-full border-2 border-green-500 object-cover" />
              )}
              <Button onClick={() => { setCurrentRoom(null); setLoggedIn(false) }} className="bg-gray-700 text-white rounded-md px-3 py-1 hover:bg-gray-600">
                Exit
              </Button>
            </div>
          </header>

          <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className="flex">
                 {msg.isSystem ? (
                    <div className="w-full text-center text-gray-400 text-sm my-2">
                        {msg.data}
                    </div>
                 ) : (
                    <div className={`${msg.userHandle === userProfile?.id ? 'self-end ml-auto' : 'self-start'} flex items-end gap-2 max-w-xs`}>
                        {msg.userHandle !== userProfile?.id && (
                           <img src={msg.userPhoto} alt={msg.userName} className="w-6 h-6 rounded-full mb-1 border border-gray-600 object-cover" />
                        )}
                        <div className={`${msg.userHandle === userProfile?.id ? 'bg-green-600' : 'bg-gray-700'} text-white p-2 rounded-lg break-words`}>
                            <div className="text-xs text-gray-300 mb-1">{msg.userHandle === userProfile?.id ? 'You' : (msg.userName || msg.userHandle)}</div>
                            {msg.data}
                        </div>
                         {msg.userHandle === userProfile?.id && (
                           <img src={userProfile?.photo} alt="You" className="w-6 h-6 rounded-full mb-1 border border-green-500 object-cover" />
                        )}
                    </div>
                 )}
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
            <Button
              onClick={sendMessage}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] transition-colors"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-white" style={{ transform: 'translateX(-1px)' }} />
            </Button>
          </div>
        </div>
      )
      }


        return (
          <RoomChoice
            onJoin={handleJoin}
            onCreate={handleCreate}
          />
        )



    }


