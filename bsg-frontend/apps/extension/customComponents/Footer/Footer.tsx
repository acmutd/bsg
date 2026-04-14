import { useRoomStore } from '@/stores/useRoomStore';
import { TooltipWrapper } from '@bsg/components/TooltipWrapper';
import { HoverCard, HoverCardTrigger } from '@bsg/ui/hover-card';
import { HoverCardContent } from '@bsg/components/HoverCardContent';
import { Button } from '@bsg/ui/button';
import { useCopyCode } from '@/hooks/useCopyCode';

export const Footer = ({ isInRoom }: { isInRoom: boolean }) => {

    const { copyRoomCode, isCopied } = useCopyCode();
    const isConnected = useRoomStore(s => s.isConnected);
    const roomCode = useRoomStore(s => s.roomCode);

    return (
        <div className="flex p-1 items-center justify-between">

            <TooltipWrapper text={(isCopied) ? 'Copied' : 'Copy room code'}>
                <Button
                    onClick={() => copyRoomCode(roomCode)}
                    className={`rounded-lg flex h-7 pl-2 pr-1.5 gap-2 items-center bg-transparent hover:bg-[#484848] ${(isInRoom) ? '' : 'invisible'}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${(isConnected) ? 'bg-green-500' : 'bg-red-500'}`} />

                    <div className="flex gap-1.5 items-center text-foreground/60 text-sm font-medium">
                        {roomCode}

                        <svg
                            className="w-[1em] h-[1em] overflow-visible"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 448 512"
                            fill="currentColor"
                        >
                            <path d="M384 336H192C183.2 336 176 328.8 176 320V64C176 55.2 183.2 48 192 48H325.5C329.7 48 333.8 49.7 336.8 52.7L395.3 111.2C398.3 114.2 400 118.3 400 122.5V320C400 328.8 392.8 336 384 336ZM192 384H384C419.3 384 448 355.3 448 320V122.5C448 105.5 441.3 89.2 429.3 77.2L370.7 18.7C358.7 6.7 342.5 0 325.5 0H192C156.7 0 128 28.7 128 64V320C128 355.3 156.7 384 192 384ZM64 128C28.7 128 0 156.7 0 192V448C0 483.3 28.7 512 64 512H256C291.3 512 320 483.3 320 448V432H272V448C272 456.8 264.8 464 256 464H64C55.2 464 48 456.8 48 448V192C48 183.2 55.2 176 64 176H80V128H64Z" />
                        </svg>
                    </div>
                </Button>
            </TooltipWrapper>

            <div className="flex gap-2">
                <TooltipWrapper text="Help">
                    <Button
                        //onClick={}
                        className="rounded-lg p-0 h-7 w-7 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="w-[1em] h-[1em] overflow-visible"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            fill="currentColor"
                        >
                            <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm169.8-90.7c7.9-22.3 29.1-37.3 52.8-37.3h58.3c34.9 0 63.1 28.3 63.1 63.1c0 22.6-12.1 43.5-31.7 54.8L280 264.4c-.2 13-10.9 23.6-24 23.6c-13.3 0-24-10.7-24-24V250.5c0-8.6 4.6-16.5 12.1-20.8l44.3-25.4c4.7-2.7 7.6-7.7 7.6-13.1c0-8.4-6.8-15.1-15.1-15.1H222.6c-3.4 0-6.4 2.1-7.5 5.3l-.4 1.2c-4.4 12.5-18.2 19-30.6 14.6s-19-18.2-14.6-30.6l.4-1.2zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" />
                        </svg>
                    </Button>
                </TooltipWrapper>

                {/* TODO: Add share icons, links, buttons */}
                <HoverCard openDelay={200} closeDelay={200}>
                    <HoverCardTrigger>
                        <Button
                            //onClick={}
                            className="rounded-lg p-0 h-7 w-7 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                        >
                            <svg
                                className="w-4 h-4 overflow-visible"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 36 32"
                                fill="none"
                                stroke="currentColor"
                            >
                                <path
                                    stroke-width="3"
                                    d="M22.207 1.55957C22.5016 1.43925 22.827 1.50684 23.042 1.71777L34.29 12.7549C34.5696 13.0292 34.5696 13.464 34.29 13.7383L23.0479 24.7705C22.8251 24.9866 22.4939 25.0517 22.207 24.9346C21.9126 24.8142 21.7471 24.5453 21.7471 24.2803V17.2617H13.498C8.9705 17.2617 5.24902 20.8736 5.24902 25.3848C5.2491 27.6618 6.1307 29.1718 6.96582 30.0723C5.13605 28.8686 1.5 25.744 1.5 19.8584C1.50026 14.0085 6.34143 9.21785 12.373 9.21777H21.7471V2.19922C21.7471 1.97022 21.865 1.74604 22.083 1.60938L22.207 1.55957Z"
                                />
                            </svg>
                        </Button>
                    </HoverCardTrigger>

                    <HoverCardContent className='flex px-4 py-3 gap-4 w-fit'>
                        <div className='w-6 h-6 rounded-full bg-[#FFFFFF20]'>

                        </div>
                        <div className='w-6 h-6 rounded-full bg-[#FFFFFF20]'>

                        </div>
                        <div className='w-6 h-6 rounded-full bg-[#FFFFFF20]'>

                        </div>
                    </HoverCardContent>
                </HoverCard>

                <TooltipWrapper text="Rate our extension">
                    <Button
                        //onClick={}
                        className="rounded-lg p-0 h-7 w-7 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="w-4 h-4 overflow-visible"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 576 512"
                            fill="currentColor"
                        >
                            <path d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.6 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z" />
                        </svg>
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper text="Give us feedback">
                    <Button
                        //onClick={}
                        className="rounded-lg p-0 h-7 w-7 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="w-4 h-4 overflow-visible"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            fill="currentColor"
                        >
                            <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z" />
                        </svg>
                    </Button>
                </TooltipWrapper>
            </div>
        </div>
    )
}