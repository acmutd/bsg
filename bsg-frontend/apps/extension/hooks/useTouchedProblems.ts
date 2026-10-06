import { useEffect, useState } from 'react';

const TOUCHED_KEY = 'touchedSlugs';

const EMPTY: string[] = [];

/** Slugs the user wrote code in this round. Read-only; the worker owns writes. */
export function useTouchedProblems(): Set<string> {
    const [touched, setTouched] = useState<Set<string>>(() => new Set());

    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.storage?.session) return;

        // A round reset can land between this read and its callback; without this
        // an unmounted read would resurrect stale slugs.
        let cancelled = false;
        chrome.storage.session.get([TOUCHED_KEY], result => {
            if (!cancelled) setTouched(new Set(result[TOUCHED_KEY] ?? EMPTY));
        });

        const handleChanged = (
            changes: { [key: string]: chrome.storage.StorageChange },
            areaName: string,
        ) => {
            if (areaName !== 'session' || !changes[TOUCHED_KEY]) return;
            // newValue is undefined when the key is removed outright.
            setTouched(new Set(changes[TOUCHED_KEY].newValue ?? EMPTY));
        };

        // Event-driven, not polled: yellow lands the instant the user navigates,
        // rather than waiting out the 15s useStatistics cycle behind solved state.
        chrome.storage.onChanged.addListener(handleChanged);
        return () => {
            cancelled = true;
            chrome.storage.onChanged.removeListener(handleChanged);
        };
    }, []);

    return touched;
}
