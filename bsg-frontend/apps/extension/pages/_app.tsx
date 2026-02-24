import '../../../packages/ui-styles/global.css'
import type {AppProps} from 'next/app'
import '@bsg/ui-styles/global.css';
import {Poppins} from 'next/font/google'
import DefaultPopup from './defaultPopup';

const poppins = Poppins({weight: '400', subsets: ['latin']})

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
