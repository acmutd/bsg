import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@bsg/ui/button';

interface TabBarProps {
    isHovered: boolean,
    isInRoom: boolean
}

export const TabBar = ({ isHovered, isInRoom }: TabBarProps) => {
    const collapse = async () => {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
                type: "COLLAPSE"
            });
        }
    }

    const maximize = async () => {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
                type: "MAXIMIZE"
            });
        }
    }

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const handleScroll = () => {
            setIsScrolled(element.scrollLeft > 0);
        };

        element.addEventListener("scroll", handleScroll);

        return () => {
            element.removeEventListener("scroll", handleScroll);
        };
    }, []);

    type tabName = 'room' | 'chat' | 'leaderboard' | 'statistics';
    const [activeTab, setActiveTab] = useState<tabName>('chat');
    const [hoveredTab, setHoveredTab] = useState<tabName | null>(null);

    return true ? (
        <div
            ref={scrollRef}
            className="bg-[#333333] flex items-center p-1 overflow-auto no-scrollbar"
        >

            {/* Logo Container */}
            <div className="flex absolute left-0 h-9 items-center pointer-events-none">

                {/* Logo */}
                <div className="flex h-full bg-[#333333] pl-1 pointer-events-auto">
                    <div className="flex pl-2 py-1 gap-1 font-medium text-sm items-center">
                        <div className="w-5 h-5 flex items-center justify-center">
                            <svg
                                viewBox="0 0 81 65"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z"
                                    stroke="#62AF2E"
                                    stroke-width="6"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Gradient */}
                {isScrolled && <div className="w-8 h-full bg-[linear-gradient(to_right,#333333_33.3%,transparent)]" />}
            </div>

            {/* Tabs */}
            <div className="flex items-center pl-9 pr-14">

                <div className={`w-[1px] h-3 bg-[#505050] ${(hoveredTab === 'room') ? 'invisible' : ''}`} />

                <Button
                    onMouseEnter={() => setHoveredTab('room')}
                    onMouseLeave={() => setHoveredTab(null)}
                    onClick={() => setActiveTab('room')}
                    className="flex h-fit px-2 py-1 gap-1 text-sm items-center bg-transparent hover:bg-[#434343] rounded-[5px]"
                >
                    {
                        activeTab === 'room' ?
                            <>
                                <div className="w-5 h-5 flex items-center justify-center">

                                </div>

                                <div className="font-medium">Room</div>
                            </>
                            :
                            <>
                                <div className="w-5 h-5 flex items-center justify-center">


                                </div>

                                <div className="text-foreground/60 font-normal">Room</div>
                            </>
                    }
                </Button>

                <div className={`w-[1px] h-3 bg-[#505050] ${(hoveredTab === 'room' || hoveredTab === 'chat') ? 'invisible' : ''}`} />

                <Button
                    onMouseEnter={() => setHoveredTab('chat')}
                    onMouseLeave={() => setHoveredTab(null)}
                    onClick={() => setActiveTab('chat')}
                    className="flex h-fit px-2 py-1 gap-1 font-medium text-sm items-center bg-transparent hover:bg-[#434343] rounded-[5px]"
                >
                    {
                        activeTab === 'chat' ?
                            <>
                                <div className="w-5 h-5 flex items-center justify-center">

                                </div>

                                <div className="font-medium">Chat</div>
                            </>
                            :
                            <>
                                <div className="w-5 h-5 flex items-center justify-center">


                                </div>

                                <div className="text-foreground/60 font-normal">Chat</div>
                            </>
                    }
                </Button>

                <div className={`w-[1px] h-3 bg-[#505050] ${(hoveredTab === 'chat' || hoveredTab === 'leaderboard') ? 'invisible' : ''}`} />

                <Button
                    onMouseEnter={() => setHoveredTab('leaderboard')}
                    onMouseLeave={() => setHoveredTab(null)}
                    onClick={() => setActiveTab('leaderboard')}
                    className="flex h-fit px-2 py-1 gap-1 font-medium text-sm items-center bg-transparent hover:bg-[#434343] rounded-[5px]"
                >
                    {
                        activeTab === 'leaderboard' ?
                            <>
                                <div className="w-5 h-5 flex items-center justify-center">

                                </div>

                                <div className="font-medium">Leaderboard</div>
                            </>
                            :
                            <>
                                <div className="w-5 h-5 flex items-center justify-center">


                                </div>

                                <div className="text-foreground/60 font-normal">Leaderboard</div>
                            </>
                    }
                </Button>

                <div className={`w-[1px] h-3 bg-[#505050] ${(hoveredTab === 'leaderboard' || hoveredTab === 'statistics') ? 'invisible' : ''}`} />

                <Button
                    onMouseEnter={() => setHoveredTab('statistics')}
                    onMouseLeave={() => setHoveredTab(null)}
                    onClick={() => setActiveTab('statistics')}
                    className="flex h-fit px-2 py-1 gap-1 font-medium text-sm items-center bg-transparent hover:bg-[#434343] rounded-[5px]"
                >
                    {
                        activeTab === 'statistics' ?
                            <>
                                <div className="w-5 h-5 flex items-center justify-center">

                                </div>

                                <div className="font-medium">Statistics</div>
                            </>
                            :
                            <>
                                <div className="w-5 h-5 flex items-center justify-center">


                                </div>

                                <div className="text-foreground/60 font-normal">Statistics</div>
                            </>
                    }
                </Button>
            </div>

            {}
            <div className="flex absolute right-0 h-9 pointer-events-none">

                {/* Fade */}
                <div className="w-8 h-full bg-[linear-gradient(to_left,#333333_33.3%,transparent)]" />
                
                {/* Toolbar */}
                <div className={`flex items-center gap-1 px-1 bg-[#333333] pointer-events-auto ${(isHovered) ? '' : 'hidden'}`}>

                    { /* Maximize Button */}
                    <Button
                        onClick={maximize}
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="h-[1em] w-[1em]"
                            viewBox="0 0 448 512"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M136 32c13.3 0 24 10.7 24 24s-10.7 24-24 24H48v88c0 13.3-10.7 24-24 24s-24-10.7-24-24V56C0 42.7 10.7 32 24 32H136zM0 344c0-13.3 10.7-24 24-24s24 10.7 24 24v88h88c13.3 0 24 10.7 24 24s-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V344zM424 32c13.3 0 24 10.7 24 24V168c0 13.3-10.7 24-24 24s-24-10.7-24-24V80H312c-13.3 0-24-10.7-24-24s10.7-24 24-24H424zM400 344c0-13.3 10.7-24 24-24s24 10.7 24 24V456c0 13.3-10.7 24-24 24H312c-13.3 0-24-10.7-24-24s10.7-24 24-24h88V344z" />
                        </svg>
                    </Button>

                    {/* Collapse Button */}
                    <Button
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                        onClick={collapse}
                    >
                        <svg
                            className="h-[1em]"
                            viewBox="0 0 320 512"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M305 239c9.4 9.4 9.4 24.6 0 33.9L113 465c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l175-175L79 81c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0L305 239z" />
                        </svg>
                    </Button>
                </div>
            </div>
        </div>
    ) : (
        <div className="bg-[#333333] flex items-center p-1">

            {/* Logo */}
            <div className="flex px-2 py-1 gap-1 font-medium text-sm items-center">
                <div className="w-5 h-5 flex items-center justify-center">
                    <svg
                        viewBox="0 0 81 65"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M29.5 13.5L36.8326 20.5015L29.5 27.5M39.7661 27.5H51.5M41 47V61.5M26 61.5H56M65 13H77.5C77.3785 30.2972 72.1025 34.6283 57.5 37M15.5 13H3C3.12147 30.2972 8.3975 34.6283 23 37M15 3H65.5C65.5 3 65.1434 46.6785 40.5 46.5C15.9364 46.3221 15 3 15 3Z"
                            stroke="#62AF2E"
                            stroke-width="6"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </div>
                BSG
            </div>

            {/* Toolbar */}
            <div className="flex absolute right-0 h-9 pointer-events-none">

                {/* Fade */}
                <div className="w-8 h-full bg-[linear-gradient(to_left,#333333_33.3%,transparent)]" />

                {
                    isHovered &&
                    <div className="flex items-center gap-1 pr-1 bg-[#333333] pointer-events-auto">
                        {/* Collapse Button */}
                        <Button
                            className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center bg-transparent hover:bg-[#484848]"
                            onClick={collapse}
                        >
                            <svg
                                aria-hidden="true"
                                focusable="false"
                                data-prefix="far"
                                data-icon="chevron-right"
                                className="h-[1em]"
                                role="img"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 320 512"
                            >
                                <path
                                    fill="currentColor"
                                    d="M305 239c9.4 9.4 9.4 24.6 0 33.9L113 465c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l175-175L79 81c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0L305 239z"
                                />
                            </svg>
                        </Button>
                    </div>
                }
            </div>
        </div>
    );
}