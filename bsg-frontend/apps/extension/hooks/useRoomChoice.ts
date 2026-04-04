import {useEffect, useState} from "react";
import {Topic} from "@/pages/room-choice-page";
import { SERVER_URL } from '../lib/config';

type ProblemTagStat = {
    id: number;
    tag: string;
    totalCount: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
}

export const useRoomChoice = (props: { onJoin: any, onCreate: any }) => {
    const [joinCode, setJoinCode] = useState('')
    const [showCreateOptions, setShowCreateOptions] = useState(false)

    const [numberOfEasyProblems, setNumberOfEasyProblems] = useState(1)
    const [numberOfMediumProblems, setNumberOfMediumProblems] = useState(0)
    const [numberOfHardProblems, setNumberOfHardProblems] = useState(0)
    const [duration, setDuration] = useState(30)
    const [total, setTotal] = useState(1)
    const minNumberOfProblems = 0
    const maxNumberOfProblems = 10

    const [topics, setTopics] = useState<Topic[]>([])

    useEffect(() => {
        const loadTopics = async () => {
            try {
                const response = await fetch(`${SERVER_URL}/problems/tags`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch topics: ${response.status}`);
                }

                const payload = await response.json();
                const stats: ProblemTagStat[] = payload?.data || [];

                setTopics(prevTopics => {
                    const selected = new Set(prevTopics.filter(t => t.isSelected).map(t => t.name));
                    return stats.map((stat) => ({
                        name: stat.tag,
                        numberOfProblems: stat.totalCount,
                        isSelected: selected.has(stat.tag),
                    }));
                });
            } catch (error) {
                console.error('Failed to load tag stats', error);
                setTopics([]);
            }
        };

        loadTopics();
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
        const selectedTags = topics.filter((topic) => topic.isSelected).map((topic) => topic.name.trim());
        const roomSettings = {
            easy: numberOfEasyProblems,
            medium: numberOfMediumProblems,
            hard: numberOfHardProblems,
            duration,
            tags: selectedTags,
        }
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let code = ''
        for (let i = 0; i < 5; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
        props.onCreate(code, roomSettings)
    }

    const handleJoinRoom = () => {
        if (!joinCode.trim()) return
        props.onJoin(joinCode.trim())
    }

    const toggleTopic = (index: number) => {
        setTopics(prev => {
            const copy = [...prev]
            copy[index].isSelected = !copy[index].isSelected
            return copy
        })
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
        toggleTopic,
        duration,
        setDuration,
        handleCreateRoom,
        handleJoinRoom,
        joinCode,
        setJoinCode,
    }
}
