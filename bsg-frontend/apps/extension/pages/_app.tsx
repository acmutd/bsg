// pages/_app.tsx
import '../../../packages/ui-styles/global.css'
import logo from '../../../packages/ui-styles/assets/bsgLogo.png'
import Image from 'next/image'
import type { AppProps } from 'next/app'
import { Button } from '@bsg/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'

export default function App({ Component, pageProps }: AppProps) {
  return (
    // match LeetCode dark background RGB(26,26,26)
    <div className="min-h-screen bg-[#262626] flex items-center justify-center px-4 py-8">
      {/* dark card */}
      <div className="bg-[#1e1e1f] border border-gray-700 rounded-lg shadow-lg w-full max-w-md p-8 space-y-6">
        {/* logo */}
        <div className="flex justify-center">
          <Image
            src={logo.src}
            alt="BSG"
            width={64}
            height={64}
            className="rounded-full"
          />
        </div>

        {/* Google button—green variant */}
        <Button
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
