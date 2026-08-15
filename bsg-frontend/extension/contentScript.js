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

  waitForQDContent().then(async function (qd) {
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

    // Panel width is stored as a fraction of the window width so it grows and
    // shrinks proportionally when the window is resized horizontally (matching
    // how LeetCode's own panels behave).
    const MIN_PANEL_WIDTH = 36;
    // Below this width the panel is not usable, so snap it to the 2.25rem sidebar.
    const COLLAPSE_WIDTH = 200;
    // Guarantees Unfold expands past the collapse threshold even on small windows.
    const MIN_EXPAND_WIDTH = COLLAPSE_WIDTH + 40;
    let panelFolded = false;
    let panelMaximized = false;
    let preMaximizeFraction = 0.25;
    let panelWidthFraction = 0.25;

    const initPanelWidth = async () => {
      const result = await chrome.storage.local.get(["panelWidth", "panelWidthFraction", "isPanelFolded", "isPanelMaximized", "preMaximizeFraction"]);

      const isPanelFolded = result.isPanelFolded ?? false;
      if (result.isPanelFolded === undefined) chrome.storage.local.set({ isPanelFolded: false });
      panelFolded = isPanelFolded;
      panelMaximized = result.isPanelMaximized === true;
      if (typeof result.preMaximizeFraction === 'number' && result.preMaximizeFraction > 0) {
        preMaximizeFraction = result.preMaximizeFraction;
      }

      if (typeof result.panelWidthFraction === 'number' && result.panelWidthFraction > 0) {
        panelWidthFraction = result.panelWidthFraction;
      } else {
        // Back-compat: derive a fraction from the previously stored absolute width
        const legacy = result.panelWidth ?? '24rem';
        const rem = parseFloat(legacy);
        const px = (Number.isFinite(rem) && rem > 0 ? rem * 16 : 384);
        panelWidthFraction = Math.max(0.05, Math.min(1, px / window.innerWidth));
        chrome.storage.local.set({ panelWidthFraction: panelWidthFraction });
      }

      const expandedPx = Math.round(panelWidthFraction * window.innerWidth);
      if (isPanelFolded || expandedPx <= COLLAPSE_WIDTH) {
        panelFolded = true;
        return `${MIN_PANEL_WIDTH / 16}rem`;
      }
      return `${expandedPx / 16}rem`;
    }

    // Apply a pixel width to the panel without persisting anything.
    function applyPanelWidth(px) {
      const widthPx = Math.max(MIN_PANEL_WIDTH, Math.min(window.innerWidth, px));
      panel.style.width = `${widthPx}px`;
      return widthPx;
    }

    // The single decision point for panel width: if the requested width is too
    // narrow to be usable, snap to the 2.25rem sidebar instead of leaving the
    // layout squeezed in the dead zone between 36px and COLLAPSE_WIDTH.
    function requestWidth(px) {
      if (px <= COLLAPSE_WIDTH) {
        setPanelWidth(MIN_PANEL_WIDTH, true);
      } else {
        setPanelWidth(px, false);
      }
    }

    // Set the panel width (pixels) and persist it as a window-relative fraction.
    // When folding, the last expanded fraction is preserved so Unfold can restore it.
    function setPanelWidth(px, isFolded) {
      panelFolded = !!isFolded;
      const widthPx = isFolded ? applyPanelWidth(MIN_PANEL_WIDTH) : applyPanelWidth(px);
      if (!isFolded) {
        panelWidthFraction = Math.min(1, widthPx / window.innerWidth);
        // A manual resize (drag) exits the maximized state
        if (widthPx < window.innerWidth - 1) {
          panelMaximized = false;
        }
      }
      chrome.storage.local.set({
        isPanelFolded: !!isFolded,
        isPanelMaximized: panelMaximized,
        panelWidthFraction: panelWidthFraction,
        panelWidth: isFolded ? '24rem' : `${widthPx}px`,
      });
    }

    // Keep the panel width proportional to the window on horizontal resizes.
    function syncPanelWidth() {
      if (panelFolded) return;
      requestWidth(Math.round(panelWidthFraction * window.innerWidth));
    }

    // Create the main panel
    const panel = document.createElement('div');
    panel.id = 'bsg-extension-panel';
    Object.assign(panel.style, {
      width: await initPanelWidth(),
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
    const DARK_HANDLE = '#343434';
    const LIGHT_HANDLE = '#d4d4d4';
    const handleBar = document.createElement('div');
    Object.assign(handleBar.style, {
      width: '0.125rem',
      height: '1.25rem',
      backgroundColor: DARK_HANDLE,
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

    // --- Theme detection and sync ---
    const DARK_BG = '#262626';
    const LIGHT_BG = '#ffffff';

    function getResolvedTheme() {
      const stored = localStorage.getItem('lc-theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function sendThemeToIframe(theme) {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'BSG_THEME_UPDATE', theme: theme }, '*');
      }
      panel.style.backgroundColor = theme === 'light' ? LIGHT_BG : DARK_BG;
    }

    function syncTheme() {
      chrome.storage.local.get(['themePreference'], (result) => {
        const pref = result.themePreference;
        if (pref && pref !== 'auto') {
          sendThemeToIframe(pref);
        } else {
          sendThemeToIframe(getResolvedTheme());
        }
      });
    }

    iframe.addEventListener('load', syncTheme);

    // Observe LeetCode's <html> class changes (theme toggle updates class)
    const themeObserver = new MutationObserver(() => {
      chrome.storage.local.get(['themePreference'], (result) => {
        if (!result.themePreference || result.themePreference === 'auto') {
          sendThemeToIframe(getResolvedTheme());
        }
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Listen for system theme preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      chrome.storage.local.get(['themePreference'], (result) => {
        if (!result.themePreference || result.themePreference === 'auto') {
          sendThemeToIframe(getResolvedTheme());
        }
      });
    });

    // Listen for manual theme changes from extension settings
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.themePreference) {
        syncTheme();
      }
    });

    // TODO: Handle window size change (vertical/horizontal)

    // Add resize functionality using pointer events and pointer capture
    function clampWidth(width) {
      return Math.max(MIN_PANEL_WIDTH, Math.min(window.innerWidth, width));
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
        const widthPx = clampWidth(rightEdge - e.clientX);
        requestWidth(widthPx);
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
      handleBar.style.height = '20px';
      chrome.storage.local.get(['themePreference'], (r) => {
        const pref = r.themePreference;
        const isLight = pref === 'light' || (!pref && !window.matchMedia('(prefers-color-scheme: dark)').matches);
        handleBar.style.backgroundColor = isLight ? LIGHT_HANDLE : DARK_HANDLE;
      });
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
        handleBar.style.height = '20px';
        chrome.storage.local.get(['themePreference'], (r) => {
          const pref = r.themePreference;
          const isLight = pref === 'light' || (!pref && !window.matchMedia('(prefers-color-scheme: dark)').matches);
          handleBar.style.backgroundColor = isLight ? LIGHT_HANDLE : DARK_HANDLE;
        });
      }
    });

    // Use pointermove on window to follow pointer regardless of element under cursor
    window.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const rightEdge = panelWrapper.getBoundingClientRect().right;
      // left boundary = pointer x, width = rightEdge - pointerX
      const widthPx = clampWidth(rightEdge - e.clientX);
      requestWidth(widthPx);
    });

    // End drag on pointerup or when pointer leaves
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    function syncHandleHeight() {
      try {
        const rect = qd.getBoundingClientRect();
        const height = rect.height + 'px';
        if (handle.style.height !== height) {
          handle.style.height = height;
        }
        if (handle.style.alignSelf !== 'stretch') {
          handle.style.alignSelf = 'stretch';
        }

        const panelHeight = Math.max(0, Math.min(rect.height, window.innerHeight)) + 'px';
        if (panel.style.height !== panelHeight) {
          panel.style.height = panelHeight;
        }
      } catch (err) {
        // ignore
      }
    }

    // Initial sync
    syncHandleHeight();

    // Observe qd for size changes (covers LeetCode layout changes too).
    if (window.ResizeObserver) {
      let frameId = null;
      const ro = new ResizeObserver(() => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }
        frameId = requestAnimationFrame(() => {
          frameId = null;
          syncHandleHeight();
          if (!isDragging) syncPanelWidth();
        });
      });
      ro.observe(qd);
    }

    // Also sync on window resize (handle height + proportional panel width)
    let resizeFrame = null;
    window.addEventListener('resize', () => {
      if (resizeFrame !== null) cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = null;
        syncHandleHeight();
        syncPanelWidth();
      });
    });

    // append handle between existing page content and the panel wrapper

    // Listen for auth state changes from extension
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'AUTH_STATE_CHANGED') {
        // Refresh the iframe to reflect new auth state
        iframe.src = iframe.src;
        sendResponse({ success: true });
      }

      if (message.type === "FOLD") {
        setPanelWidth(MIN_PANEL_WIDTH, true);
      }

      if (message.type === "UNFOLD") {
        chrome.storage.local.get(["panelWidthFraction"]).then((result) => {
          if (typeof result.panelWidthFraction === 'number' && result.panelWidthFraction > 0) {
            panelWidthFraction = result.panelWidthFraction;
          }
          panelFolded = false;
          chrome.storage.local.set({ isPanelFolded: false });
          const target = Math.max(MIN_EXPAND_WIDTH, Math.round(panelWidthFraction * window.innerWidth));
          requestWidth(target);
        });
      }

      if (message.type === "MAXIMIZE") {
        if (!panelMaximized) {
          // Remember the current size so we can restore it on toggle
          preMaximizeFraction = panelWidthFraction;
          panelFolded = false;
          panelMaximized = true;
          panelWidthFraction = 1;
          chrome.storage.local.set({ isPanelFolded: false, isPanelMaximized: true, preMaximizeFraction: preMaximizeFraction });
          requestWidth(window.innerWidth);
        } else {
          // Restore the size from before maximizing
          panelFolded = false;
          panelMaximized = false;
          panelWidthFraction = preMaximizeFraction;
          chrome.storage.local.set({ isPanelFolded: false, isPanelMaximized: false });
          requestWidth(Math.max(MIN_EXPAND_WIDTH, Math.round(preMaximizeFraction * window.innerWidth)));
        }
      }

      if (message.type === "ACTIVE") {
        if (panelActive) return;
        panelActive = true;

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
        }).catch(() => {});
      }

      if (event.data.type === 'BSG_LEETCODE_RESULT') {
        chrome.runtime.sendMessage({
          type: 'SUBMISSION_RESULT',
          data: event.data.payload
        }).catch(() => {});
      }
    })

    // Handle LeetCode's Active Tab - Start

    let panelActive = false;

    // Parent of all tabsets and tabs
    const tabsetLayout = document.querySelector('.flexlayout__layout');
    if (!tabsetLayout) console.log("tabset layout not found");

    // Remove scrollbar overflowing from tabs (purely visual)
    const initialTabs = tabsetLayout.querySelectorAll('.flexlayout__tab');
    initialTabs.forEach(tab => tab.style.clipPath = 'inset(0 round 8px)');

    const removeActive = () => {
      panelActive = false;
      activeTabsetObserver.disconnect();
      chrome.runtime.sendMessage({ type: 'NOT_ACTIVE' }).catch(() => {});
    }

    document.body.addEventListener('mousedown', (e) => {
      let target = e.target;
      let tabset;

      // If click is on a popper, find the element underneath
      const popper = target.closest('[data-radix-popper-content-wrapper]');
      if (popper) {
        popper.style.visibility = 'hidden';
        target = document.elementFromPoint(e.clientX, e.clientY);
        popper.style.visibility = 'visible';
      }

      // Get tabset from either tab path or direct closest
      const tab = target?.closest('.flexlayout__tab');
      if (tab) {
        // Find matching tabset with corresponding data-layout-path
        const tabPath = tab.dataset.layoutPath;
        const tabsetPath = tabPath?.split('/').slice(0, -1).join('/');
        tabset = tabsetLayout.querySelector(`.flexlayout__tabset[data-layout-path="${tabsetPath}"]`);
      } else {
        tabset = target?.closest('.flexlayout__tabset');
      }

      if (tabset) {
        removeActive();
        tabset.classList.add('flexlayout__tabset-active');
      }
    });

    // Watch for new tab and tabsets being added
    const newTabObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          if (node.classList.contains('flexlayout__tabset')) {
            removeActive();
          }
          
          if (node.classList.contains('flexlayout__tab')) {
            // Style tabs as they are added
            node.style.clipPath = 'inset(0 round 8px)';
            removeActive();
          }
        });
      });
    });

    // TODO: Oberserve when flexlayout__tabset-active is assigned to a new panel

    // Only observe added and removed nodes from LeetCode tabset layout
    newTabObserver.observe(tabsetLayout, {
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