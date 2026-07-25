import { RoomInfoDisplay } from '@/customComponents/RoomDisplays/RoomInfoDisplay';
import { ChatDisplay } from '@/customComponents/RoomDisplays/ChatDisplay';
import { LeaderboardDisplay } from '@/customComponents/RoomDisplays/LeaderboardDisplay';
import { StatisticsDisplay } from '@/customComponents/RoomDisplays/StatisticsDisplay';
import { useRoomStore } from '@/stores/useRoomStore';

export default function RoomPage() {

    const activeTab = useRoomStore(s => s.activeTab)
    const roomNotice = useRoomStore(s => s.roomNotice)
    const setRoomNotice = useRoomStore(s => s.setRoomNotice)

    return (
        <>
            {roomNotice && (
                <div className="mx-4 mt-3 rounded-md border border-amber-400/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100">
                    <div className="flex items-start justify-between gap-3">
                        <span>{roomNotice}</span>
                        <button
                            type="button"
                            onClick={() => setRoomNotice(null)}
                            className="shrink-0 rounded px-2 py-1 text-xs text-amber-200 hover:bg-amber-900/50"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
            <RoomInfoDisplay isActive={activeTab === 'roomInfo'}/>
            <ChatDisplay isActive={activeTab === 'chat'}/>
            <LeaderboardDisplay isActive={activeTab === 'leaderboard'}/>
            <StatisticsDisplay isActive={activeTab === 'statistics'}/>
        </>
    );
}