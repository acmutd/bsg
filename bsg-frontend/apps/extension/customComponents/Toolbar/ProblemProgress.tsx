import { useEffect, useMemo, useState } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { useUserStore } from '@/stores/useUserStore';
import { useStatistics } from '@/hooks/useStatistics';
import { parseProblemSlug } from '@/hooks/useRoomEvents';

const GREEN = '#62AF2E';

/**
 * One segment per problem in the round: filled green when solved, green outline
 * for the one being worked on, grey outline for the rest.
 *
 * The round comes from the server rather than the room store. Round-start
 * navigates the active tab, which reloads the panel and wipes zustand, so the
 * store's `problems` is empty for most of a round's life.
 */
export const ProblemProgress = () => {
    const storeProblems = useRoomStore(s => s.problems);
    const userId = useUserStore(s => s.userId);
    const { roundDetails } = useStatistics();

    // Server first, store as the fallback before the first fetch lands.
    const problems = useMemo(() => {
        const fromServer = (roundDetails?.problems ?? []).map(p => p.slug).filter(Boolean);
        return fromServer.length > 0 ? fromServer : storeProblems;
    }, [roundDetails, storeProblems]);

    // round-details reports solved problems by numeric id, so go through the
    // round's own id -> slug map.
    const solvedSlugs = useMemo(() => {
        const slugs = new Set<string>();
        const solved = (userId && roundDetails?.solvedProblems?.[userId]) || [];
        if (solved.length === 0) return slugs;

        const slugById = new Map<number, string>();
        for (const problem of roundDetails?.problems ?? []) {
            slugById.set(problem.id, problem.slug);
        }
        for (const { problemId } of solved) {
            const slug = slugById.get(problemId);
            if (slug) slugs.add(slug);
        }
        return slugs;
    }, [userId, roundDetails]);

    // The tab's URL lives outside React, so subscribe rather than sample once.
    const [currSlug, setCurrSlug] = useState<string | null>(null);
    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.tabs) return;

        const sync = (url: string | undefined) => setCurrSlug(url ? parseProblemSlug(url) : null);
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => sync(tabs[0]?.url));

        const handleUpdated = (_id: number, change: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
            if (change.url && tab.active) sync(change.url);
        };
        chrome.tabs.onUpdated.addListener(handleUpdated);
        return () => chrome.tabs.onUpdated.removeListener(handleUpdated);
    }, []);

    if (problems.length === 0) return null;

    return (
        <div className="flex gap-[4.5px] px-2 py-1.5 shrink-0">
            {problems.map((slug, i) => {
                const isSolved = solvedSlugs.has(slug);
                const isCurrent = slug === currSlug;

                return (
                    <div
                        key={`${slug}-${i}`}
                        className={[
                            'h-1 flex-1 border-[0.5px] transition-colors',
                            i === 0 ? 'rounded-l-full' : '',
                            i === problems.length - 1 ? 'rounded-r-full' : '',
                        ].join(' ')}
                        style={{
                            backgroundColor: isSolved ? GREEN : 'transparent',
                            borderColor: isSolved || isCurrent ? GREEN : 'rgb(var(--foreground) / 0.25)',
                        }}
                    />
                );
            })}
        </div>
    );
};
