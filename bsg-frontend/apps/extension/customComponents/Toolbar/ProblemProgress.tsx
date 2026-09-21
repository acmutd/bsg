import { useEffect, useMemo, useState } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { useUserStore } from '@/stores/useUserStore';
import { useStatistics } from '@/hooks/useStatistics';
import { parseProblemSlug } from '@/hooks/useRoomEvents';
import { useTouchedProblems } from '@/hooks/useTouchedProblems';

const GREEN = '#62AF2E';
const YELLOW = '#ffa500';
const GREY = 'rgb(var(--foreground) / 0.25)';

type SegmentState = 'solved' | 'active' | 'touched' | 'untouched';

// Fill means the user put work in, stroke alone means they did not.
const SEGMENT_STYLE: Record<SegmentState, { fill: string; stroke: string }> = {
    solved:    { fill: GREEN,         stroke: GREEN },
    active:    { fill: 'transparent', stroke: GREEN },
    touched:   { fill: YELLOW,        stroke: YELLOW },
    untouched: { fill: 'transparent', stroke: GREY },
};

/**
 * One segment per problem in the round:
 *   solved     green fill     - accepted submission, from the server
 *   active     green outline  - the problem currently open in the tab
 *   touched    yellow fill    - code was written here, then left unsolved
 *   untouched  grey outline   - never written in, whether or not it was opened
 *
 * Active outranks touched, so a problem goes yellow only once the user has
 * actually moved on from it, and returns to green the moment they come back.
 *
 * The round comes from the server rather than the room store. Round-start
 * navigates the active tab, which reloads the panel and wipes zustand, so the
 * store's `problems` is empty for most of a round's life.
 */
export const ProblemProgress = () => {
    const storeProblems = useRoomStore(s => s.problems);
    const userId = useUserStore(s => s.userId);
    const { roundDetails } = useStatistics();
    const touchedSlugs = useTouchedProblems();

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

    const segmentState = (slug: string): SegmentState => {
        if (solvedSlugs.has(slug)) return 'solved';
        if (slug === currSlug) return 'active';
        if (touchedSlugs.has(slug)) return 'touched';
        return 'untouched';
    };

    if (problems.length === 0) return null;

    return (
        <div className="flex gap-[4.5px] px-2 py-1.5 shrink-0">
            {problems.map((slug, i) => {
                const { fill, stroke } = SEGMENT_STYLE[segmentState(slug)];

                return (
                    <div
                        key={`${slug}-${i}`}
                        className={[
                            'h-1 flex-1 border-[0.5px] transition-colors',
                            i === 0 ? 'rounded-l-full' : '',
                            i === problems.length - 1 ? 'rounded-r-full' : '',
                        ].join(' ')}
                        style={{ backgroundColor: fill, borderColor: stroke }}
                    />
                );
            })}
        </div>
    );
};
