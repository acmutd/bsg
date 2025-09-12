import '../../../packages/ui-styles/global.css'
import Logo from '@bsg/components/Logo'
import { useState, useRef, useEffect } from 'react'
import type { AppProps } from 'next/app'
import '@bsg/ui-styles/global.css';
import { Poppins } from 'next/font/google'
import { Button } from '@bsg/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDiscord, faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faPaperPlane, faSmile, faCopy } from '@fortawesome/free-solid-svg-icons'

const poppins = Poppins({ weight: '400', subsets: ['latin'], variable: '--poppins' })

export default function App({ Component, pageProps }: AppProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [messages, setMessages] = useState<string[]>([
    'Welcome to BSG Chat!',
    'YAARRRRG, this be a demo.',
  ])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // generate a simple 10-char alphanumeric room code when user logs in
  useEffect(() => {
    if (loggedIn && !roomCode) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let code = ''
      for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
      setRoomCode(code)
    }
  }, [loggedIn, roomCode])

  // copy room code to clipboard
  function copyRoomCode() {
    if (!roomCode) return
    // prefers extension background/offscreen document to write the clipboard
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'COPY_TO_CLIPBOARD', text: roomCode }, (resp) => {
          const ok = resp && resp.ok
          if (ok) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            return
          }
          // fallback to navigator/execCommand below
          doLocalCopy()
        })
        return
      }
    } catch (e) {
      console.warn('chrome.runtime not available for copy, falling back', e)
    }

    doLocalCopy()
  }

  function doLocalCopy() {
    const tryExecCommandFallback = () => {
      try {
        const ta = document.createElement('textarea')
        ta.value = roomCode
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.select()
        try { document.execCommand('copy') } catch (e) { console.error('execCommand copy failed', e) }
        ta.remove()
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {
        console.error('local copy fallback failed', e)
      }
    }

    const canUseClipboardAPI = async () => {
      try {
        if (typeof navigator.permissions !== 'undefined' && typeof (navigator.permissions as any).query === 'function') {
          // some browsers don't support 'clipboard-write' permission name
          try {
            const p = await (navigator.permissions as any).query({ name: 'clipboard-write' })
            if (p && p.state === 'denied') return false
          } catch (e) {
            // permission query may throw for unsupported names — ignore
          }
        }
        const fp = (document as any).featurePolicy || (document as any).policy || null
        if (fp && typeof fp.allowsFeature === 'function') {
          try {
            if (!fp.allowsFeature('clipboard-write')) return false
          } catch (e) {
            // ignore
          }
        }
        return true
      } catch (e) {
        return true
      }
    }

    canUseClipboardAPI().then((ok) => {
      if (!ok) {
        tryExecCommandFallback()
        return
      }

      navigator.clipboard.writeText(roomCode).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {
        tryExecCommandFallback()
      })
    }).catch(() => {
      tryExecCommandFallback()
    })
  }

  // scrolling implemented?!?!
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  function sendMessage() {
    const text = inputRef.current?.value.trim()
    if (!text) return

    // console.log('typed:', text)
    setMessages((msgs) => [...msgs, `You: ${text}`])
    // clear input
    inputRef.current!.value = ''
  }

  if (!loggedIn) {
    return (
      <div className={`${poppins.className} min-h-screen bg-[#262626] flex items-center justify-center px-4 py-8`}>
        <div className="bg-[#333333] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md p-8 pt-16 space-y-8" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 1.5px 8px rgba(88,101,242,0.12)' }}>
          <div className="flex justify-center mb-2">
            <span className="text-5xl font-extrabold tracking-wide text-white drop-shadow-lg">BSG_</span>
          </div>
          <div className="flex flex-col justify-center items-center gap-y-4">
            <Button
              onClick={() => setLoggedIn(true)}
              className={
                'w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white bg-[#000000] hover:scale-105 hover:bg-[#222222] focus:ring-2 focus:ring-offset-1 focus:ring-gray-800 transition-transform duration-150 outline-none focus:outline-none'
              }
            >
              <FontAwesomeIcon icon={faGithub} />
              <span className="">Sign in with Github</span>
            </Button>
            <Button
              onClick={() => setLoggedIn(true)}
              className={
                'w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white bg-[#1c71e8] hover:scale-105 hover:bg-[#0e68e6] focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 transition-transform duration-150 outline-none focus:outline-none'
              }
            >
              <FontAwesomeIcon icon={faGoogle} />
              <span className="">Sign in with Google</span>
            </Button>
            <Button
              onClick={() => setLoggedIn(true)}
              className={
                'w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-white bg-[#5865F2] hover:scale-105 hover:bg-[#4752c4] focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 transition-transform duration-150 outline-none focus:outline-none'
              }
            >
              <FontAwesomeIcon icon={faDiscord} />
              <span className="">Sign in with Discord</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#262626]">
      <header className="bg-[#1e1e1f] border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        {/* <div> */}
        <div className="flex flex-col items-start">
          <div className="text-xs text-gray-300 mb-1">Room Code:</div>
          <div className="bg-gray-700 text-white p-2 rounded-lg font-mono text-lg tracking-widest flex items-center space-x-2">
            <div className="text-2xl font-semibold">{roomCode}</div>
            <button onClick={copyRoomCode} aria-label="Copy room code" className="p-1 rounded hover:bg-gray-600">
              <FontAwesomeIcon icon={faCopy} className="text-gray-200 text-sm" />
            </button>
            {copied && <div className="text-xs text-green-400 ml-2">copied</div>}
          </div>
          {/* </div> */}
        </div>
        {/* <div className={poppins.className}>
            <Component {...pageProps} />
        </div> */}
        <Button
          onClick={() => setLoggedIn(false)}
          className="bg-gray-700 text-white rounded-md px-3 py-1 hover:bg-gray-600"
        >
          Exit
        </Button>
      </header>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg, i) => (
          <div key={i} className="flex">
            <div
              className={`${msg.startsWith('You:')
                ? 'bg-green-600 self-end'
                : 'bg-gray-700 self-start'
                } text-white p-2 rounded-lg max-w-xs`}
            >
              {msg}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1e1e1f] border-t border-gray-700 px-4 py-3 flex items-center space-x-2">
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-600 overflow-visible">
          <FontAwesomeIcon icon={faSmile} className="text-gray-300 text-lg transform scale-100" />
        </button>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          className="flex-1 bg-[#2a2a2a] text-white rounded-full px-4 py-2 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage()
            }
          }}
        />
        <button
          onClick={sendMessage}
          className="w-8 h-8 flex items-center justify-center bg-green-500 rounded-full hover:bg-green-600"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="text-white" style={{ transform: 'translateX(-1px)' }} />
        </button>
      </div>
    </div>
  )
}
