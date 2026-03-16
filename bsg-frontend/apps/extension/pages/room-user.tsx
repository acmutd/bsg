"use client"
import { useState, useRef, useEffect } from 'react'
import type { AppProps } from 'next/app'
import {Poppins} from 'next/font/google'
import { Button } from '@bsg/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faSmile, faCopy } from '@fortawesome/free-solid-svg-icons'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import RoomChoice from './room-choice'
import { useChatSocket } from '../hooks/useChatSocket'
import { SERVER_URL as API_URL } from '../lib/config'




interface User {
  id: string,
  name: string,
  email: string,
  photo?: string

}

type AuthProvider = 'google' | 'github'


const poppins = Poppins({ weight: '400', subsets: ['latin'] })
// DISCLAIMER: ALL CHANGES ON THIS FILE ARE VIBECODED BECAUSE FUCK FRONTEND
//             IT SEEMS TO WORK FUNCTIONALLY, JUST LOOKS VERY UGLY BUT WE'RE
//             DOING THE REDESIGN ANYWAYS SO IT WOULD HAVE TO BE CHANGED REGARDLESS
// Header Component with Timer
const RoomHeader = ({
  userProfile,
  roomCode,
  roundEndTime,
  onEndRound,
  onLogout,
  onCopy
}: {
  userProfile: any,
  roomCode: string | undefined,
  roundEndTime: number | null,
  onEndRound: () => void,
  onLogout: () => void,
  onCopy: (code: string) => void
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!roundEndTime) {
        setTimeLeft("");
        return;
    }

    const updateTimer = () => {
        const now = Date.now();
        const diff = roundEndTime - now;
        if (diff <= 0) {
            setTimeLeft("00:00");
        } else {
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [roundEndTime]);

  return (
    <header className="bg-[#1e1e1f] border-b border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <div className="text-xs text-gray-300 mb-1">Room Code:</div>
          <div className="bg-gray-700 text-white p-2 rounded-lg font-mono text-lg tracking-widest flex items-center space-x-2">
            <div className="text-xl font-semibold">{roomCode || '...'}</div>
            <button onClick={() => roomCode && onCopy(roomCode)} aria-label="Copy room code" className="p-1 rounded hover:bg-gray-600">
              <FontAwesomeIcon icon={faCopy} className="text-gray-200 text-sm" />
            </button>
          </div>
        </div>

        {/* Timer Display */}
        {roundEndTime && (
            <div className="ml-4 flex flex-col items-center bg-gray-800 px-4 py-1 rounded border border-gray-600">
                <span className="text-xs text-gray-400 uppercase tracking-widest">Time Left</span>
                <span className="text-xl font-mono text-yellow-500 font-bold">{timeLeft}</span>
            </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {userProfile && (
           <div className="flex items-center gap-2">
             <img src={userProfile.photo} alt={userProfile.name} title={userProfile.name}
               className="w-8 h-8 rounded-full border-2 border-green-500 object-cover" />
             <span className="hidden md:block text-gray-300 text-sm">{userProfile.name}</span>
           </div>
        )}
        <Button onClick={onLogout} className="bg-gray-700 text-white rounded-md px-3 py-1 hover:bg-gray-600">
          Exit
        </Button>
      </div>
    </header>
  );
};



export default function RedirectionToRoomScreen() {

  const [loggedIn, setLoggedIn] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<{ code: string, options?: any } | null>(null)
  const [copied, setCopied] = useState(false)
  const [user, SetUser] = useState(false)
  const [userProfile, setUserProfile] = useState<User | null>(null)



  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize WebSocket Hook
  const { messages, isConnected, joinRoom, sendChatMessage, clearMessages, lastGameEvent } = useChatSocket(userProfile?.id);

  const [roundEndTime, setRoundEndTime] = useState<number | null>(null);
  const [roundStarted, setRoundStarted] = useState(false);


  const [nextProblem, setNextProblem] = useState<string | null>(null);

  // Check storage for nextProblem state on mount and when extension opens
  useEffect(() => {
    const updateState = () => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['nextProblem'], (result) => {
                console.log("DEBUG EVENT: on mount chrome.storage.local.get nextProblem:", result.nextProblem);
                setNextProblem(result.nextProblem || null);
            });
        }
    };
    
    updateState();

    // Listen for changes (e.g. background script updates while popup is open)
    const listener = (changes: any, namespace: string) => {
        if (namespace === 'local' && changes.nextProblem) {
            console.log("DEBUG EVENT: chrome.storage.local nextProblem changed:", changes.nextProblem);
            setNextProblem(changes.nextProblem.newValue || null);
        }
    };

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(listener);
    }
    
    return () => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.removeListener(listener);
        }
    };
  }, []);

  useEffect(() => {
     console.log("DEBUG EVENT: React state nextProblem is now:", nextProblem);
  }, [nextProblem]);


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

    inputRef.current!.value = ''
  }
  

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  // Handle Game Events
  useEffect(() => {
    if (!lastGameEvent) return;

    if (lastGameEvent.type === 'round-start') {
       const data = lastGameEvent.data;
       let problems: string[] = [];

       if (data && typeof data === 'object' && data.startTime) {
           problems = data.problems || [];
       } else {
           const slugs = typeof data === 'string' ? data.split(',') : [];
           problems = slugs;
       }

       // Timer is room-based (already set on room create/restore) — don't reset it
       setRoundStarted(true);

       // Clear stale nextProblem state
       setNextProblem(null);
       if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
           chrome.storage.local.remove('nextProblem');
           if (chrome.action) chrome.action.setBadgeText({ text: "" });
       }

       if (problems.length > 0) {
           window.open(`https://leetcode.com/problems/${problems[0]}/`, '_top');
       }
    } else if (lastGameEvent.type === 'next-problem') {
        let eventData = lastGameEvent.data;
        if (typeof eventData === 'string') {
            try {
                eventData = JSON.parse(eventData);
            } catch (e) {
                console.error("Failed to parse next-problem data in component", e);
            }
        }
        
        console.log("DEBUG: Handling next-problem event", { eventData, userProfile });
        
        const { nextProblem, userHandle } = eventData;
        
        // userHandle from backend is AuthID. userProfile.id is AuthID.
        if (userProfile && (userHandle == userProfile.id)) {
             console.log("DEBUG: Redirecting to next problem", nextProblem);
             window.open(`https://leetcode.com/problems/${nextProblem}/`, '_top');
        } else {
             console.log("DEBUG: Not redirecting. ID mismatch or no profile.", { 
                 requiredHandle: userHandle, 
                 myId: userProfile?.id 
             });
        }
    } else if (lastGameEvent.type === 'round-end') {
        // Stay in the room — just exit round view, clear round chat and state
        setRoundStarted(false);

        setNextProblem(null);
        clearMessages();
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.remove('nextProblem');
            if (chrome.action) chrome.action.setBadgeText({ text: "" });
        }
    }
  }, [lastGameEvent, userProfile, currentRoom]);

  // join/create handlers
  const handleJoin = async (roomCode: string) => {
    try {
        const res = await fetch(`${API_URL}/rooms/${roomCode}/join`, {
            method: 'POST',
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to join');
        
        const room = data.data; 
        setCurrentRoom({ 
            code: room.id, 
            options: { 
                adminId: room.adminId,
                shortCode: room.shortCode,
                participants: [] 
            } 
        });
        joinRoom(room.id);
        
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
             chrome.storage.local.set({ activeRoomId: room.id });
             chrome.storage.local.remove('nextProblem');
             if (chrome.action) chrome.action.setBadgeText({ text: "" });
        }
    } catch(e) {
        console.error(e);
        alert("Failed to join room. Please check the ID.");
    }
  }

  const handleCreate = async (roomCode: string, options: any) => {
    try {
        // 1. Create Room
        const res = await fetch(`${API_URL}/rooms`, {
            method: 'POST',
            body: JSON.stringify({ roomName: roomCode, ttl: options.duration || 30 }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const roomId = data.data.id;
        const adminId = data.data.adminId;
        const shortCode = data.data.shortCode;

        // 2. Create Round
        const roundParams = {
            duration: options.duration || 30,
            numEasyProblems: options.easy || 0,
            numMediumProblems: options.medium || 0,
            numHardProblems: options.hard || 0
        };
        const roundRes = await fetch(`${API_URL}/rooms/${roomId}/rounds/create`, {
             method: 'POST',
             body: JSON.stringify(roundParams),
             headers: { 'Content-Type': 'application/json' },
             credentials: 'include'
        });
        if (!roundRes.ok) {
            const roundData = await roundRes.json();
            throw new Error(roundData.error || 'Failed to create round');
        }

        // 3. Join the room (so creator is in active users list)
        const joinRes = await fetch(`${API_URL}/rooms/${roomId}/join`, {
            method: 'POST',
            credentials: 'include'
        });
        if (!joinRes.ok) {
            const joinData = await joinRes.json();
            throw new Error(joinData.error || 'Failed to join room');
        }

        // 4. Update state and join WebSocket room
        setCurrentRoom({ code: roomId, options: { ...options, adminId, shortCode } });


        // Start room-level countdown from TTL
        const ttlMs = (options.duration || 30) * 60 * 1000;
        const roomEndTime = Date.now() + ttlMs;
        setRoundEndTime(roomEndTime);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
             chrome.storage.local.set({ activeRoomId: roomId, roundEndTime: roomEndTime });
             chrome.storage.local.remove('nextProblem');
             if (chrome.action) chrome.action.setBadgeText({ text: "" });
        }

        joinRoom(roomId);
    } catch (e) {
        console.error("Failed to create room/round", e);
        alert("Failed to create room. Please try again.");
    }
  }
  
  const handleStartRound = async () => {
      if (!currentRoom) return;
      try {
          // Try to start the round directly
          let res = await fetch(`${API_URL}/rooms/${currentRoom.code}/start`, {
              method: 'POST',
              credentials: 'include'
          });

          if (res.status === 404) {
              // No CREATED round — try creating one
              const opts = currentRoom.options || {};
              const roundParams = {
                  duration: opts.duration || 30,
                  numEasyProblems: opts.easy || 1,
                  numMediumProblems: opts.medium || 0,
                  numHardProblems: opts.hard || 0,
              };
              const createRes = await fetch(`${API_URL}/rooms/${currentRoom.code}/rounds/create`, {
                  method: 'POST',
                  body: JSON.stringify(roundParams),
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include'
              });
              if (!createRes.ok) {
                  const createData = await createRes.json();
                  const msg = createData.message || createData.error || '';
                  // "Round limit exceeded" means a non-ENDED round already exists — sync state from backend
                  if (createRes.status === 400 && msg.includes('limit exceeded')) {
                      const roomRes = await fetch(`${API_URL}/rooms/${currentRoom.code}`, { credentials: 'include' });
                      if (roomRes.ok) {
                          const roomData = await roomRes.json();
                          const rounds: any[] = roomData.data?.rounds || roomData.data?.Rounds || [];
                          const startedRound = rounds.find((r: any) => (r.Status || r.status) === 'started');
                          if (startedRound) {
                              // Round is already running — sync frontend state
                              setRoundStarted(true);
                              return;
                          }
                      }
                  }
                  throw new Error(msg || `Failed to create round: ${createRes.status}`);
              }
              res = await fetch(`${API_URL}/rooms/${currentRoom.code}/start`, {
                  method: 'POST',
                  credentials: 'include'
              });
          }

          if (!res.ok) {
              const data = await res.json();
              throw new Error(data.message || data.error || `Failed to start round: ${res.status}`);
          }
      } catch (e: any) {
          console.error("Failed to start round", e);
          alert(`Failed to start round: ${e.message}`);
      }
  }

  const handleEndRound = async () => {
      if (!currentRoom) return;
      console.log('Ending round for room:', currentRoom.code);
      try {
          const res = await fetch(`${API_URL}/rooms/${currentRoom.code}/end`, {
              method: 'POST',
              credentials: 'include'
          });
          const data = await res.json();
          if (!res.ok && res.status !== 404) {
              console.error('Failed to end round:', res.status, data);
              alert(`Failed to end round: ${data.error || res.status}`);
          } else {
              // 200: round ended normally. 404: room already gone (TTL fired) — leave room.
              console.log('End round response:', res.status, data);
              setRoundStarted(false);
      
              setNextProblem(null);
              if (res.status === 404) {
                  // Room deleted by TTL — fully reset
                  setRoundEndTime(null);
                  setCurrentRoom(null);
                  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                      chrome.storage.local.remove('roundEndTime');
                  }
              }
              // On success (200), stay in room — WS round-end event will clear messages
          }
      } catch (e: any) {
          console.error('Failed to end round (network error):', e);
          alert(`Failed to end round: ${e.message}`);
      }
  }

    useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (response) => {
        if (response?.success) {
          setUserProfile(response.user)
          setLoggedIn(true)
          checkActiveRoom();
        }
      })
    }
  }, [])

  const checkActiveRoom = async () => {
      try {
          const res = await fetch(`${API_URL}/rooms/active`, { credentials: 'include' });
          if (res.ok) {
              const data = await res.json();
              if (data.id || data.roomID) { // handle potentially different response structure
                  const roomId = data.id || data.roomID;
                  // Fetch room details to get round status
                  const roomRes = await fetch(`${API_URL}/rooms/${roomId}`, { credentials: 'include' });
                  if (roomRes.ok) {
                      const roomData = await roomRes.json();
                      const room = roomData.data;
                      console.log("CheckActiveRoom: Fetched room details", room);
                      setCurrentRoom({
                          code: room.id,
                          options: {
                              adminId: room.adminId,
                              shortCode: room.shortCode,
                              participants: [],
                              duration: room.ttl || 30
                          }
                      });

                      // Restore room-level timer from expiresAt
                      if (room.expiresAt) {
                          const endTime = new Date(room.expiresAt).getTime();
                          if (endTime > Date.now()) {
                              setRoundEndTime(endTime);
                              if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                                  chrome.storage.local.set({ roundEndTime: endTime });
                              }
                          }
                      }
                      
                      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                           console.log("CheckActiveRoom: Saving activeRoomId to storage", room.id);
                           chrome.storage.local.set({ activeRoomId: room.id }, () => {
                               console.log("CheckActiveRoom: Saved activeRoomId");
                           });
                      } else {
                          console.warn("CheckActiveRoom: chrome.storage.local not available");
                      }
                      
                      joinRoom(room.id);
                      
                      // Check for active round
                      console.log("CheckActiveRoom: Rounds:", room.rounds);
                      if (room.rounds && room.rounds.length > 0) {
                          // Find the most relevant round: prefer started > created > ended
                          const startedRound = room.rounds.find((r: any) => (r.Status || r.status) === "started");
                          const createdRound = room.rounds.find((r: any) => (r.Status || r.status) === "created");
                          const activeRound = startedRound || createdRound;
                          const status = activeRound ? (activeRound.Status || activeRound.status) : null;
                          console.log("CheckActiveRoom: Active round status:", status);
                          if (status === "started") {
                              setRoundStarted(true);
                      
                              const startTimeStr = activeRound.LastUpdatedTime || activeRound.lastUpdatedTime;
                              const startTime = new Date(startTimeStr).getTime();
                              const duration = activeRound.duration || activeRound.Duration;
                              const endTime = startTime + (duration * 60 * 1000);
                              if (endTime > Date.now()) {
                                  setRoundEndTime(endTime);
                                  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                                      chrome.storage.local.set({ roundEndTime: endTime });
                                  }
                              }
                          } else if (status === "created") {
                      
                          }
                      }
                  }
              }
          }
      } catch (e) {
          console.error("Failed to check active room", e);
      }
  }


