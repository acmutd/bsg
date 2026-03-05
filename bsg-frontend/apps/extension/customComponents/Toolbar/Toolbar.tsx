import { TooltipWrapper } from '@bsg/components/TooltipWrapper';
import { Button } from '@bsg/ui/button'

export const Toolbar = () => {
    return (
        <div className="flex h-8 px-1 border-b border-white/10 items-center justify-between">
            <div className="flex gap-1">
                <TooltipWrapper text="Previous Problem">
                    <Button
                        //onClick={}
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="w-[1em] h-[1em]"
                            viewBox="0 0 36 30"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg">
                            \\<path d="M0.585786 13.3138C-0.195262 14.0949 -0.195262 15.3612 0.585786 16.1422L13.3137 28.8702C14.0948 29.6512 15.3611 29.6512 16.1421 28.8702C16.9232 28.0891 16.9232 26.8228 16.1421 26.0417L4.82843 14.728L16.1421 3.41432C16.9232 2.63327 16.9232 1.36694 16.1421 0.585892C15.3611 -0.195157 14.0948 -0.195157 13.3137 0.585892L0.585786 13.3138ZM34 16.728C35.1046 16.728 36 15.8326 36 14.728C36 13.6235 35.1046 12.728 34 12.728V14.728V16.728ZM2 14.728V16.728H34V14.728V12.728H2V14.728Z"/>
                        </svg>
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper text="Next Problem">
                    <Button
                        //onClick={}
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="w-[1em] h-[1em]"
                            viewBox="0 0 36 30"
                            fill="currentColor"
                            xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 12.728C0.89543 12.728 0 13.6235 0 14.728C0 15.8326 0.89543 16.728 2 16.728V14.728V12.728ZM35.4142 16.1422C36.1953 15.3612 36.1953 14.0949 35.4142 13.3138L22.6863 0.585892C21.9052 -0.195157 20.6389 -0.195157 19.8579 0.585892C19.0768 1.36694 19.0768 2.63327 19.8579 3.41432L31.1716 14.728L19.8579 26.0417C19.0768 26.8228 19.0768 28.0891 19.8579 28.8702C20.6389 29.6512 21.9052 29.6512 22.6863 28.8702L35.4142 16.1422ZM2 14.728V16.728H34V14.728V12.728H2V14.728Z"/>
                        </svg>
                    </Button>
                </TooltipWrapper>
            </div>

            <div className="flex gap-1">
                <TooltipWrapper text="Copy room code" shortcuts={["g0oN3R"]}>
                    <Button
                        //onClick={}
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="w-[1em] h-[1em]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 448 512"
                            fill="currentColor"
                        >
                            <path d="M384 336H192C183.2 336 176 328.8 176 320V64C176 55.2 183.2 48 192 48H325.5C329.7 48 333.8 49.7 336.8 52.7L395.3 111.2C398.3 114.2 400 118.3 400 122.5V320C400 328.8 392.8 336 384 336ZM192 384H384C419.3 384 448 355.3 448 320V122.5C448 105.5 441.3 89.2 429.3 77.2L370.7 18.7C358.7 6.7 342.5 0 325.5 0H192C156.7 0 128 28.7 128 64V320C128 355.3 156.7 384 192 384ZM64 128C28.7 128 0 156.7 0 192V448C0 483.3 28.7 512 64 512H256C291.3 512 320 483.3 320 448V432H272V448C272 456.8 264.8 464 256 464H64C55.2 464 48 456.8 48 448V192C48 183.2 55.2 176 64 176H80V128H64Z"/>
                        </svg>
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper text="Settings">
                    <Button
                        //onClick={}
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >
                        <svg
                            className="w-[1em] h-[1em]"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 512 512"
                            fill="currentColor"
                        >
                            <path d="M256 0c17 0 33.6 1.7 49.8 4.8c7.9 1.5 21.8 6.1 29.4 20.1c2 3.7 3.6 7.6 4.6 11.8l9.3 38.5C350.5 81 360.3 86.7 366 85l38-11.2c4-1.2 8.1-1.8 12.2-1.9c16.1-.5 27 9.4 32.3 15.4c22.1 25.1 39.1 54.6 49.9 86.3c2.6 7.6 5.6 21.8-2.7 35.4c-2.2 3.6-4.9 7-8 10L459 246.3c-4.2 4-4.2 15.5 0 19.5l28.7 27.3c3.1 3 5.8 6.4 8 10c8.2 13.6 5.2 27.8 2.7 35.4c-10.8 31.7-27.8 61.1-49.9 86.3c-5.3 6-16.3 15.9-32.3 15.4c-4.1-.1-8.2-.8-12.2-1.9L366 427c-5.7-1.7-15.5 4-16.9 9.8l-9.3 38.5c-1 4.2-2.6 8.2-4.6 11.8c-7.7 14-21.6 18.5-29.4 20.1C289.6 510.3 273 512 256 512s-33.6-1.7-49.8-4.8c-7.9-1.5-21.8-6.1-29.4-20.1c-2-3.7-3.6-7.6-4.6-11.8l-9.3-38.5c-1.4-5.8-11.2-11.5-16.9-9.8l-38 11.2c-4 1.2-8.1 1.8-12.2 1.9c-16.1 .5-27-9.4-32.3-15.4c-22-25.1-39.1-54.6-49.9-86.3c-2.6-7.6-5.6-21.8 2.7-35.4c2.2-3.6 4.9-7 8-10L53 265.7c4.2-4 4.2-15.5 0-19.5L24.2 218.9c-3.1-3-5.8-6.4-8-10C8 195.3 11 181.1 13.6 173.6c10.8-31.7 27.8-61.1 49.9-86.3c5.3-6 16.3-15.9 32.3-15.4c4.1 .1 8.2 .8 12.2 1.9L146 85c5.7 1.7 15.5-4 16.9-9.8l9.3-38.5c1-4.2 2.6-8.2 4.6-11.8c7.7-14 21.6-18.5 29.4-20.1C222.4 1.7 239 0 256 0zM218.1 51.4l-8.5 35.1c-7.8 32.3-45.3 53.9-77.2 44.6L97.9 120.9c-16.5 19.3-29.5 41.7-38 65.7l26.2 24.9c24 22.8 24 66.2 0 89L59.9 325.4c8.5 24 21.5 46.4 38 65.7l34.6-10.2c31.8-9.4 69.4 12.3 77.2 44.6l8.5 35.1c24.6 4.5 51.3 4.5 75.9 0l8.5-35.1c7.8-32.3 45.3-53.9 77.2-44.6l34.6 10.2c16.5-19.3 29.5-41.7 38-65.7l-26.2-24.9c-24-22.8-24-66.2 0-89l26.2-24.9c-8.5-24-21.5-46.4-38-65.7l-34.6 10.2c-31.8 9.4-69.4-12.3-77.2-44.6l-8.5-35.1c-24.6-4.5-51.3-4.5-75.9 0zM208 256a48 48 0 1 0 96 0 48 48 0 1 0 -96 0zm48 96a96 96 0 1 1 0-192 96 96 0 1 1 0 192z"/>
                        </svg>
                    </Button>
                </TooltipWrapper>

                <TooltipWrapper text="Leave Room">
                    <Button
                        //onClick={}
                        className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center text-foreground/60 bg-transparent hover:bg-[#484848]"
                    >

                    </Button>
                </TooltipWrapper>
            </div>
        </div>
    )
}