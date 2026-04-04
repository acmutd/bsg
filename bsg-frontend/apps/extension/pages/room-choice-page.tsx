import React from 'react'
import {Poppins} from 'next/font/google'
import {Button} from '@bsg/ui/button'
import {Label} from "@bsg/ui/label"
import {Slider} from "@bsg/ui/slider"
import {ScrollArea} from "@bsg/ui/scroll-area"
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
            className={`${poppins.className} relative min-h-screen flex items-center justify-center bg-background px-4 py-8`}>
            <div
                className="w-full max-w-lg p-8 rounded-2xl bg-inputBackground border-background shadow-lg hover:shadow-xl transition">
                <h1 className="text-2xl text-white font-semibold mb-4">Create a room or join one</h1>

                <div className="space-y-4">
                    {/* Create Room - opens a focused modal dialog (create only) */}
                    <Button
                        onClick={() => {
                            setFormError(null)
                            setShowCreateOptions(true)
                        }}
                        className="px-4 py-2 text-white bg-primary hover:bg-primary/90 transition-colors"
                    >
                        <p className='px-2'>Create</p>
                        <FontAwesomeIcon icon={faPlus}/>
                    </Button>


                    {/* Modal for create options only */}
                    {showCreateOptions && (
                        <div className="absolute inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background p-3 sm:p-4">
                            <div
                                className="mt-2 w-full max-w-lg max-h-[calc(100vh-1rem)] overflow-y-auto p-6 rounded-2xl bg-inputBackground shadow-lg">
                                <div className="flex items-start justify-between mb-4">
                                    <h2 className="text-xl text-white font-semibold">Create Room</h2>
                                    <button
                                        onClick={() => setShowCreateOptions(false)}
                                        aria-label="Close create dialog"
                                        title="Close"
                                        className="text-gray-300 hover:text-white rounded focus:outline-none p-1 transition-transform duration-200 hover:scale-125"
                                    >
                                        <FontAwesomeIcon icon={faX}/>
                                    </button>
                                </div>

                                <div className="grid gap-4 py-2">
                                    <div className="flex items-center justify-between">
                                        <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Easy}
                                                                             num={numberOfEasyProblems}/>
                                        <IncDecButtons
                                            decrementOnClick={() => decrement(setNumberOfEasyProblems, numberOfEasyProblems)}
                                            incrementOnClick={() => increment(setNumberOfEasyProblems, numberOfEasyProblems)}/>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Medium}
                                                                             num={numberOfMediumProblems}/>
                                        <IncDecButtons
                                            decrementOnClick={() => decrement(setNumberOfMediumProblems, numberOfMediumProblems)}
                                            incrementOnClick={() => increment(setNumberOfMediumProblems, numberOfMediumProblems)}/>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Hard}
                                                                             num={numberOfHardProblems}/>
                                        <IncDecButtons
                                            decrementOnClick={() => decrement(setNumberOfHardProblems, numberOfHardProblems)}
                                            incrementOnClick={() => increment(setNumberOfHardProblems, numberOfHardProblems)}/>
                                    </div>

                                    <div>
                                        <Label className="text-lg">Select Topics</Label>
                                        <ScrollArea
                                            className="max-h-32 overflow-y-auto rounded-md p-2 mt-2 bg-background">
                                            <div className="flex flex-wrap gap-2">
                                                {topics.map((t, i) => <TopicComponent key={i} topic={t}
                                                                                      toggle={() => toggleTopic(i)}/>)}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    <div>
                                        <Label className="text-lg">Duration: {duration} mins</Label>
                                        <Slider min={5} max={120} step={5} value={[duration]}
                                                onValueChange={(v) => setDuration(v[0])} className={'pt-2'}/>
                                    </div>

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

                                    <div className="flex mt-2 justify-end">
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
                        </div>
                    )}

                    {/* Join Room */}
                    <div className="flex gap-2 mt-2">
                        <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                               placeholder="Enter room code"
                               className="flex-1 px-3 py-2 rounded-lg bg-background text-white focus:outline-none focus:ring-2 focus:ring-white transition"/>
                        <Button
                            onClick={handleJoinRoom}
                            disabled={isSubmittingJoin}
                            className="px-4 py-2 flex items-center gap-1 text-white bg-primary hover:bg-primary/90 transition-colors"
                        >
                            <p className='px-2'>{isSubmittingJoin ? 'Joining...' : 'Join'}</p>
                            <FontAwesomeIcon icon={faDoorOpen}/>
                        </Button>

                    </div>

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
        </div>
    )
}
