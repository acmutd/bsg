import React from 'react'
import {Poppins} from 'next/font/google'
import {Button} from '@bsg/ui/button'
import {Label} from "@bsg/ui/label"
import {Slider} from "@bsg/ui/slider"
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faDoorOpen, faPlus, faX} from '@fortawesome/free-solid-svg-icons'
import Difficulty from "@bsg/models/Difficulty";
import {IncDecButtons} from "@/customComponents/inc-dec-buttons";
import {useRoomChoice} from "@/hooks/useRoomChoice";
import {TopicComponent} from "@/customComponents/topic-component";
import {NumberOfProblemsWithDifficultyLabel} from "@/customComponents/number-of-problems-with-difficulty-label";

const poppins = Poppins({weight: '400', subsets: ['latin']})

export interface Topic {
    name: string
    numberOfProblems: number
    isSelected: boolean
}

interface RoomChoiceProps {
    onJoin: (roomCode: string) => Promise<{ success: true } | { success: false; message: string }>
    onCreate: (roomCode: string, options: { easy: number; medium: number; hard: number; duration: number; tags: string[] }) => Promise<{ success: true } | { success: false; message: string }>
}

export default function RoomChoice({onJoin, onCreate}: RoomChoiceProps) {

    const {
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
        formError,
        setFormError,
        isSubmittingCreate,
        isSubmittingJoin,
    } = useRoomChoice({onJoin, onCreate})

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
                className={`relative m-auto w-full min-w-[18rem] p-5 rounded-2xl bg-bsg-surface/50 backdrop-blur-md border border-bsg-glass shadow-bsg-glass ${showCreateOptions ? 'hidden' : ''}`}>
                <h1 className="text-lg text-foreground font-semibold mb-4">Create a room or join one</h1>

                <div className="space-y-4">
                    {/* Create Room */}
                    <Button
                        onClick={() => {
                            setFormError(null)
                            setShowCreateOptions(true)
                        }}
                        className="px-4 py-2 gap-2 text-white bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,30%)] transition-colors"
                    >
                        <p>Create</p>
                        <FontAwesomeIcon icon={faPlus}/>
                    </Button>

                    {/* Join Room */}
                    <div className="flex gap-2">
                        {/* Enter key functionality for join room */}
                        <input
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                e.preventDefault();
                                handleJoinRoom();
                                }
                            }}
                            
                               placeholder="Enter room code"
                               className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 transition"
                        />
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
                    {!showCreateOptions && formError && (
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

            {/* Create Room Modal */}
            {showCreateOptions && (
                <div className="absolute inset-0 z-50 flex overflow-y-auto bg-background/80 backdrop-blur-sm p-3">
                    <div
                        className="m-auto w-full min-w-[300px] max-w-sm p-5 rounded-2xl bg-bsg-surface/50 backdrop-blur-md border border-bsg-glass shadow-bsg-glass">
                        <div className="flex items-start justify-between gap-3 mb-5">
                            <h2 className="text-lg text-foreground font-semibold">Create Room</h2>
                            <button
                                onClick={() => setShowCreateOptions(false)}
                                aria-label="Close create dialog"
                                title="Close"
                                className="shrink-0 text-foreground/60 hover:text-foreground rounded focus:outline-none p-1 transition-transform duration-200 hover:scale-125"
                            >
                                <FontAwesomeIcon icon={faX}/>
                            </button>
                        </div>

                        {/* Difficulty rows */}
                        <div className="space-y-3 mb-5">
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 whitespace-nowrap">
                                    <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Easy}
                                                                         num={numberOfEasyProblems}/>
                                </span>
                                <IncDecButtons
                                    decrementOnClick={() => decrement(setNumberOfEasyProblems, numberOfEasyProblems)}
                                    incrementOnClick={() => increment(setNumberOfEasyProblems, numberOfEasyProblems)}/>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 whitespace-nowrap">
                                    <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Medium}
                                                                         num={numberOfMediumProblems}/>
                                </span>
                                <IncDecButtons
                                    decrementOnClick={() => decrement(setNumberOfMediumProblems, numberOfMediumProblems)}
                                    incrementOnClick={() => increment(setNumberOfMediumProblems, numberOfMediumProblems)}/>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span className="shrink-0 whitespace-nowrap">
                                    <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Hard}
                                                                         num={numberOfHardProblems}/>
                                </span>
                                <IncDecButtons
                                    decrementOnClick={() => decrement(setNumberOfHardProblems, numberOfHardProblems)}
                                    incrementOnClick={() => increment(setNumberOfHardProblems, numberOfHardProblems)}/>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-2 mb-5">
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground/20"/>
                            <div className="flex-1 h-px bg-foreground/10"/>
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground/20"/>
                        </div>

                        {/* Topics */}
                        <div className="mb-5">
                            <Label className="text-sm text-foreground/60">Select Topics</Label>
                            <div
                                className="max-h-32 overflow-y-auto rounded-md p-2 mt-2 bg-background">
                                <div className="flex flex-wrap gap-2">
                                    {topics.map((t, i) => <TopicComponent key={i} topic={t}
                                                                          toggle={() => toggleTopic(i)}/>)}
                                </div>
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="mb-5">
                            <Label className="text-sm text-foreground/60">Duration: {duration} mins</Label>
                            <Slider min={5} max={120} step={5} value={[duration]}
                                    onValueChange={(v) => setDuration(v[0])} className={'pt-2'}/>
                        </div>

                        {/* Error */}
                        {formError && (
                            <div className="rounded-md border border-red-500/50 bg-red-950/40 px-3 py-2 mb-4 text-sm text-red-200">
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

                        {/* Create button */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleCreateRoom}
                                disabled={isSubmittingCreate}
                                className="px-4 py-2 text-white bg-[hsl(90,72%,39%)] hover:bg-[hsl(90,72%,34%)] transition-colors"
                            >
                                {isSubmittingCreate ? 'Creating...' : 'Create'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
