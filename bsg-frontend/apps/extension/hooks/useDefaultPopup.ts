import {useEffect, useState} from "react";

const useDefaultPopup = () => {
    const [isOnLeetCode, setIsOnLeetCode] = useState<boolean | null>(null);

    useEffect(() => {
        if (typeof chrome !== "undefined" && chrome.tabs) {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                const url = tabs[0]?.url ?? "";
                setIsOnLeetCode(url.includes("leetcode.com"));
            });
        }
    }, []);

    const redirectToLeetCode = () => {
        window.open("https://leetcode.com/problems/two-sum/", "_blank", "noopener,noreferrer");
    }

    return {redirectToLeetCode, isOnLeetCode};
};

export default useDefaultPopup;
