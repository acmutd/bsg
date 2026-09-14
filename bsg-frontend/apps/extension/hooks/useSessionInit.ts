import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { User } from "@bsg/models/User";
import { useUserStore } from "@/stores/useUserStore";
import { useRoomInit } from "./useRoomInit";
import { configReady } from "../lib/config";

// Restores the session exactly once, before the panel renders. Effects always
// run after React has already painted, so the only way to keep login-page from
// flashing on reload is to hold the render back until sessionReady flips.
export const useSessionInit = (enabled: boolean) => {

    const router = useRouter();
    const { checkActiveRoom } = useRoomInit();

    const loginUser = useUserStore(s => s.loginUser);

    const [sessionReady, setSessionReady] = useState(false);
    const hasRun = useRef(false);

    useEffect(() => {
        if (!enabled) return;

        // StrictMode remounts effects in dev; without this the whole auth +
        // room lookup chain fires twice against a rate-limited server
        if (hasRun.current) return;
        hasRun.current = true;

        if (typeof chrome === 'undefined' || typeof chrome.runtime === 'undefined' || typeof chrome.runtime.sendMessage === 'undefined') {
            setSessionReady(true);
            return;
        }

        const initSession = async () => {

            try {
                // checkActiveRoom reaches the server via getServerUrl(), which is
                // only populated once chrome.storage.local has been read
                await configReady;

                const response = await chrome.runtime.sendMessage({type: 'CHECK_AUTH'});
                if(!response?.success) return;

                const user: User = response.user;
                loginUser(user.id, user.name, user.email, user.photo)

                //checkActiveRoom pushes room-page itself, so we only handle the no-room case
                const enteredRoom = await checkActiveRoom();
                if(!enteredRoom) await router.push('/start-page')

            } catch(error){
                console.error(error)
            } finally {
                // opened last, so the first paint is already on the right route
                setSessionReady(true);
            }
        }
        initSession();
    }, [enabled]);

    return sessionReady;
}
