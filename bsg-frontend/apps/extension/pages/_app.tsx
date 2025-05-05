import '../../../packages/ui-styles/global.css'
import Logo from '@bsg/components/Logo'
import { useState, useRef, useEffect } from 'react'
import type { AppProps } from 'next/app'
import '@bsg/ui-styles/global.css';
import {Poppins} from 'next/font/google'
import { Button } from '@bsg/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faPaperPlane, faSmile } from '@fortawesome/free-solid-svg-icons'

const poppins = Poppins({weight: '400', subsets: ['latin'], variable: '--poppins'})

export default function App({ Component, pageProps }: AppProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [messages, setMessages] = useState<string[]>([
    'Welcome to BSG Chat!',
    'YAARRRRG, this be a demo.',
  ])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // scrolling implemented?!?!
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  // help pls
  function sendMessage() {
    const text = inputRef.current?.value.trim()
    if (!text) return

    console.log('[BSG] User typed:', text)
    // 1) add the user’s message
    setMessages((msgs) => [...msgs, `You: ${text}`])
    // clear input
    inputRef.current!.value = ''
  }

  if (!loggedIn) {
    return (
      <div className={`${poppins.className} min-h-screen bg-[#262626] flex items-center justify-center px-4 py-8`}>
        <div className="bg-[#1e1e1f] border border-gray-700 rounded-lg shadow-lg w-full max-w-md p-8 space-y-6">
          <div className="flex justify-center">
            <Logo />
          </div>
          <Button
            onClick={() => setLoggedIn(true)}
            className={
              'w-full flex items-center justify-center space-x-2 ' +
              'bg-green-500 text-white rounded-md py-2 ' +
              'hover:bg-green-600 focus:ring-2 focus:ring-offset-1 focus:ring-green-400'
            }
          >
            <FontAwesomeIcon icon={faGoogle} />
            <span>Continue with Google</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#262626]">
      <header className="bg-[#1e1e1f] border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <Logo />
        <div className={poppins.className}>
            <Component {...pageProps} />
        </div>
        <Button
          onClick={() => setLoggedIn(false)}
          className="bg-gray-700 text-white rounded-md px-3 py-1 hover:bg-gray-600"
        >
          Logout
        </Button>
      </header>

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg, i) => (
          <div key={i} className="flex">
            <div
              className={`${
                msg.startsWith('You:')
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
        <button className="p-2 rounded-full hover:bg-gray-600">
          <FontAwesomeIcon icon={faSmile} className="text-gray-300" />
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
          className="p-2 bg-green-500 rounded-full hover:bg-green-600"
        >
          <FontAwesomeIcon icon={faPaperPlane} className="text-white" />
        </button>
      </div>
    </div>
  )
}
