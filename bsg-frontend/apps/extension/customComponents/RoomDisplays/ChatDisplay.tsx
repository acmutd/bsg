import { Button } from '@bsg/ui/button'
import { TooltipWrapper } from "@bsg/components/TooltipWrapper";
import { useUserStore } from '@/stores/useUserStore';
import { useChatSocket } from '@/hooks/useChatSocket'
import { useState } from 'react';

export const ChatDisplay = ({ isActive }: { isActive: boolean }) => {

    const {
        handleChange,
        handleSubmit,
        chatRef,
        groupedMessages,
        inputRef,
        showJump,
        jumpToBottom,
        inputText,
        containerRef,
        counterRef,
        atLimit,
        MAX_CHARS,
        insertEmoji,
        categoryRefs,
        emojiMenuRef,
        scrollToCategory,
        emojiSearch,
        setEmojiSearch
    } = useChatSocket();

    const username = useUserStore(s => s.username);
    const emojiMap = require('@bsg/ui-styles/assets/emojis.json') as Record<string, { emoji: string; name: string; keywords: string[] }[]>;
    const emojiList = Object.entries(emojiMap).flatMap(([category, emojis]) =>
        emojis.map(emoji => ({ ...emoji, category }))
    );
    const emojiCategories = [
        { key: 'people', name: 'People', icon: <svg className="h-[1em] w-[1em]" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22ZM6.5 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-9.8 1.17a1 1 0 0 1 1.39.27 3.5 3.5 0 0 0 5.82 0 1 1 0 0 1 1.66 1.12 5.5 5.5 0 0 1-9.14 0 1 1 0 0 1 .27-1.4Z" clip-rule="evenodd"></path></svg> },
        { key: 'nature', name: 'Nature', icon: <svg className="h-[1em] w-[1em]" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M9.8 14.6c-.45.31-.9.6-1.37.89l-.02.01-1.15.73c-.85.57-1.68 1.2-2.4 2.1a7.75 7.75 0 0 0-.7 1.03c-.39.69-.7 1.48-.94 2.42a1 1 0 0 0 1.94.49c.12-.49.26-.9.42-1.28 1.98.08 9.05-.04 12.73-5.34 3.5-5.02 2.89-10.16 2.01-13.89-.19-.81-1.26-1-1.85-.42-1.8 1.8-3.69 2.32-5.67 2.86-2.34.63-4.8 1.3-7.35 4.15a9.13 9.13 0 0 0-2.13 8.7c.9-1.11 1.92-1.88 2.84-2.48.4-.28.8-.53 1.18-.76a13.7 13.7 0 0 0 3.55-2.83 1 1 0 1 1 1.52 1.3A13.44 13.44 0 0 1 9.8 14.6Z"></path></svg> },
        { key: 'food', name: 'Food', icon: <svg className="h-[1em] w-[1em]" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M7 1a1 1 0 0 0-1 1v.2c0 .79-.4 1.53-1.05 1.97A4.37 4.37 0 0 0 3 7.8V8a1 1 0 0 0 2 0v-.2c0-.79.4-1.53 1.05-1.97A4.37 4.37 0 0 0 8 2.2V2a1 1 0 0 0-1-1ZM10 3a1 1 0 1 1 2 0v.42a3.2 3.2 0 0 1-2.18 3.03A1.2 1.2 0 0 0 9 7.58V8a1 1 0 0 1-2 0v-.42c0-1.37.88-2.6 2.18-3.03.5-.16.82-.62.82-1.13V3ZM2 11a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1 10 10 0 0 1-4.7 8.49.6.6 0 0 0-.3.51 2 2 0 0 1-2 2H9a2 2 0 0 1-2-2 .6.6 0 0 0-.3-.51A10 10 0 0 1 2 11ZM20.85 8.02c.16.52-.3.98-.85.98h-8c-.55 0-1.01-.46-.85-.98a4.07 4.07 0 0 1 1.31-1.84 5.23 5.23 0 0 1 1.63-.88 6.1 6.1 0 0 1 3.82 0c.61.2 1.16.5 1.63.87a4.07 4.07 0 0 1 1.3 1.85Z"></path></svg> },
        { key: 'activities', name: 'Activities', icon: <svg className="h-[1em] w-[1em]" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M20.97 4.06c0 .18.08.35.24.43.55.28.9.82 1.04 1.42.3 1.24.75 3.7.75 7.09v4.91a3.09 3.09 0 0 1-5.85 1.38l-1.76-3.51a1.09 1.09 0 0 0-1.23-.55c-.57.13-1.36.27-2.16.27s-1.6-.14-2.16-.27c-.49-.11-1 .1-1.23.55l-1.76 3.51A3.09 3.09 0 0 1 1 17.91V13c0-3.38.46-5.85.75-7.1.15-.6.49-1.13 1.04-1.4a.47.47 0 0 0 .24-.44c0-.7.48-1.32 1.2-1.47l2.93-.62c.5-.1 1 .06 1.36.4.35.34.78.71 1.28.68a42.4 42.4 0 0 1 4.4 0c.5.03.93-.34 1.28-.69.35-.33.86-.5 1.36-.39l2.94.62c.7.15 1.19.78 1.19 1.47ZM20 7.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15.5 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM5 7a1 1 0 0 1 2 0v1h1a1 1 0 0 1 0 2H7v1a1 1 0 1 1-2 0v-1H4a1 1 0 1 1 0-2h1V7Z" clip-rule="evenodd"></path></svg> },
        { key: 'travel', name: 'Travel', icon: <svg className="h-[1em] w-[1em]" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M15 4a1 1 0 0 0-.95 1.32l.9 2.68h-4.6l-.92-2.36A1 1 0 0 0 8.5 5H5a1 1 0 0 0 0 2h2.82l.5 1.27a1 1 0 0 0-.2.26L6.7 11.16a4.5 4.5 0 1 0 1.76.95l.78-1.45 1.83 4.7a1 1 0 1 0 1.86-.72L11.13 10h4.48l.55 1.65a4.5 4.5 0 1 0 1.9-.63L16.4 6h1.86c.41 0 .75.34.75.75V7a1 1 0 1 0 2 0v-.25A2.75 2.75 0 0 0 18.25 4H15Zm-9.3 9-1.08 2.03a1 1 0 0 0 1.76.94l1.09-2.01A2.5 2.5 0 1 1 5.7 13Zm11.13.64.72 2.18a1 1 0 0 0 1.9-.64l-.73-2.17a2.5 2.5 0 1 1-1.9.63Z" clip-rule="evenodd"></path></svg> },
        { key: 'objects', name: 'Objects', icon: <svg className="h-[1em] w-[1em]" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M10.41 3.59 11.6 2.4a2 2 0 0 1 2.82 0l1.3 1.3a1 1 0 0 0 .7.29h4.18a1.41 1.41 0 0 1 1 2.41L14.4 13.6a1.41 1.41 0 0 1-2.41-1V8.4l-3.11 3.12a2 2 0 0 0-.53 1.87L9.9 20H15a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h4.86L6.4 13.86a4 4 0 0 1 1.06-3.75L10.8 6.8l-.38-.38a2 2 0 0 1 0-2.82Z"></path><path fill="currentColor" d="M16.99 12.43c-.21.2-.2.55.06.7a3 3 0 0 0 4.08-4.08c-.15-.26-.5-.27-.7-.06l-3.44 3.44Z"></path></svg> },
        { key: 'symbols', name: 'Symbols', icon: <svg className="h-[1em] w-[1em]" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12.47 21.73a.92.92 0 0 1-.94 0C9.43 20.48 1 15.09 1 8.75A5.75 5.75 0 0 1 6.75 3c2.34 0 3.88.9 5.25 2.26A6.98 6.98 0 0 1 17.25 3 5.75 5.75 0 0 1 23 8.75c0 6.34-8.42 11.73-10.53 12.98Z"></path></svg> },
        { key: 'flags', name: 'Flags', icon: <svg className="h-[1em] w-[1em]" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M3 1a1 1 0 0 1 1 1v.82l8.67-1.45A2 2 0 0 1 15 3.35v1.47l5.67-.95A2 2 0 0 1 23 5.85v7.3a2 2 0 0 1-1.67 1.98l-9 1.5a2 2 0 0 1-1.78-.6c-.2-.21-.08-.54.18-.68a5.01 5.01 0 0 0 1.94-1.94c.18-.32-.1-.66-.46-.6L4 14.18V21a1 1 0 1 1-2 0V2a1 1 0 0 1 1-1Z"></path></svg> },
    ];

    const [displayEmojis, setDisplayEmojis] = useState<boolean>(false);

    const emojiSearchResults = emojiSearch ?
        emojiList.filter(emoji =>
            emoji.name.includes(emojiSearch) ||
            emoji.keywords.some(keyword => keyword.includes(emojiSearch))
        )
        : [];

    return (
        <div className={`h-full flex flex-col ${(isActive) ? '' : 'hidden'}`}>
            <div
                ref={chatRef}
                className="flex-1 flex flex-col relative overflow-y-auto"
            >

                {/* Messages */}
                <div className='flex-1 flex flex-col px-4 pt-4 gap-3'>
                    {groupedMessages.map((group, i) => (
                        <>
                            {(group[0].isSystem) ?

                                // System Message
                                <div
                                    key={i}
                                    className="flex justify-center p-2 text-foreground/60"
                                >
                                    {group[0].data}
                                </div>

                                :

                                <>
                                    {(group[0].userName === username) ?

                                        // User's own message
                                        <div
                                            key={i}
                                            className='flex flex-col gap-1 items-end'
                                        >
                                            {group.map((msg, j) => (
                                                <div
                                                    key={j}
                                                    className={`max-w-[80%] whitespace-pre-wrap break-words px-3 py-2 bg-[#333333] rounded-2xl border border-white/10 ${(j == 0) ? '' : 'rounded-tr-sm'} ${(j == group.length - 1) ? '' : 'rounded-br-sm'}`}
                                                >
                                                    {msg.data}
                                                </div>
                                            ))}
                                        </div>

                                        :

                                        // Message from other users
                                        <div
                                            key={i}
                                            className='flex flex-col gap-3'
                                        >
                                            <div className='flex gap-2 items-center'>
                                                <img src={group[0].userPhoto} alt={group[0].userName} className="w-6 h-6 rounded-full" />
                                                {group[0].userName}
                                            </div>

                                            <div className='flex flex-col pl-3 gap-1'>
                                                {group.map((msg, j) => (
                                                    <div
                                                        key={j}
                                                        className={`w-fit max-w-[80%] whitespace-pre-wrap break-words px-3 py-2 bg-[#333333] rounded-2xl rounded-tl-sm border border-white/10 ${(j == group.length - 1) ? '' : 'rounded-bl-sm'}`}
                                                    >
                                                        {msg.data}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    }
                                </>
                            }
                        </>
                    ))}
                </div>

                {/* Chat Bar */}
                <div className="sticky bottom-0 w-full flex flex-col">

                    {/*  */}
                    <div className="relative flex justify-center p-4 bg-gradient-to-t from-[#262626] to-transparent">
                        {/* Jump to bottom (shows when scroll > 200px from bottom) */}
                        {showJump &&
                            <TooltipWrapper text="Jump to bottom">
                                <Button
                                    onClick={jumpToBottom}
                                    className="absolute top-[-2rem] rounded-full w-8 h-8 items-center justify-center bg-[#333333] hover:bg-[#484848] text-foreground/60 border border-white/10 shadow-lg animate-bounce"
                                >
                                    <svg
                                        className="w-4 h-4 overflow-visible"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 30 36"
                                        fill="currentColor"
                                    >
                                        <path d="M13.3133 35.4142C14.0944 36.1953 15.3607 36.1953 16.1418 35.4142L28.8697 22.6863C29.6507 21.9052 29.6507 20.6389 28.8697 19.8579C28.0886 19.0768 26.8223 19.0768 26.0412 19.8579L14.7275 31.1716L3.41383 19.8579C2.63278 19.0768 1.36645 19.0768 0.585403 19.8579C-0.195645 20.6389 -0.195645 21.9052 0.585403 22.6863L13.3133 35.4142ZM16.7275 2C16.7275 0.895432 15.8321 0 14.7275 0C13.623 0 12.7275 0.895432 12.7275 2H14.7275H16.7275ZM14.7275 34H16.7275V2H14.7275H12.7275V34H14.7275Z" />
                                    </svg>
                                </Button>
                            </TooltipWrapper>
                        }

                        <div
                            ref={containerRef}
                            className='flex w-full bg-[#333333] rounded-[21px] px-4 py-3 gap-3 border border-white/10 shadow-lg'
                        >
                            <textarea
                                ref={inputRef}
                                className="resize-none no-scrollbar outline-none bg-transparent text-foreground placeholder-foreground/60 w-full"
                                placeholder="Type a message"
                                rows={1}
                                value={inputText}
                                onChange={handleChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                            />

                            <div className='flex justify-between'>
                                <div
                                    ref={counterRef}
                                    className={`transition ease-out duration-500 ${(atLimit) ? 'text-red-500' : 'text-foreground/60'}`}
                                >
                                    {inputText.length}/{MAX_CHARS}
                                </div>

                                <div className='flex gap-3'>
                                    <TooltipWrapper text="Emojis">
                                        <Button
                                            onClick={() => setDisplayEmojis(!displayEmojis)}
                                            className="rounded-full w-auto h-auto p-0 items-center justify-center bg-transparent hover:bg-transparent text-foreground/60 hover:text-foreground"
                                        >
                                            <svg
                                                className="w-4 h-4 overflow-visible"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 36 36"
                                                fill="currentColor"
                                            >
                                                <path d="M32.625 18C32.625 9.92109 26.0789 3.375 18 3.375C9.92109 3.375 3.375 9.92109 3.375 18C3.375 26.0789 9.92109 32.625 18 32.625C26.0789 32.625 32.625 26.0789 32.625 18ZM0 18C0 8.05781 8.05781 0 18 0C27.9422 0 36 8.05781 36 18C36 27.9422 27.9422 36 18 36C8.05781 36 0 27.9422 0 18ZM12.4664 22.4578C13.5211 23.5547 15.3563 24.75 18 24.75C20.6437 24.75 22.4789 23.5547 23.5336 22.4578C24.1805 21.7828 25.2492 21.7617 25.9172 22.4086C26.5852 23.0555 26.6133 24.1242 25.9664 24.7922C24.4125 26.4094 21.7477 28.125 18 28.125C14.2523 28.125 11.5875 26.4094 10.0336 24.7922C9.38672 24.1172 9.40781 23.0484 10.0828 22.4086C10.7578 21.7688 11.8266 21.7828 12.4664 22.4578ZM10.125 14.625C10.125 13.3805 11.1305 12.375 12.375 12.375C13.6195 12.375 14.625 13.3805 14.625 14.625C14.625 15.8695 13.6195 16.875 12.375 16.875C11.1305 16.875 10.125 15.8695 10.125 14.625ZM23.625 12.375C24.8695 12.375 25.875 13.3805 25.875 14.625C25.875 15.8695 24.8695 16.875 23.625 16.875C22.3805 16.875 21.375 15.8695 21.375 14.625C21.375 13.3805 22.3805 12.375 23.625 12.375Z" />
                                            </svg>
                                        </Button>
                                    </TooltipWrapper>

                                    <TooltipWrapper text="Send Message">
                                        <Button
                                            onClick={handleSubmit}
                                            className="rounded-full w-auto h-auto p-0 items-center justify-center bg-transparent hover:bg-transparent text-foreground/60 hover:text-foreground"
                                        >
                                            <svg
                                                className="w-4 h-4 overflow-visible"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 36 34"
                                                fill="currentColor"
                                            >
                                                <path d="M8.7048 18.6122L27.5602 18.6156L4.0054 29.8753L8.7048 18.6122ZM27.5557 15.3902L8.70503 15.3916L4.00725 4.12918L27.5557 15.3902ZM0.186475 3.25542L5.92143 17.0021L0.184499 30.7496C-0.181688 31.6237 0.0153813 32.6402 0.681867 33.3147C1.37182 34.0129 2.41855 34.1981 3.30573 33.7753L34.9813 18.6293C35.6056 18.33 35.9952 17.6982 36 16.9999C36.0047 16.3016 35.6058 15.6699 34.9815 15.3706L3.30344 0.224559C2.41633 -0.198145 1.36957 -0.0128098 0.679519 0.685522C0.0129362 1.3601 -0.18428 2.37666 0.181782 3.25067L0.186475 3.25542Z" />
                                            </svg>
                                        </Button>
                                    </TooltipWrapper>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* emojis */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${displayEmojis ? 'h-[10.25rem]' : 'h-0'}`}>
                <div className="flex h-9 px-3 gap-2 items-center border-t border-white/10 bg-[#262626]" >
                    <svg
                        className="w-[1em] h-[1em] overflow-visible text-foreground/60"
                        viewBox="0 0 21 21"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        xmlns="http://www.w3.org/2000/svg">
                        <path d="M19.25 19.25L14.9 14.9M17.25 9.25C17.25 13.6683 13.6683 17.25 9.25 17.25C4.83172 17.25 1.25 13.6683 1.25 9.25C1.25 4.83172 4.83172 1.25 9.25 1.25C13.6683 1.25 17.25 4.83172 17.25 9.25Z" />
                    </svg>
                    <input
                        placeholder='Find an emoji'
                        value={emojiSearch}
                        onChange={e => setEmojiSearch(e.target.value)}
                        className="text-foreground placeholder-foreground/60 w-full bg-transparent outline-none"
                    />
                </div>

                <div className="flex h-32 bg-[#333333]">
                    <div className="flex flex-col w-9 p-1 gap-1 items-center overflow-y-auto no-scrollbar border-r border-white/10">
                        <TooltipWrapper
                            key="recent"
                            text="Recent"
                        >
                            <Button
                                key="recent"
                                onClick={() => scrollToCategory("recent")}
                                className="p-0 w-[1.75rem] flex rounded-[5px] items-center justify-center text-xl aspect-square bg-transparent hover:bg-[#484848] text-foreground/60 hover:text-foreground"
                            >
                                <svg className="h-[1em] w-[1em]" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M12 23a11 11 0 1 0 0-22 11 11 0 0 0 0 22Zm1-18a1 1 0 1 0-2 0v7c0 .27.1.52.3.7l3 3a1 1 0 0 0 1.4-1.4L13 11.58V5Z" clip-rule="evenodd"></path></svg>
                            </Button>
                        </TooltipWrapper>

                        {emojiCategories.map(category =>
                            <TooltipWrapper
                                key={category.key}
                                text={category.name}
                            >
                                <Button
                                    key={category.key}
                                    onClick={() => scrollToCategory(category.key)}
                                    className="p-0 w-[1.75rem] flex rounded-[5px] items-center justify-center text-xl aspect-square bg-transparent hover:bg-[#484848] text-foreground/60 hover:text-foreground"
                                >
                                    {category.icon}
                                </Button>
                            </TooltipWrapper>
                        )}
                    </div>

                    <div
                        ref={emojiMenuRef}
                        className={`flex-1 flex flex-col overflow-y-auto ${emojiSearch ? 'hidden' : ''}`}
                    >
                        {emojiCategories.map(category =>
                            <div
                                key={category.key}
                                ref={el => { categoryRefs.current[category.key] = el }}
                                className="flex flex-col p-1 gap-1"
                            >
                                <div className="flex items-center text-foreground/60 px-1 gap-2">
                                    {category.name}
                                    <div className="flex-1 border-t border-white/10" />
                                </div>
                                <div className="grid grid-cols-[repeat(auto-fill,minmax(1.75rem,1fr))] gap-1">
                                    {emojiMap[category.key].map(emoji => (
                                        <Button
                                            key={emoji.name}
                                            onClick={() => insertEmoji(emoji.emoji)}
                                            className="p-0 h-auto flex rounded-[5px] items-center justify-center text-xl aspect-square bg-transparent hover:bg-[#484848]"
                                        >
                                            {emoji.emoji}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`flex-1 overflow-y-auto ${emojiSearch ? '' : 'hidden'}`}>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(1.75rem,1fr))] gap-1 p-1">
                            {emojiSearchResults.map(emoji =>
                                <Button
                                    key={emoji.name}
                                    onClick={() => insertEmoji(emoji.emoji)}
                                    className="p-0 h-auto flex rounded-[5px] items-center justify-center text-xl aspect-square bg-transparent hover:bg-[#484848]"
                                >
                                    {emoji.emoji}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
