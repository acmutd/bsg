import '@bsg/ui-styles'
import RoomChoice from "@/pages/room-choice-page";
import { useRoomInit } from "@/hooks/useRoomInit";

export default function StartPage() {

    const { handleCreateRoom, handleJoinRoom } = useRoomInit();

    return (
        <RoomChoice
            onJoin={handleJoinRoom}
            onCreate={handleCreateRoom}
        />
    )
}
