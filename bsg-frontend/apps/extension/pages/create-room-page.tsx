import React, {useState} from 'react'
import {Poppins} from 'next/font/google'
import {useRouter} from 'next/router'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@bsg/ui/tabs"
import {X} from 'lucide-react'
import {useRoomInit} from "@/hooks/useRoomInit";
import {FilterProblemsTab} from "@/customComponents/CreateRoom/filter-problems-tab";
import {ChooseProblemsTab} from "@/customComponents/CreateRoom/choose-problems-tab";
import {NotificationToggle} from "@/customComponents/NotificationToggle";
import {pushRoute} from "@/utils/navigation";

const poppins = Poppins({weight: '400', subsets: ['latin']})

export default function CreateRoomPage() {
    const router = useRouter()
    const {createRoom} = useRoomInit()
    // Room-wide setting chosen by the creator; members can't change it.
    const [profanityFilter, setProfanityFilter] = useState(false)
    const createRoomWithSettings: typeof createRoom = (roomCode, options) =>
        createRoom(roomCode, {...options, profanityFilter})

    return (
        <div className={`${poppins.className} relative min-h-full flex px-4 py-4`}>

            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
            </div>

            <div className="relative m-auto w-full min-w-[300px] max-w-sm p-5 rounded-2xl">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <h2 className="text-lg text-foreground font-semibold">Create a Room</h2>
                    <button
                        onClick={() => pushRoute(router, '/room-choice-page').catch(error => console.error('Failed to return to room choice', error))}
                        aria-label="Cancel"
                        title="Cancel"
                        className="shrink-0 text-foreground/60 hover:text-foreground rounded focus:outline-none p-1 transition-transform duration-200 hover:scale-125"
                    >
                        <X className="h-4 w-4"/>
                    </button>
                </div>

                {/* Profanity filter */}
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium">Profanity filter</span>
                        <span className="text-xs text-foreground/50">
                            Block chat messages that contain profanity
                        </span>
                    </div>
                    <NotificationToggle
                        enabled={profanityFilter}
                        onChange={setProfanityFilter}
                        ariaLabel="Profanity filter"
                    />
                </div>

                <Tabs defaultValue="filter" className="w-full">
                    <TabsList className="grid h-8 w-full grid-cols-2 rounded-lg bg-bsg-dark mb-2">
                        <TabsTrigger
                            value="filter"
                            className="rounded-md py-1 text-xs text-foreground/60 data-[state=active]:bg-bsg-surface data-[state=active]:text-foreground"
                        >
                            Filter
                        </TabsTrigger>
                        <TabsTrigger
                            value="choose"
                            className="rounded-md py-1 text-xs text-foreground/60 data-[state=active]:bg-bsg-surface data-[state=active]:text-foreground"
                        >
                            Choose
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="filter">
                        <FilterProblemsTab createRoom={createRoomWithSettings}/>
                    </TabsContent>

                    <TabsContent value="choose">
                        <ChooseProblemsTab createRoom={createRoomWithSettings}/>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
