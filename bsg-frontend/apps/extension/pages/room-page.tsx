import { RoomInfoDisplay } from '@/customComponents/RoomDisplays/RoomInfoDisplay';
import { ChatDisplay } from '@/customComponents/RoomDisplays/ChatDisplay';
import { LeaderboardDisplay } from '@/customComponents/RoomDisplays/LeaderboardDisplay';
import { StatisticsDisplay } from '@/customComponents/RoomDisplays/StatisticsDisplay';
import { useRoomStore } from '@/stores/useRoomStore';

export default function RoomPage() {

    const activeTab = useRoomStore(s => s.activeTab)

    return (
        <>
            <RoomInfoDisplay isActive={activeTab === 'roomInfo'}/>
            <ChatDisplay isActive={activeTab === 'chat'}/>
            <LeaderboardDisplay isActive={activeTab === 'leaderboard'}/>
            <StatisticsDisplay isActive={activeTab === 'statistics'}/>
        </>
    );
}