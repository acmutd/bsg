import {useEffect, useMemo, useState} from "react";
import { getServerUrl } from '@/lib/config';

type ProblemListEntry = {
    id: number;
    name: string;
    slug: string;
}

type RoomActionResult = { success: true } | { success: false; message: string }

// Mirrors MaxHandPickedProblems in central-service - the backend rejects rounds
// above this, so the picker stops the user before they get there.
export const MAX_CHOSEN_PROBLEMS = 10

// Backs the create-room "Choose" tab, where problems are hand-picked instead of
// described with filters. Loads the (cached, trimmed) problem catalogue once and
// filters it client-side, since the combobox caps how many items it renders.
export const useProblemPicker = (props: {
    onCreate?: (roomCode: string, options: { duration: number; problemIds: number[] }) => Promise<RoomActionResult>
} = {}) => {
    const [problems, setProblems] = useState<ProblemListEntry[]>([])
    const [isLoadingProblems, setIsLoadingProblems] = useState(true)
    const [selectedProblems, setSelectedProblems] = useState<string[]>([])
    const [duration, setDuration] = useState(30)
    const [formError, setFormError] = useState<string | null>(null)
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)

    useEffect(() => {
        const controller = new AbortController()

        const loadProblems = async (attempt = 0): Promise<void> => {
            try {
                const response = await fetch(`${getServerUrl()}/problems/list`, {
                    credentials: 'include',
                    signal: controller.signal
                });

                if (response.status === 429 && attempt < 3) {
                    const delay = 1000 * Math.pow(2, attempt);
                    await new Promise(r => setTimeout(r, delay));
                    return loadProblems(attempt + 1);
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch problems: ${response.status}`);
                }

                const payload = await response.json();
                setProblems(payload?.data || []);
                setIsLoadingProblems(false);
            } catch (error) {
                if ((error as Error).name === 'AbortError') return;
                console.error('Failed to load problem list', error);
                setProblems([]);
                setIsLoadingProblems(false);
            }
        };

        void loadProblems();
        return () => controller.abort();
    }, []);

    // Problem names carry a unique constraint, so they work directly as combobox
    // values and only need mapping back to ids at submit time.
    const problemNames = useMemo(() => problems.map((problem) => problem.name), [problems])
    const idsByName = useMemo(
        () => new Map(problems.map((problem) => [problem.name, problem.id])),
        [problems]
    )

    // Silently ignores anything past the cap rather than letting the selection
    // grow into a request the backend would reject.
    const selectProblems = (names: string[]) => {
        setSelectedProblems(names.slice(0, MAX_CHOSEN_PROBLEMS))
    }

    const handleCreateRoom = () => {
        if (!props.onCreate) return
        setFormError(null)

        const problemIds = selectedProblems
            .map((name) => idsByName.get(name))
            .filter((id): id is number => typeof id === 'number')

        if (problemIds.length === 0) return

        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let code = ''
        for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))

        setIsSubmittingCreate(true)
        props.onCreate(code, {duration, problemIds})
            .then((result) => {
                if (!result.success) {
                    setFormError(result.message)
                }
            })
            .finally(() => setIsSubmittingCreate(false))
    }

    const resetSelection = () => {
        setSelectedProblems([])
        setDuration(30)
        setFormError(null)
    }

    return {
        problemNames,
        isLoadingProblems,
        selectedProblems,
        selectProblems,
        duration,
        setDuration,
        handleCreateRoom,
        resetSelection,
        formError,
        setFormError,
        isSubmittingCreate,
    }
}
