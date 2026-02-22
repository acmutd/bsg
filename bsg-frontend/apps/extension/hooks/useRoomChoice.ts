import {useState} from "react";
import {Topic} from "@/pages/room-choice";

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

    const [topics, setTopics] = useState<Topic[]>([
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Strings", numberOfProblems: 180, isSelected: false},
        {name: "Hash Tables", numberOfProblems: 156, isSelected: false},
        {name: "Dynamic Programming", numberOfProblems: 203, isSelected: false},
        {name: "Trees", numberOfProblems: 175, isSelected: false},
        {name: "Graphs", numberOfProblems: 142, isSelected: false},
        {name: "Linked Lists", numberOfProblems: 98, isSelected: false},
        {name: "Binary Search", numberOfProblems: 87, isSelected: false},
        {name: "Two Pointers", numberOfProblems: 125, isSelected: false},
        {name: "Sliding Window", numberOfProblems: 76, isSelected: false},
        {name: "Backtracking", numberOfProblems: 91, isSelected: false},
        {name: "Greedy", numberOfProblems: 134, isSelected: false},
    ])

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
        const roomSettings = {
            easy: numberOfEasyProblems,
            medium: numberOfMediumProblems,
            hard: numberOfHardProblems,
            duration
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
