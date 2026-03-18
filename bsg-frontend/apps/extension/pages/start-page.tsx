import '@bsg/ui-styles'
import RoomChoice from "@/pages/room-choice-page";
import { useRoomInit } from "@/hooks/useRoomInit";

export default function StartPage() {

    const { createRoom, joinRoom } = useRoomInit();

    return (
        <RoomChoice
            onJoin={joinRoom}
            onCreate={createRoom}
        />
    )
}
