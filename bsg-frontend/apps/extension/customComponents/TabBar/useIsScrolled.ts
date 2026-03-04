import { useEffect, useRef, useState } from "react";

export const useIsScrolled = <T extends HTMLElement>() => {
    const scrollRef = useRef<T | null>(null);

    const [isScrolledX, setIsScrolledX] = useState(false);
    const [isScrolledY, setIsScrolledY] = useState(false);

    useEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const handleScroll = () => {
            setIsScrolledX(element.scrollLeft > 0);
            setIsScrolledY(element.scrollTop > 0);
        };
        
        element.addEventListener("scroll", handleScroll);
        return () => element.removeEventListener("scroll", handleScroll);

    }, [scrollRef.current]);

    return {
        scrollRef,
        isScrolledX,
        isScrolledY
    };
};