// Show RoomChoice if logged in and not yet in a room
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

  const handleLeaveRoom = async () => {
      if (currentRoom) {
          try {
              await fetch(`${API_URL}/rooms/${currentRoom.code}/leave`, {
                  method: 'POST',
                  credentials: 'include'
              });
          } catch (e) {
              console.error('Error leaving room:', e);
          }
      }
      setCurrentRoom(null);
      setRoundStarted(false);
      setRoundEndTime(null);
      setNextProblem(null);
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove(['activeRoomId', 'roundEndTime', 'nextProblem']);
      }
  }

      if(currentRoom){
        
        const participants: User[] = currentRoom.options?.participants || []
        const isAdmin = userProfile && currentRoom.options?.adminId === userProfile.id;

        return (
        <div className="flex flex-col h-screen bg-[#262626]">
          <RoomHeader 
            userProfile={userProfile} 
            roomCode={currentRoom.options?.shortCode || currentRoom.code.substring(0, 8)} 
            roundEndTime={roundEndTime} 
            onEndRound={handleEndRound}
            onLogout={handleLeaveRoom}
            onCopy={copyRoomCode}
          />
          
          {/* Admin Controls Bar */}
          <div className="bg-gray-800 p-2 flex flex-col items-center gap-2 border-b border-gray-700">
               {/* Next Problem Button - Only visible when a problem is pending */}
              {nextProblem && (
                <button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-bold shadow-lg animate-pulse flex items-center justify-center gap-2"
                    onClick={() => {
                        window.open(`https://leetcode.com/problems/${nextProblem}/`, '_top');
                        setNextProblem(null);
                        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                            chrome.storage.local.remove('nextProblem');
                             if (chrome.action) chrome.action.setBadgeText({ text: "" });
                        }
                    }}
                >
                    next problem
                </button>
              )}
              
              {isAdmin && (
                  <>
                    {roundStarted ? (
                      <Button 
                        onClick={handleEndRound}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-md px-6 py-1"
                      >
                        End Round
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleStartRound}
                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-md px-6 py-1"
                      >
                        Start Round
                      </Button>
                    )}
                  </>
              )}
          </div>

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


