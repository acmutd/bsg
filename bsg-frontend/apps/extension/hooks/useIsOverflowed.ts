import { useCallback, useRef, useState } from "react";

export const useIsOverflowed = <T extends HTMLElement>() => {
    const elementRef = useRef<T | null>(null);
    const observerRef = useRef<ResizeObserver | null>(null);

    const [isOverflowedX, setIsOverflowedX] = useState(false);
    const [isOverflowedY, setIsOverflowedY] = useState(false);

    const overflowRef = useCallback((node: T | null) => {
        // Cleanup previous observer
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        elementRef.current = node;

        if (node) {
            observerRef.current = new ResizeObserver(() => {
                setIsOverflowedX(node.scrollWidth > node.clientWidth);
                setIsOverflowedY(node.scrollHeight > node.clientHeight);
            });
            observerRef.current.observe(node);
        }
    }, []);

    return {
        overflowRef,
        isOverflowedX,
        isOverflowedY,
    };
};