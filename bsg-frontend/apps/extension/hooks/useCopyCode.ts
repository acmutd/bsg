import { useState } from "react";

export function useCopyCode() {
    const [isCopied, setIsCopied] = useState<boolean>(false);

    function markCopied() {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }

    function doLocalCopy(roomCode: string) {
        const ta = document.createElement('textarea');
        ta.value = roomCode;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch {}
        ta.remove();
        markCopied();
    }

    // copy room code to clipboard (works in extension and locally)
    function copyRoomCode(roomCode: string) {
        if (!roomCode) return;
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
                chrome.runtime.sendMessage({ type: 'COPY_TO_CLIPBOARD', text: roomCode }, (resp) => {
                    if (resp?.ok) markCopied();
                    else doLocalCopy(roomCode);
                });
                return;
            }
        } catch {}
        doLocalCopy(roomCode);
    }

    return { copyRoomCode, isCopied };
}