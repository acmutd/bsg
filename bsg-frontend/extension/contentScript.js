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

    // Create wrapper for panel + resize handle
    const panelWrapper = document.createElement('div');
    panelWrapper.id = 'bsg-extension-wrapper';
    Object.assign(panelWrapper.style, {
      display: 'flex',
      alignItems: 'stretch',
      position: 'relative',
    });

    // Create the main panel
    const panel = document.createElement('div');
    panel.id = 'bsg-extension-panel';
    Object.assign(panel.style, {
      width: '24rem',
      height: `${qd.getBoundingClientRect().height}px`,
      backgroundColor: '#262626',
      borderRadius: '8px',
      overflow: 'hidden',
      boxSizing: 'border-box',
      transition: 'width 0.05s ease-out',
    });

    // Create and style iframe early so handlers can reference it
    const iframe = document.createElement('iframe');
    iframe.id = 'bsg-extension-iframe';
    iframe.src = chrome.runtime.getURL('login-page.html');
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
      border: 'none',
      display: 'block',
      borderRadius: '8px',
    });

    // Create resize handle with larger hit area (we'll insert it between page content and panel)
    const handle = document.createElement('div');
    handle.id = 'bsg-extension-resize-handle';
    Object.assign(handle.style, {
      // keep handle in normal flow between qd and panel
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '0.5rem', // smaller hit area
      cursor: 'ew-resize',
      zIndex: 1000,
      background: 'transparent',
      padding: '0',
    });

    // Create visible handle bar centered inside the hit area
    const handleBar = document.createElement('div');
    Object.assign(handleBar.style, {
      width: '0.125rem',
      height: '1.25rem',
      backgroundColor: 'rgba(255, 255, 255, 0.14) #ffffff24',
      borderRadius: '1px',
      transition: 'background-color 0.12s ease',
    });

    /* Layout:
     * 
     * <wrapper>
     *     <qd/>
     *     <handle>
     *         <handleBar/>
     *     </handle>
     *     <panelWrapper>
     *         <panel>
     *             <iframe>
     *         </panel>
     *     </panelWrapper>
     * </wrapper>
     * 
     */

    handle.appendChild(handleBar);
    wrapper.appendChild(handle);
    panel.appendChild(iframe);
    panelWrapper.appendChild(panel);
    wrapper.appendChild(panelWrapper);

    // TODO: Handle window size change (vertical/horizontal)

    // Add resize functionality using pointer events and pointer capture
    function clampWidth(width) {
      const MIN_WIDTH = 36;
      const MAX_WIDTH = 900;
      return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width));
    }

    let isDragging = false;

    function beginDrag(e) {
      // Capture the pointer so we keep receiving events even if cursor leaves element
      try {
        handle.setPointerCapture && handle.setPointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
      isDragging = true;
      // disable pointer events on iframe so parent receives pointer events while over iframe
      iframe.style.pointerEvents = 'none';
      // show blue line when dragging/selected and expand height
      handleBar.style.backgroundColor = '#3b82f6';
      handleBar.style.height = '100%';
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault && e.preventDefault();

      // Immediately align panel left boundary with pointer so the visible bar is under cursor
      try {
        const rightEdge = panelWrapper.getBoundingClientRect().right;
        panel.style.width = `${clampWidth(rightEdge - e.clientX)}px`;
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

    // Use pointermove on window to follow pointer regardless of element under cursor
    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const rightEdge = panelWrapper.getBoundingClientRect().right;
      // left boundary = pointer x, width = rightEdge - pointerX
      panel.style.width = `${clampWidth(rightEdge - e.clientX)}px`;
    });

    // End drag on pointerup or when pointer leaves
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // Keep handle height in sync with the content area (qd)
    function syncHandleHeight() {
      try {
        const rect = qd.getBoundingClientRect();
        handle.style.height = rect.height + 'px';
        handle.style.alignSelf = 'stretch';
      } catch (err) {
        // ignore
      }
    }

    // Initial sync
    syncHandleHeight();

    // Observe qd for size changes
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(syncHandleHeight);
      ro.observe(qd);
    }

    // Also sync on window resize
    window.addEventListener('resize', syncHandleHeight);

    // append handle between existing page content and the panel wrapper
    console.log('panel injected with resize handle (handle placed between content and panel)');

    // Listen for auth state changes from extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'AUTH_STATE_CHANGED') {
        // Refresh the iframe to reflect new auth state
        iframe.src = iframe.src;
        sendResponse({ success: true });
      }

      if (message.type === "FOLD") {
        panel.style.width = "2.25rem";
      }

      if (message.type === "UNFOLD") {
        panel.style.width = "24rem";
      }

      if (message.type === "MAXIMIZE") {
        panel.style.width = `${window.innerWidth}px`;
      }

      if (message.type === "ACTIVE") {
        const activeTabset = tabsetLayout.querySelector('.flexlayout__tabset-active');

        if (!activeTabset) {
          console.log("active tabset not found");
          return;
        }

        // Remove active class and attach observer (changes to active tabset only)
        activeTabset.classList.remove("flexlayout__tabset-active");
        activeTabsetObserver.observe(activeTabset, {
          attributes: true,
          attributeFilter: ['class']
        });
        console.log("attatched activeTabsetObserver to: ", activeTabset);

        // Style panel
        panel.style.outline = "1px solid rgba(255, 255, 255, 0.22)";
        panel.style.outlineOffset = "-1px";
      }
    });

    // Inject interception script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    (document.head || document.documentElement).appendChild(script);
    script.onload = function () {
      script.remove();
    };

    // Listen for messages from injected script
    window.addEventListener('message', function (event) {
      // We only accept messages from ourselves
      if (event.source !== window || !event.data.type) return;

      if (event.data.type === 'BSG_LEETCODE_SUBMISSION') {
        chrome.runtime.sendMessage({
          type: 'SUBMISSION_PENDING',
          data: event.data.payload
        });
      }

      if (event.data.type === 'BSG_LEETCODE_RESULT') {
        chrome.runtime.sendMessage({
          type: 'SUBMISSION_RESULT',
          data: event.data.payload
        });
      }
    })

    // Handle LeetCode's Active Tab - Start

    // Parent of all tabsets and tabs
    const tabsetLayout = document.querySelector('.flexlayout__layout');
    if (!tabsetLayout) console.log("tabset layout not found");

    const removeActive = () => {
      activeTabsetObserver.disconnect();
      panel.style.removeProperty('outline');
      panel.style.removeProperty('outline-offset');
    }

    tabsetLayout.addEventListener('mousedown', (e) => {
      let tabset;
      const tab = e.target.closest('.flexlayout__tab');
      
      // Find matching tabset with corresponding data-layout-path
      if (tab) {
        const tabPath = tab.dataset.layoutPath;
        const tabsetPath = tabPath?.split('/').slice(0, -1).join('/');
        tabset = tabsetLayout.querySelector(
          `.flexlayout__tabset[data-layout-path="${tabsetPath}"]`
        );
      } else {
        tabset = e.target.closest('.flexlayout__tabset');
      }
      
      if (tabset) {
        removeActive();
        tabset.classList.add('flexlayout__tabset-active');
      }
    });

    // Watch for new tabsets being added
    const newTabsetObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          
          if (node.matches('.flexlayout__tabset, .flexlayout__tab')) {
            removeActive();
          }
        });
      });
    });

    // Only observe added and removed nodes from LeetCode tabset layout
    newTabsetObserver.observe(tabsetLayout, {
      childList: true,
      attributes: false,
      characterData: false
    });

    // Watch for LeetCode re-adding active class to tabsets
    const activeTabsetObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class' &&
          mutation.target.classList.contains('flexlayout__tabset-active')
        ) {
          mutation.target.classList.remove('flexlayout__tabset-active');
        }
      });
    });

    // Handle LeetCode's Active Tab - End

  });
})();