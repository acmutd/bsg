import { useCallback, useRef, useState } from "react";

export const useIsScrolled = <T extends HTMLElement>() => {
    const elementRef = useRef<T | null>(null);
    const [isScrolledX, setIsScrolledX] = useState(false);
    const [isScrolledY, setIsScrolledY] = useState(false);

    const scrollRef = useCallback((node: T | null) => {
        if (elementRef.current) {
            elementRef.current.removeEventListener("scroll", handleScroll);
        }

        elementRef.current = node;

        if (node) {
            node.addEventListener("scroll", handleScroll);
        }
    }, []);

    const handleScroll = useCallback(() => {
        const element = elementRef.current;
        if (!element) return;
        setIsScrolledX(element.scrollLeft > 0);
        setIsScrolledY(element.scrollTop > 0);
    }, []);

    return {
        scrollRef,
        isScrolledX,
        isScrolledY,
    };
};