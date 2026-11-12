import { useMemo } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import type { RoundDetails } from '@/hooks/useStatistics';
import { problemUrl } from '@/hooks/useRoomEvents';
import { useTouchedProblems } from '@/hooks/useTouchedProblems';

const GREEN = '#62AF2E';
const YELLOW = '#ffa500';
const GREY = 'rgb(var(--foreground) / 0.25)';

type SegmentState = 'solved' | 'active' | 'touched' | 'untouched';

// Fill means the user put work in, stroke alone means they did not.
const SEGMENT_STYLE: Record<SegmentState, { fill: string; stroke: string }> = {
    solved:    { fill: GREEN,         stroke: GREEN },  // accepted submission
    active:    { fill: 'transparent', stroke: GREEN },  // open in the tab now
    touched:   { fill: YELLOW,        stroke: YELLOW }, // typed in, left unsolved
    untouched: { fill: 'transparent', stroke: GREY },   // never typed in
};

interface ProblemProgressProps {
    problems: string[];
    currSlug: string | null;
    roundDetails: RoundDetails | null;
    canNavigate: boolean; // round has started; Toolbar owns this so the bar and the arrows share one rule
}

/** One segment per problem in the round. */
export const ProblemProgress = ({ problems, currSlug, roundDetails, canNavigate }: ProblemProgressProps) => {
    const userId = useUserStore(s => s.userId);
    const touchedSlugs = useTouchedProblems();

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

    // Active outranks touched, so a problem goes yellow only once the user moves
    // on from it, and returns to green the moment they come back.
    const segmentState = (slug: string): SegmentState => {
        if (solvedSlugs.has(slug)) return 'solved';
        if (slug === currSlug) return 'active';
        if (touchedSlugs.has(slug)) return 'touched';
        return 'untouched';
    };

    if (problems.length === 0) return null;

    return (
        <div className="flex gap-[4.5px] px-2 shrink-0">
            {problems.map((slug, i) => {
                const { fill, stroke } = SEGMENT_STYLE[segmentState(slug)];
                const isCurrent = slug === currSlug;
                const isClickable = canNavigate && !isCurrent; // both must be true: round started AND not the problem already open

                return (
                    <button
                        key={`${slug}-${i}`}
                        type="button"
                        aria-label={`Go to problem ${i + 1}`}
                        aria-current={isCurrent ? 'step' : undefined}
                        disabled={!isClickable} // current problem is skipped so a click can't reload away unsaved code
                        onClick={() => window.open(problemUrl(slug), '_top')}
                        className={`group flex-1 py-1.5 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`} // padding widens the 4px bar into a hittable target
                    >
                        <div
                            className={[
                                'h-1 w-full border-[0.5px] transition-[background-color,border-color,opacity]',
                                isClickable ? 'group-hover:!border-white/70' : '', // white border on hover signals the segment is clickable; ! beats the inline borderColor
                                i === 0 ? 'rounded-l-full' : '',
                                i === problems.length - 1 ? 'rounded-r-full' : '',
                            ].join(' ')}
                            style={{ backgroundColor: fill, borderColor: stroke }}
                        />
                    </button>
                );
            })}
        </div>
    );
};
