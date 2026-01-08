import React from 'react';
import { createRoot } from 'react-dom/client';
import DefaultPopup from './page.tsx';

const container = document.createElement('div');
container.id = 'my-extension-root';
document.body.appendChild(container);

Object.assign(container.style, {
  position: 'fixed',
  top: '0',
  right: '0',
  width: '30%',
  height: '100%',
  backgroundColor: '#000',
  zIndex: 9999,
  overflow: 'auto'
});

const root = createRoot(container);
root.render(<DefaultPopup />);