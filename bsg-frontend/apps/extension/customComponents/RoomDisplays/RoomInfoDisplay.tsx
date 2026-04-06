import { User } from '@bsg/models/User';
import { Button } from '@bsg/ui/button';
import { HoverCard, HoverCardTrigger } from '@bsg/ui/hover-card';
import { HoverCardContent } from '@bsg/components/HoverCardContent';
import { useUserStore } from '@/stores/useUserStore';
import { useRoomStore } from '@/stores/useRoomStore';

export const RoomInfoDisplay = ({ isActive }: { isActive: boolean }) => {

    const adminId = useRoomStore(s => s.adminId);

    const user: User | any = {
        id: useUserStore(s => s.userId),
        name: useUserStore(s => s.username),
        email: useUserStore(s => s.email),
        photo: useUserStore(s => s.iconUrl)
    };

    const users: User[] = [
        user,
        { id: "1", name: "test", email: "", photo: "" },
        { id: "2", name: "test", email: "", photo: "" },
        { id: "3", name: "test", email: "", photo: "" },
        { id: "4", name: "test", email: "", photo: "" },
        { id: "5", name: "test", email: "", photo: "" },
    ];

    const isConnected = true;

    return (
        <div className={` ${(isActive) ? '' : 'hidden'}`}>
            <div className='p-2 font-medium'>
                Participants
            </div>

            {users.map((user) => (
                <HoverCard>
                    <HoverCardTrigger>
                        <Button
                            //onClick={}
                            key={user.id}
                            className="rounded-none p-2 pr-4 h-fit w-full flex items-center justify-between text-foreground/60 bg-transparent hover:bg-[#484848]"
                        >
                            <div className='flex gap-2 items-center text-foreground/60'>
                                <img
                                    className='w-6 h-6 rounded-full bg-[#FFFFFF20]'
                                    src={user.photo}
                                />

                                {user.name}

                                {(user.id === adminId) && <svg
                                    className="w-[1em] h-[1em] overflow-visible"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 35 27"
                                    stroke="rgb(255,183,0)"
                                    fill="none"
                                >
                                    <path
                                        strokeWidth="3"
                                        strokeLinejoin="round"
                                        d="M4.5 20.5H30.5M5.5 25.5H29.5L33.5 5.5L24.5 13.5L17.5 1.5L10.5 13.5L1.5 5.5L5.5 25.5Z"
                                    />
                                </svg>}
                            </div>

                            <div className={`w-1.5 h-1.5 rounded-full ${(isConnected) ? 'bg-green-500' : 'bg-red-500'}`} />
                        </Button>
                    </HoverCardTrigger>

                    <HoverCardContent>

                    </HoverCardContent>
                </HoverCard>
            ))}
        </div>
    );
};