import '@bsg/ui-styles'
import { Button } from '@bsg/ui/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircle, faCopy, faEllipsisVertical, faPaperPlane, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@bsg/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@bsg/ui/avatar";
import { TooltipWrapper } from "@bsg/components/TooltipWrapper";
import LiveStatistics from "@bsg/components/liveStatistics/liveStatistics";
import RoomChoice from "@/pages/room-choice";
import { useRoomUser } from "@/hooks/useRoomUser";
import { User } from "@bsg/models/User";

export default function ChatPage() {
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

    // if (currentRoom) {
    //const participants: User[] = currentRoom.options?.participants || []

    return (
        <div ref={containerRef} className="flex-1 flex flex-col relative overflow-y-auto p-4 gap-4">
            {messages.map((msg, i) => (
                <div className={'bg-inputBackground'} key={i}>{msg.data}</div>
            ))}
            <div className="absolute bottom-0 left-0  w-full px-4 py-4 flex items-center space-x-2">
                <input
                    ref={inputRef}
                    className="flex-1 bg-[#333333] text-white rounded-full px-4 py-2"
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <TooltipWrapper text={'Send Your Message'}>
                    <Button onClick={sendMessage}
                        className="bg-primary rounded-full w-10 h-10">
                        <FontAwesomeIcon icon={faPaperPlane} />
                    </Button>
                </TooltipWrapper>
            </div>
        </div>
    )
    // }

    return (
        <RoomChoice
            onJoin={handleJoin}
            onCreate={handleCreate}
        />
    )
}
