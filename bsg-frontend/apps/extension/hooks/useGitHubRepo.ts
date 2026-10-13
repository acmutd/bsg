import {useEffect, useCallback, useState} from 'react';
import { useLogin } from './useLogin'

export default function GithubSubmission(){

    const { authProvider } = useLogin();

    if(authProvider == 'github'){
        //1. Check if the repo exists for submissions
        const CheckRepoExist = async() => {
            const response = await fetch(`https://api.github.com/`, {
                method:'GET',
                headers: { }
            })

        }
        
        //2. If repo doesn't exist create it

        
    }


}