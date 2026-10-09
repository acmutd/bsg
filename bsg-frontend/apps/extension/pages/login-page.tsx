import { Button } from "@bsg/ui/button";
import { useLogin } from "@/hooks/useLogin";
import { useBrowser } from "@/hooks/useBrowser";

export default function LoginPage() {

    const { login } = useLogin()
    const browser = useBrowser()

    return (
        <div className="min-h-full flex flex-col px-6 py-4 relative">

            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Subtle gradient orbs */}
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
            </div>

            {/* Main card */}
            <div className="relative m-auto w-full min-w-[300px] max-w-[320px] flex flex-col items-center p-8 rounded-2xl bg-bsg-surface/50 backdrop-blur-md border border-bsg-glass shadow-bsg-glass gap-8">

                {/* Logo + title */}
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 flex items-center justify-center">
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

                    <div className="flex flex-col items-center gap-1">
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">Binary Search Gang</h1>
                        <p className="text-sm text-foreground/40">Collaborative LeetCode</p>
                    </div>
                </div>

                {/* Divider with dots — signature ACM UTD design element */}
                <div className="flex items-center w-full gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                    <div className="flex-1 h-px bg-foreground/10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                </div>

                <div className="w-full flex flex-col gap-4">

                    {/* Brave blocks the Google login popup under Shields */}
                    {browser === 'Brave' && (
                        <div className="w-full flex gap-2.5 p-3 rounded-lg bg-[#F59E0B]/5 border border-[#F59E0B]/20">
                            <svg
                                className="w-3.5 h-3.5 shrink-0 mt-px"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#F59E0B"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
                                <path d="M12 8v4" />
                                <path d="M12 16h.01" />
                            </svg>
                            <p className="text-[11px] leading-snug text-foreground/60">
                                <span className="font-medium text-foreground/80">Turn off Shields</span> for this site. Brave blocks the Google login popup. Use the lion icon in the address bar.
                            </p>
                        </div>
                    )}

                    {/* Sign in with google button */}
                    <Button
                        className="flex items-center justify-center gap-3 bg-bsg-surface hover:bg-bsg-hover border border-bsg-glass text-foreground w-full rounded-lg h-11 font-medium transition-colors"
                        onClick={async () => {
                            await login('google')
                        }}
                    >
                        <svg
                            width="20px"
                            height="20px"
                            viewBox="-3 0 262 262"
                            xmlns="http://www.w3.org/2000/svg"
                            preserveAspectRatio="xMidYMid"
                        >
                            <path
                                d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                                fill="#4285F4"/>
                            <path
                                d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                                fill="#34A853"/>
                            <path
                                d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                                fill="#FBBC05"/>
                            <path
                                d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                                fill="#EB4335"/>
                        </svg>
                        Sign in with Google
                    </Button>
                    
                    {/* Sign in with github button*/}
                    <Button
                        className="flex items-center justify-center gap-3 bg-bsg-surface hover:bg-bsg-hover border border-bsg-glass text-foreground w-full rounded-lg h-11 font-medium transition-colors"
                        onClick={async () => {
                            await login('github')
                        }}
                    >
                        <svg
                            width="20px"
                            height="20px"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            preserveAspectRatio="xMidYMid"
                        >
                            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                        </svg>
                        Sign in with GitHub
                    </Button>
                </div>
            </div>

        </div>
    )
}
