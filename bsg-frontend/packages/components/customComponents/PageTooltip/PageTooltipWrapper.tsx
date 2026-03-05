import { ReactNode, useRef } from "react";

interface TooltipWrapperProps {
    children: ReactNode;
    text: string;
    shortcuts?: string[];
    side?: "top" | "bottom" | "left" | "right";
    sideOffset?: number;
}

export const PageTooltipWrapper: React.FC<TooltipWrapperProps> = ({
    children,
    text,
    shortcuts,
    side,
    sideOffset,
}) => {
    const triggerRef = useRef<HTMLElement>(null);

    const showTooltip = () => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();

        // send message to content script
        chrome.runtime.sendMessage({
            type: "SHOW_TOOLTIP",
            id: "tooltip1", // unique per tooltip instance
            text,
            shortcuts,
            coords: {
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX,
            },
            side,
            sideOffset,
        });
    };

    const hideTooltip = () => {
        chrome.runtime.sendMessage({ type: "HIDE_TOOLTIP" });
    };

    return (
        <div
            ref={triggerRef as any}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
        >
            {children}
        </div>
    );
};