import { useEffect, useState } from "react";

export const useIsCollapsed = () => {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const observer = new ResizeObserver(([element]) => {
            setCollapsed(element.contentRect.width <= 36);
            console.log(element.contentRect.width);
        });

        observer.observe(document.documentElement);

        return () => observer.disconnect();
    }, []);

    return collapsed;
}