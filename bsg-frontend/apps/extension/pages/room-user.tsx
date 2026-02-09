"use client"
import '../../../packages/ui-styles/global.css'
import { useState, useRef, useEffect } from 'react'
import type { AppProps } from 'next/app'
import '@bsg/ui-styles/global.css';
import { Poppins } from 'next/font/google'
import { Button } from '@bsg/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faSmile, faCopy } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import RoomChoice from './room-choice'
import { useChatSocket } from '../hooks/useChatSocket'
import { getFirebaseAuth } from '../firebase/config'

const auth = getFirebaseAuth()




interface User {
  id: string,
  name: string,
  email: string,
  photo?: string

}

type AuthProvider = 'google' | 'github'


const poppins = Poppins({ weight: '400', subsets: ['latin'] })


export default function RedirectionToRoomScreen() {

  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [roundStarted, setRoundStarted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [currentRoom, setCurrentRoom] = useState<{ code: string, options?: any } | null>(null)
  const [copied, setCopied] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)



  const { messages, isConnected, joinRoom, sendChatMessage, addMessage } = useChatSocket(userProfile?.id);

  // Timer countdown effect
  useEffect(() => {
    if (!roundStarted || timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          setRoundStarted(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roundStarted, timeRemaining]);

  const getAuthToken = async () => {
    if (!auth) throw new Error("Firebase Auth not initialized");

    // Wait for auth to initialize if it's currently null
    if (!auth.currentUser) {
      await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          resolve(user);
        });
        // Timeout after 2 seconds to avoid hanging
        setTimeout(resolve, 2000);
      });
    }

    if (!auth.currentUser) {
      throw new Error("User not authenticated with Firebase. Please sign in.");
    }
    return await auth.currentUser.getIdToken();
  };

  const syncToBackground = (payload: any) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SET_STATE', payload });
    }
  };

  const handleStartRound = async () => {
    if (!currentRoom) return;
    console.log('🎮 Starting round...');

    try {
      const token = await getAuthToken();
      const roomResponse = await fetch(`http://localhost:5050/api/rooms/${currentRoom.code}`, {
        headers: { 'Authorization': token }
      });

      if (!roomResponse.ok) throw new Error('Failed to fetch room');
      const roomData = await roomResponse.json();
      const round = roomData.data?.rounds?.[0];
      if (!round) throw new Error('No round found in room');

      const problemList = round.problems?.map((p: any) => String(p.ID || p.id)) || [];
      const problemSlugs = round.problems?.map((p: any) => p.slug).filter(Boolean) || [];
      const firstProblemSlug = problemSlugs[0];

      if (problemList.length === 0) throw new Error('Round has no problems!');

      const response = await fetch(`http://localhost:5050/api/rooms/${currentRoom.code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify({ problemList })
      });

      let shouldNavigate = false;
      if (!response.ok) {
        const errorText = await response.text();
        let isAlreadyStarted = false;
        try {
          const errJson = JSON.parse(errorText);
          if (response.status === 400 && errJson.message?.includes('started')) isAlreadyStarted = true;
        } catch (e) { }

        if (isAlreadyStarted) {
          setRoundStarted(true);
          setTimeRemaining(currentRoom.options?.duration * 60 || 1800);
          shouldNavigate = true;
          addMessage({
            userHandle: 'System',
            data: `Round already started!\nProblems: ${problemList.join(', ')}`,
            roomID: currentRoom.code,
            isSystem: true
          });
        } else {
          throw new Error('Failed to start round: ' + errorText);
        }
      } else {
        setRoundStarted(true);
        setTimeRemaining(currentRoom.options?.duration * 60 || 1800);
        shouldNavigate = true;
      }

      if (shouldNavigate && firstProblemSlug) {
        await syncToBackground({
          roundStarted: true,
          timeRemaining: currentRoom.options?.duration * 60 || 1800,
          problemList,
          problemSlugs,
          currentRoom,
          userProfile
        });

        const problemUrl = `https://leetcode.com/problems/${firstProblemSlug}/`;
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].id) chrome.tabs.update(tabs[0].id, { url: problemUrl });
          });
        }
      }
    } catch (err) {
      console.error('Failed to start round:', err);
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };


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
    try { document.execCommand('copy') } catch { }
    ta.remove()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function sendMessage() {
    const text = chatInput.trim()
    if (!text || !currentRoom) return
    sendChatMessage(currentRoom.code, text);
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
    joinRoom(roomCode);
    syncToBackground({ currentRoom: { code: roomCode, options }, userProfile });
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

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
        if (state) {
          if (state.currentRoom) {
            setCurrentRoom(state.currentRoom);
            joinRoom(state.currentRoom.code);
          }
          if (state.roundStarted !== undefined) setRoundStarted(state.roundStarted);
          if (state.timeRemaining !== undefined) setTimeRemaining(state.timeRemaining);
          if (state.userProfile) {
            setUserProfile(state.userProfile);
            setLoggedIn(true);
          }
        }
      });
    }
  }, []);

  const handleExit = () => {
    setCurrentRoom(null);
    setLoggedIn(false);
    setRoundStarted(false);
    setTimeRemaining(null);
    syncToBackground({ currentRoom: null, roundStarted: false, timeRemaining: null });
  };

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

  if (!currentRoom) {
    return (
      <RoomChoice
        onJoin={handleJoin}
        onCreate={handleCreate}
        useBackend={true}
      />
    )
  }

  return (
    <div className={`${poppins.className} flex items-center justify-center bg-gradient-to-b from-[#141416] to-[#101012] p-0 min-h-screen`}>
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
        <header className="bg-[#1e1e1f] border-b border-gray-700 px-4 py-4 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              onClick={handleExit}
              className="bg-gray-700/80 text-white rounded-lg px-4 py-2 hover:bg-red-600 hover:shadow-[0_0_15px_rgba(220,38,38,0.4)] text-sm font-semibold transition-all duration-200 border border-gray-600/50"
            >
              Exit
            </Button>

            <div className="flex flex-col min-w-0">
              <div className="text-[11px] text-gray-400 mb-1 font-semibold uppercase tracking-wider">Room Code:</div>
              <div className="bg-[#2a2a2b] text-white px-4 py-2 rounded-xl font-mono border border-gray-600/30 flex items-center gap-3 shadow-inner">
                <div className="text-2xl font-bold tracking-[0.2em] text-[#f5f5f5]">{currentRoom.code}</div>
                <button
                  onClick={() => copyRoomCode(currentRoom.code)}
                  aria-label="Copy room code"
                  className="p-1.5 rounded-md hover:bg-gray-600/50 text-gray-400 hover:text-white transition-all"
                >
                  <FontAwesomeIcon icon={faCopy} className="text-sm" />
                </button>
                {copied && <div className="text-[10px] text-green-400 font-sans font-bold uppercase tracking-tighter bg-green-400/10 px-1.5 py-0.5 rounded">Copied</div>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {userProfile && (
              <img
                src={userProfile.photo}
                alt={userProfile.name}
                className="w-10 h-10 rounded-full border-2 shadow-lg"
                style={{ borderColor: 'hsl(var(--primary))' }}
              />
            )}
          </div>
        </header>

        {currentRoom.options && (
          <div className="w-full flex justify-center items-center gap-4 py-3 bg-[#1e1e1f]/50 border-b border-gray-700/50 backdrop-blur-sm">
            {!roundStarted ? (
              <Button
                onClick={handleStartRound}
                className="bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] text-white px-8 py-2 font-semibold shadow-lg hover:shadow-[hsl(90,72%,39%)]/20 transition-all duration-200"
              >
                Start Round
              </Button>
            ) : (
              <>
                <Button
                  disabled
                  className="bg-gray-700 text-gray-300 px-6 py-2 font-semibold cursor-not-allowed opacity-80 border border-gray-600/30"
                >
                  Round Started
                </Button>
                {timeRemaining !== null && (
                  <div className="flex flex-col items-center px-4 py-1 bg-[#2a2a2b] rounded-lg border border-gray-600/30 shadow-inner">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Time Left</span>
                    <span className="text-white font-mono text-xl font-bold leading-tight">
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{ minHeight: 0 }}
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
                  <div className="text-xs text-gray-300 mb-1">{msg.userName || msg.userHandle}</div>
                  {msg.data}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-700/40 bg-[#0f1112] p-3 flex-shrink-0" style={{ zIndex: 30 }}>
          <div style={{ width: '100%', maxWidth: 920 }} className="mx-auto flex items-center gap-2">
            <input
              placeholder="Type a message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
              className="flex-1 px-3 py-2 rounded-lg bg-[hsl(var(--inputBackground))] border border-gray-700 text-white focus:outline-none"
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
