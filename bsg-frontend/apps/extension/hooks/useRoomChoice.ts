import {useEffect, useMemo, useState} from "react";
import { getServerUrl } from '@/lib/config';
import { useProblemCountStore, buildProblemCountKey } from '@/stores/useProblemCountStore';

type ProblemTagStat = {
    id: number;
    tag: string;
    totalCount: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
}

type ProblemCompanyStat = {
    id: number;
    company: string;
    totalCount: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
}

type RoomActionResult = { success: true } | { success: false; message: string }

type TopicDifficultyCounts = {
    total: number;
    easy: number;
    medium: number;
    hard: number;
}

// Drives the create-room filter wizard. The join form lives in useJoinRoom
// instead, so pages that only join don't pay for this hook's filter fetches.
export const useRoomChoice = (props: {
    onCreate?: (roomCode: string, options: { easy: number; medium: number; hard: number; duration: number; tags: string[]; companies: string[]; blind75: boolean; neetcode150: boolean; recentlyAsked: boolean; excludePaid: boolean; anyDifficulty: boolean; anyDifficultyCount: number }) => Promise<RoomActionResult>
} = {}) => {
    const [numberOfEasyProblems, setNumberOfEasyProblems] = useState(1)
    const [numberOfMediumProblems, setNumberOfMediumProblems] = useState(0)
    const [numberOfHardProblems, setNumberOfHardProblems] = useState(0)
    const [anyDifficulty, setAnyDifficulty] = useState(false)
    const [anyDifficultyCount, setAnyDifficultyCount] = useState(1)
    const [duration, setDuration] = useState(30)
    const [total, setTotal] = useState(1)
    const minNumberOfProblems = 0
    const maxNumberOfProblems = 10

    const [topics, setTopics] = useState<string[]>([])
    // Full per-difficulty breakdown, kept so the dropdown counts can follow the
    // difficulty selection. topicCounts (derived below) is what consumers read.
    const [topicStats, setTopicStats] = useState<Record<string, TopicDifficultyCounts>>({})
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])
    const [companies, setCompanies] = useState<string[]>([])
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
    const [blind75, setBlind75] = useState(false)
    const [neetcode150, setNeetcode150] = useState(false)
    const [recentlyAsked, setRecentlyAsked] = useState(false)
    const [excludePaid, setExcludePaid] = useState(true)
    const [availableCount, setAvailableCount] = useState<number | null>(null)
    const [isLoadingFilter, setIsLoadingFilter] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)

    // Recently asked only means anything relative to a selected company, so keep it
    // in sync when the last company is removed (the UI also disables its checkbox).
    useEffect(() => {
        if (selectedCompanies.length === 0 && recentlyAsked) {
            setRecentlyAsked(false)
        }
    }, [selectedCompanies, recentlyAsked]);

    useEffect(() => {
        const loadTopics = async (attempt = 0): Promise<void> => {
            try {
                const response = await fetch(`${getServerUrl()}/problems/tags`, {
                    credentials: 'include'
                });

                if (response.status === 429 && attempt < 3) {
                    const delay = 1000 * Math.pow(2, attempt);
                    await new Promise(r => setTimeout(r, delay));
                    return loadTopics(attempt + 1);
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch topics: ${response.status}`);
                }

                const payload = await response.json();
                const stats: ProblemTagStat[] = payload?.data || [];
                setTopics(stats.map((stat) => stat.tag));
                setTopicStats(Object.fromEntries(stats.map((stat) => [stat.tag, {
                    total: stat.totalCount,
                    easy: stat.easyCount,
                    medium: stat.mediumCount,
                    hard: stat.hardCount,
                }])));
            } catch (error) {
                console.error('Failed to load tag stats', error);
                setTopics([]);
                setTopicStats({});
            }
        };

        void loadTopics();
    }, []);

    useEffect(() => {
        const loadCompanies = async (attempt = 0): Promise<void> => {
            try {
                const response = await fetch(`${getServerUrl()}/problems/companies`, {
                    credentials: 'include'
                });

                if (response.status === 429 && attempt < 3) {
                    const delay = 1000 * Math.pow(2, attempt);
                    await new Promise(r => setTimeout(r, delay));
                    return loadCompanies(attempt + 1);
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch companies: ${response.status}`);
                }

                const payload = await response.json();
                const stats: ProblemCompanyStat[] = payload?.data || [];
                setCompanies(stats.map((stat) => stat.company));
            } catch (error) {
                console.error('Failed to load company stats', error);
                setCompanies([]);
            }
        };

        void loadCompanies();
    }, []);

    // Live count of problems matching the current filters - shown on the Create/Next
    // button so users see the pool shrink (and can see it hit 0) instead of hitting a
    // round-creation error after submitting. Restricted to whichever difficulty levels
    // currently have a non-zero count (e.g. only "easy" when easy=1/medium=0/hard=0);
    // Any Difficulty drops the difficulty restriction entirely, counting across all of
    // them. Not capped by how many problems are being requested - this is the size of
    // the pool, not a preview of what would be created.
    // Debounced so rapid combobox typing/toggling doesn't spam the endpoint.
    const activeDifficulties = anyDifficulty
        ? ''
        : [
            numberOfEasyProblems > 0 ? 'easy' : null,
            numberOfMediumProblems > 0 ? 'medium' : null,
            numberOfHardProblems > 0 ? 'hard' : null,
        ].filter(Boolean).join(',')

    // How many problems the round will actually ask for. Compared against
    // availableCount to catch requests the backend would reject outright (e.g.
    // 4 problems requested from a tag that only has 1 match).
    const requestedTotal = anyDifficulty
        ? anyDifficultyCount
        : numberOfEasyProblems + numberOfMediumProblems + numberOfHardProblems

    // Counts shown next to each topic in the dropdown, narrowed to the active
    // difficulties - a topic whose problems are all the wrong difficulty reads
    // as (0) instead of advertising problems this round can't use.
    const topicCounts = useMemo(() => {
        const active = activeDifficulties ? activeDifficulties.split(',') : []
        return Object.fromEntries(
            Object.entries(topicStats).map(([tag, stat]) => {
                if (active.length === 0) return [tag, stat.total]
                let count = 0
                if (active.includes('easy')) count += stat.easy
                if (active.includes('medium')) count += stat.medium
                if (active.includes('hard')) count += stat.hard
                return [tag, count]
            })
        ) as Record<string, number>
    }, [topicStats, activeDifficulties])

    useEffect(() => {
        const cacheKey = buildProblemCountKey({
            difficulties: activeDifficulties,
            tags: selectedTopics,
            companies: selectedCompanies,
            blind75,
            neetcode150,
            recentlyAsked,
            excludePaid,
        })

        // Read the cache imperatively (not via the reactive selector) so this
        // effect isn't re-run every time some other filter combo gets cached -
        // it only cares about the one key it just computed.
        const cached = useProblemCountStore.getState().getCount(cacheKey)
        if (cached !== undefined) {
            setAvailableCount(cached)
            setIsLoadingFilter(false)
            return
        }

        // Not cached - a request will actually go out (after the debounce below).
        // Cover the whole span with "loading" so the Create/Next button can't be
        // clicked against a count that's about to change.
        setIsLoadingFilter(true)

        const controller = new AbortController()
        const timeout = setTimeout(async () => {
            try {
                const params = new URLSearchParams()
                if (activeDifficulties) params.set('difficulties', activeDifficulties)
                if (selectedTopics.length > 0) params.set('tags', selectedTopics.join(','))
                if (selectedCompanies.length > 0) params.set('companies', selectedCompanies.join(','))
                if (blind75) params.set('blind75', 'true')
                if (neetcode150) params.set('neetcode150', 'true')
                if (recentlyAsked) params.set('recentlyAsked', 'true')
                if (excludePaid) params.set('excludePaid', 'true')

                const response = await fetch(`${getServerUrl()}/problems/count?${params.toString()}`, {
                    credentials: 'include',
                    signal: controller.signal
                })

                if (!response.ok) {
                    throw new Error(`Failed to fetch available count: ${response.status}`)
                }

                const payload = await response.json()
                const count = typeof payload?.data === 'number' ? payload.data : null
                setAvailableCount(count)
                setIsLoadingFilter(false)
                if (count !== null) {
                    useProblemCountStore.getState().setCount(cacheKey, count)
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Failed to load available problem count', error)
                    setIsLoadingFilter(false)
                }
                // AbortError means a newer filter change already superseded this
                // request - that newer effect run owns isLoadingFilter now, so
                // leave it alone here to avoid clearing a still-in-flight load.
            }
        }, 300)

        return () => {
            clearTimeout(timeout)
            controller.abort()
        }
    }, [activeDifficulties, selectedTopics, selectedCompanies, blind75, neetcode150, recentlyAsked, excludePaid])

    const decrement = (setter: (v: number) => void, val: number) => {
        if (total <= 1 || val <= minNumberOfProblems) return
        setter(val - 1)
        setTotal(total - 1)
    }

    const increment = (setter: (v: number) => void, val: number) => {
        if (total >= maxNumberOfProblems) return
        setter(val + 1)
        setTotal(total + 1)
    }

    const handleCreateRoom = () => {
        if (!props.onCreate) return
        setFormError(null)
        // When "Any difficulty" is checked, the per-difficulty counts are irrelevant -
        // send zeros for those and the any-difficulty count instead, so the backend
        // sees one unambiguous mode.
        const roomSettings = {
            easy: anyDifficulty ? 0 : numberOfEasyProblems,
            medium: anyDifficulty ? 0 : numberOfMediumProblems,
            hard: anyDifficulty ? 0 : numberOfHardProblems,
            duration,
            tags: selectedTopics,
            companies: selectedCompanies,
            blind75,
            neetcode150,
            recentlyAsked,
            excludePaid,
            anyDifficulty,
            anyDifficultyCount: anyDifficulty ? anyDifficultyCount : 0,
        }
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let code = ''
        for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
        setIsSubmittingCreate(true)
        props.onCreate(code, roomSettings)
            .then((result) => {
                if (!result.success) {
                    setFormError(result.message)
                }
            })
            .finally(() => setIsSubmittingCreate(false))
    }

    // Restores every filter to its pristine default - used by the create-room
    // wizard's Reset button.
    const resetFilters = () => {
        setNumberOfEasyProblems(1)
        setNumberOfMediumProblems(0)
        setNumberOfHardProblems(0)
        setTotal(1)
        setAnyDifficulty(false)
        setAnyDifficultyCount(1)
        setSelectedTopics([])
        setSelectedCompanies([])
        setBlind75(false)
        setNeetcode150(false)
        setRecentlyAsked(false)
        setExcludePaid(false)
        setDuration(30)
        setFormError(null)
    }

    return {
        numberOfEasyProblems,
        numberOfMediumProblems,
        numberOfHardProblems,
        setNumberOfEasyProblems,
        setNumberOfMediumProblems,
        setNumberOfHardProblems,
        anyDifficulty,
        setAnyDifficulty,
        anyDifficultyCount,
        setAnyDifficultyCount,
        increment,
        decrement,
        topics,
        topicCounts,
        selectedTopics,
        setSelectedTopics,
        companies,
        selectedCompanies,
        setSelectedCompanies,
        blind75,
        setBlind75,
        neetcode150,
        setNeetcode150,
        recentlyAsked,
        setRecentlyAsked,
        excludePaid,
        setExcludePaid,
        availableCount,
        isLoadingFilter,
        requestedTotal,
        duration,
        setDuration,
        handleCreateRoom,
        resetFilters,
        formError,
        setFormError,
        isSubmittingCreate,
    }
}
