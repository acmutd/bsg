import { User } from '@bsg/models/User';
import { Button } from '@bsg/ui/button';
import { HoverCard, HoverCardTrigger } from '@bsg/ui/hover-card';
import { HoverCardContent } from '@bsg/components/HoverCardContent';

export const RoomInfoDisplay = ({ isActive }: { isActive: boolean }) => {
        
    const users: User[] = [
        { id: "1", name: "", email: "", photo: "" },
        { id: "2", name: "", email: "", photo: "" },
        { id: "3", name: "", email: "", photo: "" },
        { id: "4", name: "", email: "", photo: "" },
        { id: "5", name: "", email: "", photo: "" },
    ];

    const isConnected = true;

    return (
        <div className={` ${(isActive) ? '' : 'hidden'}`}>
            {users.map((user) => (
                <HoverCard>
                    <HoverCardTrigger>
                        <Button
                            //onClick={}
                            key={user.id}
                            className="rounded-lg p-2 h-fit w-full flex items-center justify-between text-foreground/60 bg-transparent hover:bg-[#484848]"
                        >
                            <div className='flex gap-2'>
                                <img
                                    className='w-6 h-6 rounded-full bg-[#FFFFFF20]'
                                    src={user.photo}
                                />
                                {user.name}
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