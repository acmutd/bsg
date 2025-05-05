(function() {
    if (!/\/problems\//.test(location.pathname)) return;
  
    function waitForQDContent() {
      return new Promise(function(resolve) {
        const existing = document.querySelector('#qd-content');
        if (existing) return resolve(existing);
        const obs = new MutationObserver(function(_, o) {
          const el = document.querySelector('#qd-content');
          if (el) {
            o.disconnect();
            resolve(el);
          }
        });
        obs.observe(document.documentElement, { childList: true, subtree: true });
      });
    }
  
    waitForQDContent().then(function(qd) {
      console.log('[BSG] #qd-content ready, injecting panel into two-column layout');
  
      const wrapper = qd.parentElement;
      if (!wrapper) {
        console.warn('[BSG] parent of #qd-content not found');
        return;
      }

      Object.assign(wrapper.style, {
        display:       'flex',
        alignItems:    'flex-start',
        boxSizing:     'border-box',
      });
  
      Object.assign(qd.style, {
        flex:      '1 1 auto',
        minWidth:  '0',
      });
  
      const panel = document.createElement('div');
      panel.id = 'bsg-extension-panel';
      Object.assign(panel.style, {
        flex:             '0 0 360px',
        marginLeft:       '24px',
        height:           `${qd.getBoundingClientRect().height}px`,
        backgroundColor:  '#262626',
        border:           '1px solid rgba(255,255,255,0.1)',
        borderRadius:     '8px',
        boxShadow:        '0 4px 12px rgba(0,0,0,0.5)',
        overflow:         'hidden',
        boxSizing:        'border-box',
      });
  
      const iframe = document.createElement('iframe');
      iframe.src = chrome.runtime.getURL('logIn.html');
      Object.assign(iframe.style, {
        width:         '100%',
        height:        '100%',
        border:        'none',
        display:       'block',
        borderRadius:  '8px',
      });
      panel.appendChild(iframe);
  
      wrapper.appendChild(panel);
      console.log('[BSG] panel injected to the right of #qd-content');
    });
  })();
  