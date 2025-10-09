/*

  TODO:
    - remove create room                             -- done
    - make sign in buttons better color themes (when highlighted looks ugly)
    - send icon is squished                          -- done
    - remove logout                                  -- done
    - room code                                      -- done
    - exit/end game thing                            -- done
    - if i need space remove bsg logo
    - acm branding bottom of main screen    

*/

(function () {
  if (!/\/problems\//.test(location.pathname)) return;

  function waitForQDContent() {
    return new Promise(function (resolve) {
      const existing = document.querySelector('#qd-content');
      if (existing) return resolve(existing);
      const obs = new MutationObserver(function (_, o) {
        const el = document.querySelector('#qd-content');
        if (el) {
          o.disconnect();
          resolve(el);
        }
      });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    });
  }

  waitForQDContent().then(function (qd) {
    console.log('content rready');

    const wrapper = qd.parentElement;
    if (!wrapper) {
      console.warn('where parent');
      return;
    }

    Object.assign(wrapper.style, {
      display: 'flex',
      alignItems: 'flex-start',
      boxSizing: 'border-box',
    });

    Object.assign(qd.style, {
      flex: '1 1 auto',
      minWidth: '0',
    });

    const panelWrapper = document.createElement('div');
    panelWrapper.id = 'bsg-extension-wrapper';
    Object.assign(panelWrapper.style, {
      display: 'flex',
      alignItems: 'stretch',
      marginLeft: '8px',
      position: 'relative',
    });

    const panel = document.createElement('div');
    panel.id = 'bsg-extension-panel';
    Object.assign(panel.style, {
      width: '360px',
      height: `${qd.getBoundingClientRect().height}px`,
      backgroundColor: '#333333',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      overflow: 'hidden',
      boxSizing: 'border-box',
      transition: 'width 0.05s ease-out',
    });

    const iframe = document.createElement('iframe');
    iframe.id = 'bsg-extension-iframe';
    iframe.src = chrome.runtime.getURL('logIn.html');
    // requests clipboard permission for the iframe so the extension UI can use navigator.clipboard
    iframe.allow = 'clipboard-read; clipboard-write';
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
      border: 'none',
      display: 'block',
      borderRadius: '8px',
    });

    const handle = document.createElement('div');
    handle.id = 'bsg-extension-resize-handle';
    Object.assign(handle.style, {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '8px', 
      cursor: 'col-resize',
      zIndex: 1000,
      background: 'transparent',
      marginLeft: '1px',
      marginRight: '-6px',
      padding: '0',
    });

    const handleBar = document.createElement('div');
    Object.assign(handleBar.style, {
      width: '2px',
      height: '20px',
      backgroundColor: '#343434',
      borderRadius: '1px',
      transition: 'background-color 0.12s ease',
    });
    handle.appendChild(handleBar);



    panel.appendChild(iframe);
    panelWrapper.appendChild(panel);

    let isDragging = false;

    function beginDrag(e) {
      try {
        handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
      isDragging = true;
      // disable pointer events on iframe so parent receives pointer events while over iframe
      iframe.style.pointerEvents = 'none';
      handleBar.style.backgroundColor = '#3b82f6';
      handleBar.style.height = '100%';
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault && e.preventDefault();

      try {
        const rightEdge = panelWrapper.getBoundingClientRect().right;
        panel.style.width = `${rightEdge - e.clientX}px`;
      } catch (err) {
        // ignore
      }
    }

    function endDrag(e) {
      if (!isDragging) return;
      try {
        handle.releasePointerCapture && handle.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
      isDragging = false;
      iframe.style.pointerEvents = 'auto';
      handleBar.style.backgroundColor = '#343434';
      handleBar.style.height = '20px';
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    handle.addEventListener('pointerdown', beginDrag);

    // hover: show blue line while hovering (if not dragging)
    handle.addEventListener('pointerenter', () => {
      if (!isDragging) {
        handleBar.style.backgroundColor = '#3b82f6';
        handleBar.style.height = '100%';
      }
    });
    handle.addEventListener('pointerleave', () => {
      if (!isDragging) {
        handleBar.style.backgroundColor = '#343434';
        handleBar.style.height = '20px';
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const rightEdge = panelWrapper.getBoundingClientRect().right;

      const minWidth = 280;
      const maxWidth = 600;
      const newWidth = rightEdge - e.clientX;
      
      const boundedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
      panel.style.width = `${boundedWidth}px`;
    });

    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    function syncHandleHeight() {
      try {
        const rect = qd.getBoundingClientRect();
        handle.style.height = rect.height + 'px';
        handle.style.alignSelf = 'stretch';
      } catch (err) {
        // ignore
      }
    }

    syncHandleHeight();

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(syncHandleHeight);
      ro.observe(qd);
    }

    window.addEventListener('resize', syncHandleHeight);

    wrapper.appendChild(handle);
    wrapper.appendChild(panelWrapper);
    console.log('panel injected');
  });
})();
