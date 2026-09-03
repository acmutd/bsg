import {useEffect, useState} from "react";
import { getServerUrl } from '@/lib/config';

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

export const useRoomChoice = (props: {
    onJoin: (roomCode: string) => Promise<RoomActionResult>,
    onCreate: (roomCode: string, options: { easy: number; medium: number; hard: number; duration: number; tags: string[]; companies: string[] }) => Promise<RoomActionResult>
}) => {
    const [joinCode, setJoinCode] = useState('')
    const [showCreateOptions, setShowCreateOptions] = useState(false)

    const [numberOfEasyProblems, setNumberOfEasyProblems] = useState(1)
    const [numberOfMediumProblems, setNumberOfMediumProblems] = useState(0)
    const [numberOfHardProblems, setNumberOfHardProblems] = useState(0)
    const [duration, setDuration] = useState(30)
    const [total, setTotal] = useState(1)
    const minNumberOfProblems = 0
    const maxNumberOfProblems = 10

    const [topics, setTopics] = useState<string[]>([])
    const [topicCounts, setTopicCounts] = useState<Record<string, number>>({})
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])
    const [companies, setCompanies] = useState<string[]>([])
    const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
    const [formError, setFormError] = useState<string | null>(null)
    const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)
    const [isSubmittingJoin, setIsSubmittingJoin] = useState(false)

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
                setTopicCounts(Object.fromEntries(stats.map((stat) => [stat.tag, stat.totalCount])));
            } catch (error) {
                console.error('Failed to load tag stats', error);
                setTopics([]);
                setTopicCounts({});
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
        setFormError(null)
        const roomSettings = {
            easy: numberOfEasyProblems,
            medium: numberOfMediumProblems,
            hard: numberOfHardProblems,
            duration,
            tags: selectedTopics,
            companies: selectedCompanies,
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

    const handleJoinRoom = () => {
        setFormError(null)
        if (!joinCode.trim()) return
        setIsSubmittingJoin(true)
        props.onJoin(joinCode.trim())
            .then((result) => {
                if (!result.success) {
                    setFormError(result.message)
                }
            })
            .finally(() => setIsSubmittingJoin(false))
    }

    return {
        setShowCreateOptions,
        showCreateOptions,
        numberOfEasyProblems,
        numberOfMediumProblems,
        numberOfHardProblems,
        setNumberOfEasyProblems,
        setNumberOfMediumProblems,
        setNumberOfHardProblems,
        increment,
        decrement,
        topics,
        topicCounts,
        selectedTopics,
        setSelectedTopics,
        companies,
        selectedCompanies,
        setSelectedCompanies,
        duration,
        setDuration,
        handleCreateRoom,
        handleJoinRoom,
        joinCode,
        setJoinCode,
        formError,
        setFormError,
        isSubmittingCreate,
        isSubmittingJoin,
    }
}
