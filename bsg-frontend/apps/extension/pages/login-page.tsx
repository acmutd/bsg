import { Button } from "@bsg/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useLogin } from "@/hooks/useLogin";
import { Poppins } from 'next/font/google';

type AuthProvider = 'google' | 'github';

const poppins = Poppins({ weight: '400', subsets: ['latin'] })

export default function LoginPage() {

    const { credentials, handleChange, login } = useLogin()

    return (
        <div className="min-h-screen flex flex-col px-5 pt-24 pb-10 gap-6">
        {/*<div className="flex flex-col px-5 pt-28 pb-16 gap-8 items-center">*/}
            <div className="w-full flex items-center justify-center text-4xl font-bold gap-3">
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
                BSG_
            </div>
            <div className="w-full flex flex-col items-center text-center gap-1 mt-2">
                <p className="text-xl font-semibold">Binary Search Gang</p>
                <p className="text-sm text-muted-foreground">Solve LeetCode together</p>
            </div>

            {/*<div className="flex flex-col px-5 gap-8 items-center justify-center min-h-screen"> // temporary*/}
            {/*<div className="flex-1 flex items-center justify-center w-full pb-16">*/}
            {/* <div className="rounded-lg w-full max-w-sm mx-auto flex flex-col p-8 gap-8 items-center bg-[#333333] mt-4">  */}              
            {/*}
                <div className="flex flex-col items-center gap-1">
                    <h1 className="text-lg font-medium">Join Now</h1>
                    <p className="text-xs">Create your account to start coding</p>
                </div>

                <form
                    className="w-full flex flex-col gap-2"
                    id="createAccount"
                    //onSubmit={handleCreate}
                >
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="email"
                            className="text-xs font-medium"
                        >
                            Email
                        </label>
                        <div className="bg-[#3C3C3C] w-full rounded-lg flex gap-3 p-3 items-center">
                            <FontAwesomeIcon icon={faEnvelope}/>
                            <input
                                className="bg-transparent w-full text-xs"
                                type="text"
                                id="email"
                                name="email"
                                placeholder="name@example.com"
                                value={credentials.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="password"
                            className="text-xs font-medium"
                        >
                            Password
                        </label>
                        <div className="bg-[#3C3C3C] w-full rounded-lg flex gap-3 p-3 items-center">
                            <input
                                className="bg-transparent w-full text-xs"
                                type="text"
                                id="password"
                                name="password"
                                placeholder="•••••••"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                </form>

                <div className="w-full flex flex-col gap-2">
                    <Button
                        className="w-full rounded-lg"
                        type="submit"
                        form="createAccount"
                        //onClick={} // TEMPORARY
                    >
                        Create Acount
                    </Button>

                    <div className="w-full flex items-center gap-3 text-xs font-medium">
                        <hr className="w-full"/>
                        OR
                        <hr className="w-full"/>
                    </div>
                    */}

                    <Button
                        className="flex items-center justify-center gap-4 bg-[#454545] w-full max-w-xs mx-auto rounded-lg"
                        onClick={async () => {
                            await login('google')
                        }}
                    >
                        <div className="w-6 h-6 flex items-center justify-center">
                            <svg
                                width="24px"
                                height="24px"
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
                        </div>
                        Sign up with Google
                    </Button>

                {/*<p className="text-xs">Already have an account? Sign in</p> */}
                        {/* Divider */}
            <div className="w-full max-w-sm mx-auto">
                <hr className="border-[#505050]" />
            </div>

            {/* Features */}
            <div className="w-full max-w-sm mx-auto flex flex-col gap-3">

                <div className="grid grid-cols-2 gap-3">
                    {/* Collaboration */}
                    <div className="rounded-lg bg-[#333333] p-4 flex flex-col items-center gap-2 text-center">
                        <div className="text-[rgb(255,157,20)]">
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 27" fill="none" stroke="currentColor">
                                <path strokeWidth="3" d="M7.2002 16.2998C7.28883 16.2998 7.37706 16.3019 7.46484 16.3057C6.09827 18.332 5.2998 20.7753 5.2998 23.4004V24.2998C5.2998 24.5715 5.32105 24.8386 5.35938 25.0996H1.7998C1.35656 25.0995 1 24.7431 1 24.2998V22.5C1 19.0754 3.77561 16.2998 7.2002 16.2998ZM18 15.4004C22.4202 15.4004 26 18.9802 26 23.4004V24.2998C26 24.7431 25.6434 25.0995 25.2002 25.0996H10.7998C10.3566 25.0995 10 24.7431 10 24.2998V23.4004C10 18.9802 13.5798 15.4004 18 15.4004ZM28.7998 16.2998C32.2244 16.2998 35 19.0754 35 22.5V24.2998C35 24.7431 34.6434 25.0995 34.2002 25.0996H30.6406C30.679 24.8386 30.7002 24.5715 30.7002 24.2998V23.4004C30.7002 20.7751 29.9009 18.3321 28.5342 16.3057C28.6223 16.3019 28.7108 16.2998 28.7998 16.2998ZM5.40039 5.0498C7.08655 5.05002 8.44998 6.41345 8.4502 8.09961C8.4502 9.78594 7.08668 11.1502 5.40039 11.1504C3.71393 11.1504 2.34961 9.78607 2.34961 8.09961C2.34982 6.41332 3.71406 5.0498 5.40039 5.0498ZM30.5996 5.0498C32.2859 5.0498 33.6502 6.41332 33.6504 8.09961C33.6504 9.78607 32.2861 11.1504 30.5996 11.1504C28.9133 11.1502 27.5498 9.78594 27.5498 8.09961C27.55 6.41346 28.9135 5.05002 30.5996 5.0498ZM18 1C20.6763 1 22.8494 3.17332 22.8496 5.84961C22.8496 8.52607 20.6765 10.7002 18 10.7002C15.3235 10.7002 13.1504 8.52608 13.1504 5.84961C13.1506 3.17332 15.3237 1 18 1Z"/>
                            </svg>
                        </div>
                        <p className="text-xs font-medium">Collaboration</p>
                    </div>

                    {/* Chat */}
                    <div className="rounded-lg bg-[#333333] p-4 flex flex-col items-center gap-2 text-center">
                        <div className="text-[rgb(0,123,255)]">
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
                                <path d="M51.9 384.9C19.3 344.6 0 294.4 0 240 0 107.5 114.6 0 256 0S512 107.5 512 240 397.4 480 256 480c-36.5 0-71.2-7.2-102.6-20L37 509.9c-3.7 1.6-7.5 2.1-11.5 2.1-14.1 0-25.5-11.4-25.5-25.5 0-4.3 1.1-8.5 3.1-12.2l48.8-89.4zm37.3-30.2c12.2 15.1 14.1 36.1 4.8 53.2l-18 33.1 58.5-25.1c11.8-5.1 25.2-5.2 37.1-.3 25.7 10.5 54.2 16.4 84.3 16.4 117.8 0 208-88.8 208-192S373.8 48 256 48 48 136.8 48 240c0 42.8 15.1 82.4 41.2 114.7z"/>
                            </svg>
                        </div>
                        <p className="text-xs font-medium">Chat</p>
                    </div>

                    {/* Performance Stats */}
                    <div className="rounded-lg bg-[#333333] p-4 flex flex-col items-center gap-2 text-center">
                        <div className="text-[rgb(2,177,40)]">
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 32" fill="none" stroke="currentColor">
                                <path strokeWidth="3.5" strokeLinecap="round" d="M36 30H6C3.79086 30 2 28.2091 2 26V2M10 22V16M18 22V8M26 22V12M34 22V4"/>
                            </svg>
                        </div>
                        <p className="text-xs font-medium">Performance Stats</p>
                    </div>

                    {/* Leaderboard */}
                    <div className="rounded-lg bg-[#333333] p-4 flex flex-col items-center gap-2 text-center">
                        <div className="text-[rgb(255,183,0)]">
                            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 38 38" fill="none" stroke="currentColor">
                                <path strokeWidth="3.5" strokeLinecap="round" d="M25 36.6851H35C36.1046 36.6851 37 35.7897 37 34.6851V29.6851C37 28.5805 36.1046 27.6851 35 27.6851H25M25 36.6851H13M25 36.6851V27.6851M13 36.6851H3C1.89543 36.6851 1 35.7897 1 34.6851V26.1851C1 25.0805 1.89543 24.1851 3 24.1851H13M13 36.6851V24.1851M13 24.1851V21.6851C13 20.5805 13.8954 19.6851 15 19.6851H23C24.1046 19.6851 25 20.5805 25 21.6851V27.6851M16.8127 4.87245L12.8439 5.44915C12.6388 5.47895 12.557 5.73094 12.7053 5.87557L15.5772 8.67493C15.6361 8.73236 15.663 8.81511 15.6491 8.89621L14.9711 12.849C14.9361 13.0532 15.1505 13.2089 15.3339 13.1125L18.8837 11.2463C18.9565 11.208 19.0435 11.208 19.1163 11.2463L22.6661 13.1125C22.8495 13.2089 23.0639 13.0532 23.0289 12.849L22.3509 8.89621C22.337 8.81511 22.3639 8.73236 22.4228 8.67493L25.2947 5.87557C25.443 5.73094 25.3612 5.47895 25.1561 5.44915L21.1873 4.87245C21.1059 4.86062 21.0355 4.80948 20.9991 4.73569L19.2242 1.13936C19.1325 0.953547 18.8675 0.953548 18.7758 1.13936L17.0009 4.73569C16.9645 4.80948 16.8941 4.86062 16.8127 4.87245Z"/>
                            </svg>
                        </div>
                        <p className="text-xs font-medium">Leaderboard</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
