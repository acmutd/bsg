chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'OFFSCREEN_COPY') return;
  const text = msg.text || '';

  (async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        sendResponse({ ok: true });
        return;
      }
    } catch (e) {
      console.warn('navigator.clipboard failed in offscreen:', e);
    }

    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      sendResponse({ ok: !!ok });
      return;
    } catch (e) {
      console.error('offscreen execCommand failed', e);
      sendResponse({ ok: false, err: String(e) });
      return;
    }
  })();

  return true; // indicate async response
});
