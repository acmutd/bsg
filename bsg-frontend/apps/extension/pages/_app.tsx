import '../../../packages/ui-styles/global.css'
import Logo from '@bsg/components/Logo'
import { useState, useRef, useEffect } from 'react'
import type { AppProps } from 'next/app'
import '@bsg/ui-styles/global.css';
import {Poppins} from 'next/font/google'
import { Button } from '@bsg/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDiscord, faGithub, faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faPaperPlane, faSmile } from '@fortawesome/free-solid-svg-icons'

const poppins = Poppins({weight: '400', subsets: ['latin'], variable: '--poppins'})

export default function App({ Component, pageProps }: AppProps) {

  return (
        <div className={poppins.className}>
            <Component {...pageProps} />
        </div>

  )
}
