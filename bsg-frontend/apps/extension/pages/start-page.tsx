import RoomChoice from "@/pages/room-choice-page";
import { useRoomInit } from "@/hooks/useRoomInit";

export default function StartPage() {

    const { joinRoom } = useRoomInit();

    return (
        <RoomChoice
            onJoin={joinRoom}
        />
    )
}
