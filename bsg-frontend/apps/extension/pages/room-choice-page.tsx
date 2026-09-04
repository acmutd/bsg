import React from 'react'
import {Poppins} from 'next/font/google'
import {useRouter} from 'next/router'
import {Button} from '@bsg/ui/button'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faDoorOpen, faPlus} from '@fortawesome/free-solid-svg-icons'
import {useRoomChoice} from "@/hooks/useRoomChoice";

const poppins = Poppins({weight: '400', subsets: ['latin']})

interface RoomChoiceProps {
    onJoin: (roomCode: string) => Promise<{ success: true } | { success: false; message: string }>
}

export default function RoomChoice({onJoin}: RoomChoiceProps) {
    const router = useRouter()

    const {
        handleJoinRoom,
        joinCode,
        setJoinCode,
        formError,
        setFormError,
        isSubmittingJoin,
    } = useRoomChoice({onJoin})

    return (
        <div
            className={`${poppins.className} relative min-h-full flex px-4 py-4`}>

            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
            </div>

            {/* Main card */}
            <div
                className="relative m-auto w-full min-w-[18rem] p-5 rounded-2xl ">
                <h1 className="text-lg text-foreground font-semibold mb-4 text-center">Create a room or join one</h1>

                <div className="space-y-4">
                    {/* Create Room */}
                    <Button
                        onClick={() => {
                            setFormError(null)
                            router.push('/create-room-page')
                        }}
                        className="w-full px-4 py-2 gap-2 text-white bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,30%)] transition-colors"
                    >
                        <p>Create</p>
                        <FontAwesomeIcon icon={faPlus}/>
                    </Button>

                    {/* Join Room */}
                    <div className="flex gap-2">
                        <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                               placeholder="Enter room code"
                               className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-bsg-surface text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition"/>
                        <Button
                            onClick={handleJoinRoom}
                            disabled={isSubmittingJoin}
                            className="px-4 py-2 shrink-0 flex items-center gap-2 text-white bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,30%)] transition-colors"
                        >
                            <p>{isSubmittingJoin ? 'Joining...' : 'Join'}</p>
                            <FontAwesomeIcon icon={faDoorOpen}/>
                        </Button>
                    </div>

                    {/* Join error */}
                    {formError && (
                        <div className="rounded-md border border-red-500/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                            <div className="flex items-start justify-between gap-3">
                                <span>{formError}</span>
                                <button
                                    type="button"
                                    onClick={() => setFormError(null)}
                                    aria-label="Dismiss error"
                                    className="shrink-0 rounded px-2 py-1 text-xs text-red-200 hover:bg-red-900/40"
                                >
                                    x
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
