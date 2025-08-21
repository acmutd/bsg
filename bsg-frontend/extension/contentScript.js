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
      console.log('content rready');
  
      const wrapper = qd.parentElement;
      if (!wrapper) {
        console.warn('where parent');
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
  
      // Create wrapper for panel + resize handle
      const panelWrapper = document.createElement('div');
      panelWrapper.id = 'bsg-extension-wrapper';
      Object.assign(panelWrapper.style, {
        display: 'flex',
        alignItems: 'stretch',
        marginLeft: '10px',
        position: 'relative',
      });

      // Create the main panel
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

      // Create resize handle with larger hit area
      const handle = document.createElement('div');
      handle.id = 'bsg-extension-resize-handle';
      Object.assign(handle.style, {
        position: 'absolute',
        left: '-10px',
        top: 0,
        bottom: 0,
        width: '100px', // Wider invisible hit area
        cursor: 'col-resize',
        zIndex: 1000,
      });

      // Create visible handle bar
      const handleBar = document.createElement('div');
      Object.assign(handleBar.style, {
        position: 'absolute',
        left: '9px', // Centered in the wider hit area
        top: '0',
        bottom: '0',
        width: '2px',
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: '1px',
        transition: 'background-color 0.15s ease',
      });
      handle.appendChild(handleBar);

      // Add resize functionality
      let isResizing = false;
      let startX, startWidth;
      const MIN_WIDTH = 320;
      const MAX_WIDTH = 800;

      // Track the resize state globally to handle fast mouse movements
      const resizeState = {
        active: false,
        lastX: 0,
        currentWidth: 360
      };

      function updatePanelWidth(mouseX) {
        // Just adjust width by how far the mouse moved
        const mouseDelta = resizeState.lastX - mouseX;
        resizeState.lastX = mouseX;
        
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeState.currentWidth + mouseDelta));
        panel.style.width = `${newWidth}px`;
        resizeState.currentWidth = newWidth;
      }

      // Only use handle for initiating the drag
      handle.addEventListener('mousedown', (e) => {
        resizeState.active = true;
        resizeState.lastX = e.clientX;
        resizeState.currentWidth = panel.getBoundingClientRect().width;
        handleBar.style.backgroundColor = 'rgba(255,255,255,0.6)';
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
      });

      // Global mouse move handler - no hit testing, just use mouse position
      document.addEventListener('mousemove', (e) => {
        if (!resizeState.active) return;
        // No hit testing here - just use the mouse position directly
        updatePanelWidth(e.clientX);
      });

      // Global mouse up handler
      document.addEventListener('mouseup', (e) => {
        if (!resizeState.active) return;
        
        // Force final width calculation based on mouse position
        const panelRect = panel.getBoundingClientRect();
        const finalDelta = e.clientX - resizeState.initialX;
        let finalWidth = resizeState.initialWidth - finalDelta;
        
        // Ensure we respect min/max bounds
        finalWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, finalWidth));
        
        // Force update the panel width one last time
        panel.style.width = `${finalWidth}px`;
        resizeState.currentWidth = finalWidth;
        
        // Reset state
        resizeState.active = false;
        handleBar.style.backgroundColor = 'rgba(255,255,255,0.3)';
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      });

      // Handle edge case where mouse leaves window during resize
      document.addEventListener('mouseleave', () => {
        if (resizeState.active) {
          resizeState.active = false;
          handleBar.style.backgroundColor = 'rgba(255,255,255,0.3)';
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
        }
      });

      // Create and style iframe
      const iframe = document.createElement('iframe');
      iframe.src = chrome.runtime.getURL('logIn.html');
      Object.assign(iframe.style, {
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
        borderRadius: '8px',
      });

      // Assemble the components
      panel.appendChild(iframe);
      panelWrapper.appendChild(handle);
      panelWrapper.appendChild(panel);
  
      wrapper.appendChild(panelWrapper);
      console.log('panel injected with resize handle');
    });
  })();
  