import React from "react";
import SignUpForm from "@bsg/components/signUpForm/signUpForm";

const Page = () => {
    return (
        <div className='w-full px-4 py-10 flex justify-center'>
            <div className='reveal glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8'>
                <SignUpForm/>
            </div>
        </div>
    );
};

export default Page;
