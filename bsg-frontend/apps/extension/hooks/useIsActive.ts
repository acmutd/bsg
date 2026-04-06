import { useEffect, useState } from "react"

export const useIsActive = () => {
    const [ isActive, setIsActive ] = useState<boolean>(false);

    useEffect(() => {
        const listener = (message: { type: string }) => {
            if (message.type === 'NOT_ACTIVE') {
                setIsActive(false);
            }
        };

        chrome.runtime.onMessage.addListener(listener);
        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);

    return { isActive, setIsActive };
}

