import { useEffect, useState } from "react";

export const useIsFolded = () => {
    const [folded, setFolded] = useState(false);

    useEffect(() => {
        const observer = new ResizeObserver(([element]) => {
            setFolded(element.contentRect.width <= 36);
        });

        observer.observe(document.documentElement);

        return () => observer.disconnect();
    }, []);

    return folded;
}