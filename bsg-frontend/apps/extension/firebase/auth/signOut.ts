import { signOut, getAuth } from "firebase/auth";
import { app } from "../config";


export async function signOutOfAccount(): Promise<void>{

    const auth = getAuth(app);

    try{
        return await signOut(auth);

    }catch(error){

        console.log(error.code)
        console.log(error.message)
        throw error;
    }

}