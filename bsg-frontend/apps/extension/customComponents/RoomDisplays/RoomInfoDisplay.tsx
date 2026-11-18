import { User } from '@bsg/models/User';
import { Button } from '@bsg/ui/button';
import { HoverCard, HoverCardTrigger } from '@bsg/ui/hover-card';
import { HoverCardContent } from '@bsg/components/HoverCardContent';
import { useUserStore } from '@/stores/useUserStore';
import { useRoomStore } from '@/stores/useRoomStore';
import { useParticipantProfiles } from '@/hooks/useParticipantProfiles';

const GREEN = '#62AF2E'; // same green as the toolbar progress bar
const GREY = 'rgb(var(--foreground) / 0.25)';

export const RoomInfoDisplay = ({ isActive }: { isActive: boolean }) => {

    const adminId = useRoomStore(s => s.adminId);

    const user: User | any = {
        id: useUserStore(s => s.userId),
        name: useUserStore(s => s.username),
        email: useUserStore(s => s.email),
        photo: useUserStore(s => s.iconUrl)
    };

    const users: User[] = useRoomStore(s => s.participants);
    const getProfile = useParticipantProfiles(); // getProfile(user.id) -> { rank, solvedCount, problems, score } for the hover card

    const isConnected = true;

    const divider = <div className="min-w-[1px] h-3 bg-bsg-separator" />; // thin line between the hover card's items, same as the tab bar's separator

    return (
        <div className={`px-2 pb-2 ${(isActive) ? '' : 'hidden'}`}>
            <div className='p-2 font-medium'>
                Participants
            </div>

            {users.map((user) => {
                const { rank, solvedCount, problems, score } = getProfile(user.id); // this participant's data for the hover card

                return (
                <HoverCard>
                    <HoverCardTrigger>
                        <Button
                            //onClick={}
                            key={user.id}
                            className="rounded-none p-2 pr-4 h-fit w-full flex items-center justify-between text-foreground/60 bg-transparent hover:bg-bsg-hover"
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

                    <HoverCardContent className="w-auto min-w-64"> {/* original 256px width, grows only if the row needs more room */}
                        <div className="flex items-center justify-center gap-2.5 text-sm font-medium text-foreground whitespace-nowrap">
                            <div>{rank === null ? '—' : `# ${rank}`}</div> {/* rank in the room; dash until they are on the leaderboard */}

                            {divider}

                            <div>{solvedCount} / {problems.length} solved</div> {/* problems completed out of the round's total */}

                            {divider}

                            {problems.length > 0 && (
                                <>
                                    <div className="flex items-center gap-1">
                                        {problems.map((problem, i) => (
                                            <div
                                                key={`${problem.slug}-${i}`}
                                                title={problem.slug}
                                                className="h-2 w-2 rounded-full border-[0.5px]"
                                                style={{
                                                    backgroundColor: problem.solved ? GREEN : 'transparent', // filled = solved, outline = not solved
                                                    borderColor: problem.solved ? GREEN : GREY,
                                                }}
                                            />
                                        ))}
                                    </div>

                                    {divider} {/* only drawn when there are circles, so two lines never sit side by side */}
                                </>
                            )}

                            <div>{score} points</div> {/* points earned in the round */}
                        </div>
                    </HoverCardContent>
                </HoverCard>
                );
            })}
        </div>
    );
};