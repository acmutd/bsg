import React from 'react';
import LogInForm from '@bsg/components/logInForm/logInForm';

const Login = () => {
    return (
        <div className='w-full px-4 py-10 flex justify-center'>
            <div className='reveal glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8'>
                <LogInForm/>
            </div>
        </div>
    );
}

export default Login;
