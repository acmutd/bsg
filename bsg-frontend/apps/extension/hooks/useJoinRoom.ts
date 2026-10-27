import {useState} from "react";

type RoomActionResult = { success: true } | { success: false; message: string }

// Join-only counterpart to useRoomChoice. room-choice-page needs nothing but the
// join form, while useRoomChoice eagerly fetches tags, companies and the problem
// count for the create-room filters - mounting that hook here cost three API
// calls on every popup open for state the page never renders.
export const useJoinRoom = (props: {
    onJoin?: (roomCode: string) => Promise<RoomActionResult>
} = {}) => {
    const [joinCode, setJoinCode] = useState('')
    const [formError, setFormError] = useState<string | null>(null)
    const [isSubmittingJoin, setIsSubmittingJoin] = useState(false)

    const handleJoinRoom = () => {
        if (!props.onJoin) return
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
        joinCode,
        setJoinCode,
        formError,
        setFormError,
        isSubmittingJoin,
        handleJoinRoom,
    }
}
