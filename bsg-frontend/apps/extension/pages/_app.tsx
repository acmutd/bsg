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
import DefaultPopup from './defaultPopup';

const poppins = Poppins({ weight: '400', subsets: ['latin'] })


export default function App({ Component, pageProps }: AppProps) {

    const isDefaultPopup = Component === DefaultPopup;
    
    if(isDefaultPopup){
        <div className={poppins.className}>
            <Component  {...pageProps} />
        </div> 
    }

  return (
    //TODO: Implement scrollbar code here
    <div className={poppins.className}>
      <Component  {...pageProps} />
    </div>

  )

}
