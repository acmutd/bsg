"use client";
import {Button} from "@bsg/ui/button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEnvelope} from "@fortawesome/free-solid-svg-icons";
import {useLogIn} from "@/hooks/useLogIn";

export default function UserLogIn() {
    const {credentials, handleChange, login} = useLogIn()

    return (
        <div className="flex flex-col px-5 py-16 gap-8 items-center">
            <div className="flex items-center text-4xl font-bold gap-3">
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

            <div className="rounded-lg w-full h-full max-w-sm flex flex-col p-8 gap-8 items-center bg-[#333333]">
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
                    >
                        Create Acount
                    </Button>

                    <div className="w-full flex items-center gap-3 text-xs font-medium">
                        <hr className="w-full"/>
                        OR
                        <hr className="w-full"/>
                    </div>

                    <Button
                        className="flex items-center gap-4 bg-[#454545] w-full rounded-lg"
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
                </div>

                <p className="text-xs">Already have an account? Sign in</p>
            </div>
        </div>
    )

}

