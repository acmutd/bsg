import { getFirebaseAuth } from "../../../config";
import {
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  User,
} from "firebase/auth";

import { provider } from './googleSignIn';


export async function SignInWithGoogleRedirect(): Promise<void> {

    try{
      const auth = getFirebaseAuth();
      if (!auth) throw new Error('Firebase auth not available in this environment');
      await signInWithRedirect(auth, provider);
    }
    catch(error){
      console.error("Auth error: ", error);
      console.error(error.message);
      throw error; 
    }
  }

export async function SignInWithGooglePopup(): Promise<User> {
  try {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase auth not available in this environment');
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Popup auth error: ", error);
    throw error;
  }
}

export async function HandleAuthRedirectedResult(): Promise<User>{

  try{

    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase auth not available in this environment');

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


