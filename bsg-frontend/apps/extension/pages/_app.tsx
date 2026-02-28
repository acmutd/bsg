import '../../../packages/ui-styles/global.css';
import type { AppProps } from 'next/app';
import '@bsg/ui-styles/global.css';
import { Poppins } from 'next/font/google';
import DefaultPopup from './defaultPopup';
import { TabBar } from '@bsg/components/tabBar';
import { Sidebar } from '@bsg/components/sidebar';
import { useIsCollapsed } from '@/hooks/useIsCollapsed';
import { useState } from 'react';

const poppins = Poppins({ weight: '400', subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {

  const isDefaultPopup = (Component === DefaultPopup);
  const isCollapsed = useIsCollapsed();
  const [isHovered, setIsHovered] = useState(false);

  // Redirect popup render

  if (isDefaultPopup) {
    return (
      <div className={poppins.className}>
        <Component  {...pageProps} />
      </div>
    );
  }

  // On Leetcode extension render

  return isCollapsed ? (
    <Sidebar />
  ) : (
    //<div className={poppins.className}>
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex flex-col h-screen"
    >
      <TabBar isHovered={isHovered} isInRoom={true} />
      <div className="flex-1 overflow-auto">
        <Component {...pageProps} />
      </div>
    </div>
  );
};
