"use client"
import '@bsg/ui-styles'
import {Button} from '@bsg/ui/button'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faCircle, faCopy, faEllipsisVertical, faPaperPlane, faRightFromBracket} from '@fortawesome/free-solid-svg-icons'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@bsg/ui/dropdown-menu"
import {Avatar, AvatarFallback, AvatarImage} from "@bsg/ui/avatar";
import TooltipWrapper from "@bsg/components/TooltipWrapper";
import LiveStatistics from "@bsg/components/liveStatistics/liveStatistics";
import RoomChoice from "@/pages/room-choice";
import {useRoomUser} from "@/hooks/useRoomUser";
import {User} from "@bsg/models/User";

export default function RedirectionToRoomScreen() {
    const {
        problems,
        participants2,
        copyRoomCode,
        sendMessage,
        handleCreate,
        setLoggedIn,
        containerRef,
        messages,
        inputRef,
        handleJoin,
        copied,
        isMenuOpen,
        setIsMenuOpen,
        activeTab,
        setActiveTab,
        currentRoom,
        isConnected,
        setCurrentRoom
    } = useRoomUser();

    if (currentRoom) {
        const participants: User[] = currentRoom.options?.participants || []

        return (
            <div className="flex flex-col h-screen bg-background">

                {/* HEADER */}
                <header className="bg-inputBackground px-4 py-3 flex items-center justify-between">
                    <div className="flex flex-col">
                        <div className="text-xs text-gray-300 mb-1">Room Code:</div>
                        <div
                            className="bg-background text-white p-2 rounded-lg font-mono text-lg tracking-widest flex items-center space-x-2">
                            <div className="text-2xl font-semibold">{currentRoom.code}</div>
                            <TooltipWrapper text={'Copy Code'}>
                                <Button size={'icon'} variant={'outline'}
                                        onClick={() => copyRoomCode(currentRoom.code)}
                                        className={'border-0 hover:bg-inputBackground hover:text-white'}>
                                    <FontAwesomeIcon icon={faCopy}/>
                                </Button>
                            </TooltipWrapper>
                            {copied && <div className="text-xs text-white ml-2">copied</div>}
                            <TooltipWrapper text={isConnected ? 'Connected' : 'Not Connected'}>
                                <FontAwesomeIcon icon={faCircle} size={'2xs'}
                                                 className={isConnected ? 'text-green-500' : 'text-red-500'}/>
                            </TooltipWrapper>
                        </div>
                    </div>

                    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"
                                    className={'hover:bg-inputBackground hover:text-white hover:brightness-125'}>
                                <FontAwesomeIcon icon={faEllipsisVertical} size={'lg'}/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark bg-neutral-800">
                            <DropdownMenuGroup>
                                <DropdownMenuLabel>Participants</DropdownMenuLabel>
                                {participants.map((p) => (
                                    <DropdownMenuItem key={p.id}>
                                        <Avatar>
                                            <AvatarImage src={p.photo}/>
                                            <AvatarFallback>{p.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {p.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator/>
                            <DropdownMenuItem
                                onSelect={() => {
                                    setCurrentRoom(null);
                                    setLoggedIn(false)
                                }}
                                className="text-red-500"
                            >
                                Exit Group
                                <FontAwesomeIcon icon={faRightFromBracket}/>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>

                <div className="bg-inputBackground px-4 py-2">
                    <div className="bg-background rounded-xl p-1 flex w-full max-w-md mx-auto">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                        ${activeTab === 'chat'
                                ? 'bg-inputBackground text-white shadow'
                                : 'text-gray-300 hover:text-white'}`}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('live')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                        ${activeTab === 'live'
                                ? 'bg-inputBackground text-white shadow'
                                : 'text-gray-300 hover:text-white'}`}
                        >
                            Live Statistics
                        </button>
                    </div>
                </div>

                {activeTab === 'chat' && (
                    <>
                        <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, i) => (
                                <div className={'bg-inputBackground'} key={i}>{msg.data}</div>
                            ))}
                        </div>

                        <div className="bg-inputBackground px-4 py-3 flex items-center space-x-2">
                            <input
                                ref={inputRef}
                                className="flex-1 bg-background text-white rounded-full px-4 py-2"
                                placeholder="Type a message..."
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <TooltipWrapper text={'Send Your Message'}>
                                <Button onClick={sendMessage}
                                        className="bg-primary rounded-full w-10 h-10">
                                    <FontAwesomeIcon icon={faPaperPlane}/>
                                </Button>
                            </TooltipWrapper>
                        </div>
                    </>
                )}

                {activeTab === 'live' && (
                    <div className="flex-1 overflow-y-auto p-4">
                        <LiveStatistics
                            problems={problems}
                            participants={participants2}
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <RoomChoice
            onJoin={handleJoin}
            onCreate={handleCreate}
        />
    )
}
