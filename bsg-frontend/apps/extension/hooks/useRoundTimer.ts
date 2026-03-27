import { useEffect, useState } from "react";
import { useRoomStore } from "@/stores/useRoomStore";

export function useRoundTimer() {
    
    const roundEndTime = useRoomStore(s => s.roundEndTime);
    const [ timeRemaining, setTimeRemaining ] = useState<String>("00:00:00");

    useEffect(() => {
        if (!roundEndTime) {
            setTimeRemaining("00:00:00");
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = roundEndTime - now;

            if (diff <= 0) {
                setTimeRemaining("00:00:00");
                // onEndRound(); // timer expired — end the round
            } else {
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeRemaining(
                    `${hours > 0 ? `${hours}:` : ''}${hours > 0 && minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
                );
            }

            updateTimer();
            const interval = setInterval(updateTimer, 1000);
            return () => clearInterval(interval);
        }
    }, [roundEndTime]);

    return { timeRemaining };
}