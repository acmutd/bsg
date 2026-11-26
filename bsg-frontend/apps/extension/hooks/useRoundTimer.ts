import { useEffect, useState } from "react";
import { useRoomStore } from "@/stores/useRoomStore";

export function useRoundTimer() {
    
    const roundEndTime = useRoomStore(s => s.roundEndTime);
    const [ timeRemaining, setTimeRemaining ] = useState<string>("0");

    useEffect(() => {
        if (!roundEndTime) {
            setTimeRemaining("--:--");
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = roundEndTime - now;

            if (diff <= 0) {
                setTimeRemaining("0");
                // onEndRound(); // timer expired — end the round
            } else {
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                const paddedSeconds = String(seconds).padStart(2, '0');
                const paddedMinutes = String(minutes).padStart(2, '0');

                setTimeRemaining(hours > 0
                    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
                    : minutes > 0
                        ? `${minutes}:${paddedSeconds}`
                        : String(seconds)
                );
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [roundEndTime]);

    return { timeRemaining };
}