import {signOut} from "firebase/auth";
import {getFirebaseAuth} from "../config";

export async function signOutOfAccount(): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth) {
        // Nothing to do when auth isn't available (server/build environment)
        return;
    }

    try {
        return await signOut(auth);
    } catch (error: any) {
        throw error;
    }
}
