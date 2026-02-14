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
            obs.observe(document.documentElement, {childList: true, subtree: true});
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

        // Create wrapper for panel + resize handle
        const panelWrapper = document.createElement('div');
        panelWrapper.id = 'bsg-extension-wrapper';
        Object.assign(panelWrapper.style, {
            display: 'flex',
            alignItems: 'stretch',
            marginLeft: '8px',
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

        // Create and style iframe early so handlers can reference it
        const iframe = document.createElement('iframe');
        iframe.id = 'bsg-extension-iframe';
        iframe.src = chrome.runtime.getURL('logIn.html');
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
            // keep handle in normal flow between qd and panelWrapper
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '8px', // smaller hit area
            cursor: 'col-resize',
            zIndex: 1000,
            background: 'transparent',
            marginLeft: '1px',
            marginRight: '-6px', // overlap slightly onto the panel side
            padding: '0',
        });

        // Create visible handle bar centered inside the hit area
        const handleBar = document.createElement('div');
        Object.assign(handleBar.style, {
            width: '2px',
            height: '20px',
            backgroundColor: '#343434',
            borderRadius: '1px',
            transition: 'background-color 0.12s ease',
        });
        handle.appendChild(handleBar);


        // Assemble the components
        panel.appendChild(iframe);
        // Insert handle between the page content (qd) and the injected panel
        // wrapper currently contains qd; append handle then panelWrapper so the order is: qd, handle, panel
        panelWrapper.appendChild(panel);

        // Add resize functionality using pointer events and pointer capture
        const MIN_WIDTH = 325;
        const MAX_WIDTH = 900;

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
                let newWidth = rightEdge - e.clientX;
                newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));
                panel.style.width = `${newWidth}px`;
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
            let newWidth = rightEdge - e.clientX;

            // Clamp width
            newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth));

            panel.style.width = `${newWidth}px`;
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
        wrapper.appendChild(handle);
        wrapper.appendChild(panelWrapper);
        console.log('panel injected with resize handle (handle placed between content and panel)');

        // Listen for auth state changes from extension
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'AUTH_STATE_CHANGED') {
                console.log('Auth state changed, refreshing iframe:', message.user);

                // Refresh the iframe to reflect new auth state
                iframe.src = iframe.src;

                sendResponse({success: true});
            }
        });
    });
})();

