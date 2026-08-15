import { useEffect, useState } from "react";

export const useIsMaximized = () => {
    const [maximized, setMaximized] = useState(false);

    useEffect(() => {
        const observer = new ResizeObserver(([element]) => {
            setMaximized(element.contentRect.width >= window.innerWidth - 1);
        });

        observer.observe(document.documentElement);

        return () => observer.disconnect();
    }, []);

    return maximized;
}
