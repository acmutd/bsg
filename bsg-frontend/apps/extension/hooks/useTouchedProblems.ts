import { useEffect, useState } from 'react';

const TOUCHED_KEY = 'touchedSlugs';

const EMPTY: string[] = [];

/**
 * Slugs the user has written code in during the current round, mirrored from
 * chrome.storage.session.
 *
 * The background worker owns the writes (content scripts are untrusted contexts
 * and cannot reach storage.session); this only reads. Subscribing to
 * storage.onChanged rather than polling means a problem turns yellow the instant
 * the user navigates away, instead of waiting out the 15s useStatistics cycle
 * that feeds the solved state.
 */
export function useTouchedProblems(): Set<string> {
    const [touched, setTouched] = useState<Set<string>>(() => new Set());

    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.storage?.session) return;

        // A round reset can land between this read and its callback, so drop the
        // result if we're already unmounted rather than resurrecting stale slugs.
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

        chrome.storage.onChanged.addListener(handleChanged);
        return () => {
            cancelled = true;
            chrome.storage.onChanged.removeListener(handleChanged);
        };
    }, []);

    return touched;
}
