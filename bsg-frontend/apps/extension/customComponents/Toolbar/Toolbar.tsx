import { useState } from 'react';
import { TooltipWrapper } from '@bsg/components/TooltipWrapper';
import { Button } from '@bsg/ui/button'
import { useRoundTimer } from '@/hooks/useRoundTimer';
import { useRoomEvents } from '@/hooks/useRoomEvents';
import { useRoomStore } from '@/stores/useRoomStore';

export const Toolbar = () => {

    const [ isTimerVisible, setIsTimerVisible ] = useState<boolean>(true);
    const { timeRemaining } = useRoundTimer();

    const isAdmin = useRoomStore(s => s.isAdmin);
    const isRoundStarted = useRoomStore(s => s.isRoundStarted);
    const { handleStartRound, handleEndRound, handleLeaveRoom } = useRoomEvents();

    // TODO: Move timer into separate iframe

    return (
        <div className="flex h-8 px-1 border-b border-white/10 items-center justify-between">
            <div className="flex gap-1">
                <TooltipWrapper text="Previous Problem">
                    <Button
                        //onClick={}
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="w-[1em] h-[1em] overflow-visible"
                            viewBox="0 0 36 30"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg">
                            \\<path d="M0.585786 13.3138C-0.195262 14.0949 -0.195262 15.3612 0.585786 16.1422L13.3137 28.8702C14.0948 29.6512 15.3611 29.6512 16.1421 28.8702C16.9232 28.0891 16.9232 26.8228 16.1421 26.0417L4.82843 14.728L16.1421 3.41432C16.9232 2.63327 16.9232 1.36694 16.1421 0.585892C15.3611 -0.195157 14.0948 -0.195157 13.3137 0.585892L0.585786 13.3138ZM34 16.728C35.1046 16.728 36 15.8326 36 14.728C36 13.6235 35.1046 12.728 34 12.728V14.728V16.728ZM2 14.728V16.728H34V14.728V12.728H2V14.728Z" />
                        </svg>
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper text="Next Problem">
                    <Button
                        //onClick={}
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="w-[1em] h-[1em] overflow-visible"
                            viewBox="0 0 36 30"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 12.728C0.89543 12.728 0 13.6235 0 14.728C0 15.8326 0.89543 16.728 2 16.728V14.728V12.728ZM35.4142 16.1422C36.1953 15.3612 36.1953 14.0949 35.4142 13.3138L22.6863 0.585892C21.9052 -0.195157 20.6389 -0.195157 19.8579 0.585892C19.0768 1.36694 19.0768 2.63327 19.8579 3.41432L31.1716 14.728L19.8579 26.0417C19.0768 26.8228 19.0768 28.0891 19.8579 28.8702C20.6389 29.6512 21.9052 29.6512 22.6863 28.8702L35.4142 16.1422ZM2 14.728V16.728H34V14.728V12.728H2V14.728Z" />
                        </svg>
                    </Button>
                </TooltipWrapper>

                {isAdmin && (
                    isRoundStarted ?
                        <TooltipWrapper text="End Round">
                            <Button
                                onClick={handleEndRound}
                                className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                            >
                                <svg
                                    className="w-[1em] h-[1em] overflow-visible"
                                    viewBox="0 0 40 34"
                                    fill="none"
                                    stroke="currentColor"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path 
                                        stroke-width="4"
                                        d="M19.6538 16.1257C20.1154 16.5143 20.1154 17.4857 19.6538 17.8743L3.03846 31.8632C2.57692 32.2518 2 31.7661 2 30.9889V3.01107C2 2.2339 2.57692 1.74818 3.03846 2.13676L19.6538 16.1257Z M37.6538 16.1257C38.1154 16.5143 38.1154 17.4857 37.6538 17.8743L21.0385 31.8632C20.5769 32.2518 20 31.7661 20 30.9889V3.01107C20 2.2339 20.5769 1.74818 21.0385 2.13676L37.6538 16.1257Z"
                                    />
                                </svg>
                            </Button>
                        </TooltipWrapper>
                        :
                        <TooltipWrapper text="Start Round">
                            <Button
                                onClick={handleStartRound}
                                className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                            >
                                <svg
                                    className="w-[1em] h-[1em] overflow-visible"
                                    viewBox="0 0 30 34"
                                    fill="none"
                                    stroke="currentColor"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path 
                                        stroke-width="3.5"
                                        d="M27.5 15.9948C28.1667 16.3797 28.1667 17.342 27.5 17.7269L3.5 31.5833C2.83333 31.9682 2 31.487 2 30.7172V3.00443C2 2.23463 2.83333 1.75351 3.5 2.13841L27.5 15.9948Z"
                                    />
                                </svg>
                            </Button>
                        </TooltipWrapper>
                )}
            </div>

            <div className="flex gap-1">
                <div className="flex gap-[1px] rounded-[5px] overflow-hidden">
                    <TooltipWrapper text={(isTimerVisible) ? 'Hide Timer' : 'Show Timer'}>
                        <Button
                            onClick={() => setIsTimerVisible(!isTimerVisible)}
                            className={`rounded-none p-0 h-6 w-6 flex items-center justify-center text-foreground/60 hover:bg-[#484848] ${(isTimerVisible) ? 'bg-white/10' : 'bg-transparent'}`}
                        >
                            <svg
                                className="w-4 h-4 overflow-visible"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 512 512"
                                fill="currentColor"
                            >
                                <path d="M464 256a208 208 0 1 1 -416 0 208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0 256 256 0 1 0 -512 0zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
                            </svg>
                        </Button>
                    </TooltipWrapper>

                    <div className={`flex px-1.5 items-center bg-white/10 text-foreground/60 text-sm ${(isTimerVisible) ? '' : 'hidden'}`}>{timeRemaining}</div>
                </div>

                <TooltipWrapper text="Settings">
                    <Button
                        //onClick={}
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="w-4 h-4 overflow-visible"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            fill="currentColor"
                        >
                            <path d="M256 0c17 0 33.6 1.7 49.8 4.8c7.9 1.5 21.8 6.1 29.4 20.1c2 3.7 3.6 7.6 4.6 11.8l9.3 38.5C350.5 81 360.3 86.7 366 85l38-11.2c4-1.2 8.1-1.8 12.2-1.9c16.1-.5 27 9.4 32.3 15.4c22.1 25.1 39.1 54.6 49.9 86.3c2.6 7.6 5.6 21.8-2.7 35.4c-2.2 3.6-4.9 7-8 10L459 246.3c-4.2 4-4.2 15.5 0 19.5l28.7 27.3c3.1 3 5.8 6.4 8 10c8.2 13.6 5.2 27.8 2.7 35.4c-10.8 31.7-27.8 61.1-49.9 86.3c-5.3 6-16.3 15.9-32.3 15.4c-4.1-.1-8.2-.8-12.2-1.9L366 427c-5.7-1.7-15.5 4-16.9 9.8l-9.3 38.5c-1 4.2-2.6 8.2-4.6 11.8c-7.7 14-21.6 18.5-29.4 20.1C289.6 510.3 273 512 256 512s-33.6-1.7-49.8-4.8c-7.9-1.5-21.8-6.1-29.4-20.1c-2-3.7-3.6-7.6-4.6-11.8l-9.3-38.5c-1.4-5.8-11.2-11.5-16.9-9.8l-38 11.2c-4 1.2-8.1 1.8-12.2 1.9c-16.1 .5-27-9.4-32.3-15.4c-22-25.1-39.1-54.6-49.9-86.3c-2.6-7.6-5.6-21.8 2.7-35.4c2.2-3.6 4.9-7 8-10L53 265.7c4.2-4 4.2-15.5 0-19.5L24.2 218.9c-3.1-3-5.8-6.4-8-10C8 195.3 11 181.1 13.6 173.6c10.8-31.7 27.8-61.1 49.9-86.3c5.3-6 16.3-15.9 32.3-15.4c4.1 .1 8.2 .8 12.2 1.9L146 85c5.7 1.7 15.5-4 16.9-9.8l9.3-38.5c1-4.2 2.6-8.2 4.6-11.8c7.7-14 21.6-18.5 29.4-20.1C222.4 1.7 239 0 256 0zM218.1 51.4l-8.5 35.1c-7.8 32.3-45.3 53.9-77.2 44.6L97.9 120.9c-16.5 19.3-29.5 41.7-38 65.7l26.2 24.9c24 22.8 24 66.2 0 89L59.9 325.4c8.5 24 21.5 46.4 38 65.7l34.6-10.2c31.8-9.4 69.4 12.3 77.2 44.6l8.5 35.1c24.6 4.5 51.3 4.5 75.9 0l8.5-35.1c7.8-32.3 45.3-53.9 77.2-44.6l34.6 10.2c16.5-19.3 29.5-41.7 38-65.7l-26.2-24.9c-24-22.8-24-66.2 0-89l26.2-24.9c-8.5-24-21.5-46.4-38-65.7l-34.6 10.2c-31.8 9.4-69.4-12.3-77.2-44.6l-8.5-35.1c-24.6-4.5-51.3-4.5-75.9 0zM208 256a48 48 0 1 0 96 0 48 48 0 1 0 -96 0zm48 96a96 96 0 1 1 0-192 96 96 0 1 1 0 192z" />
                        </svg>
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper text="Leave Room">
                    <Button
                        onClick={handleLeaveRoom}
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="w-4 h-4 overflow-visible"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 39 36"
                            fill="none"
                            stroke="currentColor"
                        >
                            <path
                                stroke-width="3.5"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M16 2H8C4.68629 2 2 4.68629 2 8V28C2 31.3137 4.68629 34 8 34H16M14 13.5V22.5H26V28.5L36.5 18L26 7.5V13.5H14Z"
                            />
                        </svg>
                    </Button>
                </TooltipWrapper>
            </div>
        </div>
    )
}