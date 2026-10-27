import { create } from 'zustand';

interface ProblemCountFilters {
    difficulties: string;
    tags: string[];
    companies: string[];
    blind75: boolean;
    neetcode150: boolean;
    recentlyAsked: boolean;
    excludePaid: boolean;
}

// Canonical cache key for a filter combination - sorts tags/companies so the same
// set of selections always maps to the same key regardless of the order they were
// picked in (e.g. selecting "Google" then "Meta" caches under the same key as
// "Meta" then "Google").
export function buildProblemCountKey(filters: ProblemCountFilters): string {
    const sortedTags = [...filters.tags].sort().join(',');
    const sortedCompanies = [...filters.companies].sort().join(',');
    return [
        filters.difficulties,
        sortedTags,
        sortedCompanies,
        filters.blind75 ? '1' : '0',
        filters.neetcode150 ? '1' : '0',
        filters.recentlyAsked ? '1' : '0',
        filters.excludePaid ? '1' : '0',
    ].join('|');
}

interface ProblemCountStoreState {
    counts: Record<string, number>;
    getCount: (key: string) => number | undefined;
    setCount: (key: string, count: number) => void;
}

// Caches /problems/count results by filter combination for the life of the popup
// session, so re-selecting a combo the user already queried (e.g. toggling a
// company checkbox off then back on) shows the count instantly instead of
// re-hitting the network and waiting out the debounce again.
export const useProblemCountStore = create<ProblemCountStoreState>((set, get) => ({
    counts: {},
    getCount: (key) => get().counts[key],
    setCount: (key, count) => set((state) => ({ counts: { ...state.counts, [key]: count } })),
}));
