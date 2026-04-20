import { Button } from '@bsg/ui/button'
import { TooltipWrapper } from "@bsg/components/TooltipWrapper";
import { useUserStore } from '@/stores/useUserStore';
import { useChatSocket } from '@/hooks/useChatSocket'

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
        MAX_CHARS
    } = useChatSocket();

    const username = useUserStore(s => s.username);

    return (
        <div
            ref={chatRef}
            className={`h-full flex flex-col relative overflow-y-auto ${(isActive) ? '' : 'hidden'}`}
        >
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

            <div className="sticky relative justify-center bottom-0 w-full flex p-4 bg-gradient-to-t from-[#262626] to-transparent">

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
                                    //onClick={}
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
    );
};
