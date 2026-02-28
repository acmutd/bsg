import {Button} from "@bsg/ui/button";

export const CollapsedSidebar = () => {
    const {toggleCollapse} = useCollapsedSidebar();

    return (
        // TODO: add inline color to globals.css
        <div className="min-h-screen bg-[#262626] flex flex-col p-1 items-center justify-between">
            <div className="flex flex-col py-2 px-1 gap-1 items-center">
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

                <div className=" font-medium text-sm [writing-mode:vertical-lr] rotate-180">BSG</div>
            </div>

            <Button
                className="rounded-[5px] p-0 h-6 w-6 flex items-center justify-center bg-transparent hover:bg-[#3C3C3C]"
                onClick={toggleCollapse}
            >
                <svg
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="far"
                    data-icon="chevron-left"
                    className="h-[1em]"
                    role="img" xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 320 512"
                >
                    <path
                        fill="currentColor"
                        d="M15 239c-9.4 9.4-9.4 24.6 0 33.9L207 465c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9L65.9 256 241 81c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0L15 239z"
                    />
                </svg>
            </Button>
        </div>
    )
}
