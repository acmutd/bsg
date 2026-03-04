import { useEffect, useRef, useState } from "react";

export const useIsOverflowed = <T extends HTMLElement>() => {
    const overflowRef = useRef<T | null>(null);

    const [isOverflowedX, setIsOverflowedX] = useState(false);
    const [isOverflowedY, setIsOverflowedY] = useState(false);

    useEffect(() => {
        const element = overflowRef.current;
        if (!element) return;

        const handleOverflow = () => {
            setIsOverflowedX(element.scrollWidth > element.clientWidth);
            setIsOverflowedY(element.scrollHeight > element.clientHeight);
        };

        const resizeObserver = new ResizeObserver(handleOverflow);
        resizeObserver.observe(element);
        return () => resizeObserver.disconnect();

    }, [overflowRef.current]);

    return { 
        overflowRef,
        isOverflowedX,
        isOverflowedY
    };
};