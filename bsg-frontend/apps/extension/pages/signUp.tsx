import SignUpForm from "@bsg/components/signUpForm/signUpForm";

const signUp = () => {

    return (
        <div className="relative min-h-full flex px-4 py-4">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
                <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-[#62AF2E]/5 blur-3xl" />
            </div>

            <div className="relative m-auto w-full min-w-[300px] max-w-sm p-6 rounded-2xl bg-bsg-surface/50 backdrop-blur-md border border-bsg-glass shadow-bsg-glass">
                <SignUpForm />
            </div>
        </div>
    )
}
export default signUp;
