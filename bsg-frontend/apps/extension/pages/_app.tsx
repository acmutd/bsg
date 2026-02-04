import '../../../packages/ui-styles/global.css'
import { useState, useRef, useEffect } from 'react'
import type { AppProps } from 'next/app'
import '@bsg/ui-styles/global.css';
import { Poppins } from 'next/font/google'
import { Button } from '@bsg/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faCopy } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import RoomChoice from './room-choice'
import { useChatSocket } from '../hooks/useChatSocket'
import { getFirebaseAuth } from '../firebase/config' // ADD THIS LINE
import { SignInWithChromeIdentity, getUserInfoFromToken } from '../firebase/auth/signIn/googleImplementation/chromeExtensionAuth'

const poppins = Poppins({ weight: '400', subsets: ['latin'] })
const auth = getFirebaseAuth() // ADD THIS LINE

interface Participant {
  id: string;
  name: string;
  avatarUrl: string;
}


export default function App({ Component, pageProps }: AppProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<{ code: string, options?: any } | null>(null)
  const [copied, setCopied] = useState(false)
  const [userProfile, setUserProfile] = useState<Participant | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [roundStarted, setRoundStarted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize WebSocket Hook
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

  const handleStartRound = async () => {
    if (!currentRoom) return;

    console.log('🎮 Starting round...');

    try {
      let token = await auth?.currentUser?.getIdToken();
      if (!token) {
        console.warn('⚠️ No auth token available, using dummy token for local testing');
        token = 'dummy-token-123';
      }

      // First, fetch the room to get the round details with problems
      console.log('Fetching room details...');
      const roomResponse = await fetch(`http://localhost:5050/api/rooms/${currentRoom.code}`, {
        headers: {
          'Authorization': token
        }
      });

      if (!roomResponse.ok) {
        throw new Error('Failed to fetch room');
      }

      const roomData = await roomResponse.json();
      console.log('Room data:', roomData);

      const round = roomData.data?.rounds?.[0];
      if (!round) {
        throw new Error('No round found in room');
      }

      // Extract problem IDs and slugs from the round
      const problemList = round.problems?.map((p: any) => String(p.ID || p.id)) || [];
      const problemSlugs = round.problems?.map((p: any) => p.slug).filter(Boolean) || [];
      const firstProblemSlug = problemSlugs[0];

      console.log('Problem list for round:', problemList);
      console.log('Problem slugs for round:', problemSlugs);

      if (problemList.length === 0) {
        throw new Error('Round has no problems! Create a new room with problems.');
      }

      // Now start the round with the problem list
      console.log('Starting round for room:', currentRoom.code);
      const response = await fetch(`http://localhost:5050/api/rooms/${currentRoom.code}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({
          problemList: problemList
        })
      });

      let shouldNavigate = false;

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to start round:', response.status, errorText);

        let isAlreadyStarted = false;
        try {
          const errJson = JSON.parse(errorText);
          if (response.status === 400 && errJson.message && errJson.message.includes('started')) {
            isAlreadyStarted = true;
          }
        } catch (e) {
          // ignore parse error
        }

        if (isAlreadyStarted) {
          console.log('Round already started, joining existing round...');
          setRoundStarted(true);
          setTimeRemaining(currentRoom.options?.duration * 60 || 1800);
          shouldNavigate = true;

          // Manually add problem list to chat since backend won't broadcast it
          const problemIds = problemList.map(String);
          addMessage({
            userHandle: 'System',
            data: `Round started!\nProblems: ${problemIds.join(', ')}`,
            roomID: currentRoom.code,
            isSystem: true
          });
        } else {
          throw new Error('Failed to start round: ' + errorText);
        }
      } else {
        const data = await response.json();
        console.log('✅ Round started:', data);
        setRoundStarted(true);
        setTimeRemaining(currentRoom.options?.duration * 60 || 1800);
        shouldNavigate = true;

        // Manually add problem list to chat (backend might not broadcast in time)
        const problemIds = problemList.map(String);
        addMessage({
          userHandle: 'System',
          data: `Round started!\nProblems: ${problemIds.join(', ')}`,
          roomID: currentRoom.code,
          isSystem: true
        });
      }

      // Navigate to the first problem
      if (shouldNavigate && firstProblemSlug) {
        // CRITICAL: Save state to background BEFORE navigating
        // This prevents the state from being lost when the page reloads
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          await new Promise<void>((resolve) => {
            chrome.runtime.sendMessage({
              type: 'SET_STATE',
              payload: {
                roundStarted: true,
                timeRemaining: currentRoom.options?.duration * 60 || 1800,
                problemList: problemList,
                problemSlugs: problemSlugs,
                currentRoom: currentRoom,
                userProfile: userProfile,
                idToken: token
              }
            }, () => {
              console.log('State saved before navigation (with token)');
              resolve();
            });
          });
        }

        const problemUrl = `https://leetcode.com/problems/${firstProblemSlug}/`;
        console.log('Navigating to:', problemUrl);
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].id) {
              chrome.tabs.update(tabs[0].id, { url: problemUrl });
            }
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

  // Sync room details from backend
  const updateRoomState = async (roomCode: string) => {
    try {
      let token = await auth?.currentUser?.getIdToken();
      if (!token) token = 'dummy-token-123';

      const res = await fetch(`http://localhost:5050/api/rooms/${roomCode}`, {
        headers: { 'Authorization': token }
      });

      if (!res.ok) return;

      const data = await res.json();
      const roomData = data.data;
      const room = {
        code: roomCode,
        options: {
          duration: roomData.rounds?.[0]?.duration || 30,
          participants: roomData.participants || []
        }
      };

      const round = roomData.rounds?.[0];
      const payload: any = { currentRoom: room, userProfile };

      if (round && round.status === 'STARTED') {
        const problemList = round.problems?.map((p: any) => String(p.ID || p.id)) || [];
        const problemSlugs = round.problems?.map((p: any) => p.slug).filter(Boolean) || [];

        setRoundStarted(true);
        setTimeRemaining(room.options.duration * 60);

        payload.roundStarted = true;
        payload.problemList = problemList;
        payload.problemSlugs = problemSlugs;
      }

      setCurrentRoom(room);
      syncToBackground(payload);
    } catch (err) {
      console.error('Failed to sync room state:', err);
    }
  };

  // Join/Create handlers
  const handleJoin = async (roomCode: string) => {
    const room = { code: roomCode, options: {} };
    setCurrentRoom(room)
    joinRoom(roomCode);
    updateRoomState(roomCode);
  }

  const handleCreate = async (roomCode: string, options: any) => {
    console.log('Creating room with code:', roomCode);
    const room = { code: roomCode, options: { ...options } };
    setCurrentRoom(room)
    joinRoom(roomCode);
    syncToBackground({ currentRoom: room, userProfile });
  }

  // --- PERSISTENCE / SYNC LOGIC ---

  // Helper to sync to background
  const syncToBackground = (payload: any) => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SET_STATE', payload });
    }
  };

  // Load state from background on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'GET_STATE' }, (state) => {
        if (chrome.runtime.lastError) return;

        if (state) {
          if (state.currentRoom) {
            console.log('Restoring room from background:', state.currentRoom);
            setCurrentRoom(state.currentRoom);
            joinRoom(state.currentRoom.code);
          }
          if (state.roundStarted !== undefined) setRoundStarted(state.roundStarted);
          if (state.timeRemaining !== undefined && state.timeRemaining !== null) setTimeRemaining(state.timeRemaining);
          if (state.userProfile) {
            setUserProfile(state.userProfile);
            setLoggedIn(true);
          }
          // Restore problem list message if it exists
          if (state.problemList && state.problemList.length > 0 && state.currentRoom) {
            addMessage({
              userHandle: 'System',
              data: `Round started!\nProblems: ${state.problemList.join(', ')}`,
              roomID: state.currentRoom.code,
              isSystem: true
            });
          }
        }
      });
    }
  }, []);

  // Sync user profile when it changes (doesn't conflict with navigation)
  useEffect(() => {
    if (userProfile) {
      syncToBackground({ userProfile });
    }
  }, [userProfile]);

  // Handle Exit - Clear state
  const handleExit = () => {
    // Clear local state
    setCurrentRoom(null);
    setLoggedIn(false);
    setRoundStarted(false);
    setTimeRemaining(null);
    setUserProfile(null);

    // Clear background state
    syncToBackground({
      currentRoom: null,
      roundStarted: false,
      timeRemaining: null,
      userProfile: null
    });
  };

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
                  await SignInWithChromeIdentity()
                  if (typeof chrome !== 'undefined' && chrome.identity) {
                    chrome.identity.getAuthToken({ interactive: false }, async (tokenResult) => {
                      if (chrome.runtime.lastError) {
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
                    const randomSuffix = Math.floor(Math.random() * 10000);
                    setUserProfile({
                      id: `dev-user-${randomSuffix}@example.com`,
                      name: `Dev User ${randomSuffix}`,
                      avatarUrl: ''
                    })
                    setLoggedIn(true)
                  }
                } catch (err) {
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
        useBackend={true}
      />
    )
  }

  const participants: Participant[] = currentRoom.options?.participants || []

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
            {/* Larger Exit button with red hover effect, matching Start Round font style */}
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
                src={userProfile?.avatarUrl}
                alt={userProfile?.name}
                className="w-10 h-10 rounded-full border-2 shadow-lg"
                style={{ borderColor: 'hsl(var(--primary))' }}
              />
            )}
          </div>
        </header>

        {/* START ROUND BUTTON - CENTRIC DISPLAY BELOW HEADER */}
        {/* START ROUND BUTTON - CENTRIC DISPLAY BELOW HEADER */}
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
