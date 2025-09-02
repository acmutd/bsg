import { app } from "../../../config";
import { getAuth,
         signInWithRedirect,
         signInWithPopup,
         getRedirectResult,
         User,
        } from "firebase/auth";

import { provider } from './googleSignIn';


const auth = getAuth(app);


export async function SignInWithGoogleRedirect(): Promise<void> {

    try{
      await signInWithRedirect(auth, provider);
    }
    catch(error){
      console.error("Auth error: ", error);
      console.error(error.message);
      throw error; 
    }
  }

export async function HandleAuthRedirectedResult(): Promise<User>{

  try{

    const result = await getRedirectResult(auth, provider);

    if(result){
      return result.user;
    }else {
      throw new Error("User Does Not Exist");
    }

  }catch(error){
    console.log(error)
    console.log(error.message)

    throw new Error("User Did Not Successfully Log In")


  }

}


