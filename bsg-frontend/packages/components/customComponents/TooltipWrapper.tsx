import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@bsg/ui/tooltip";
import { ReactNode } from "react";

interface TooltipWrapperProps {
    children: ReactNode
    text: string
    shortcuts?: string[]
}

export const TooltipWrapper = ({
    children,
    text,
    shortcuts
}: TooltipWrapperProps) => {
    return (
        <TooltipProvider>
            <Tooltip disableHoverableContent>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent
                    sideOffset={6}
                    className="flex bg-[#333333] border border-[#484848] rounded-lg gap-2 text-[#FAFAFA] items-center"
                >
                    {text}
                    {shortcuts && shortcuts.length > 0 && (
                        <div className="flex items-center gap-1">
                            {shortcuts.map((key, index) => (
                                <div
                                    key={index}
                                    className="flex min-w-[21px] px-1 py-0.5 rounded-[0.2rem] border border-[#484848] justify-center"
                                >
                                    {key}
                                </div>
                            ))}
                        </div>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
