import React from 'react';
import { HoverCardContent as ShadCnHoverCardContent } from '@bsg/ui/hover-card';
import { cn } from '@bsg/lib';

export const HoverCardContent = ({
    className,
    children,
    ...props
}: React.ComponentProps<typeof ShadCnHoverCardContent>) => {
    return (
        <ShadCnHoverCardContent
            sideOffset={10}
            className={cn(
                'ring-0 bg-[#333333] border border-[#484848] rounded-lg',
                className
            )}
            {...props}
        >
            {children}
        </ShadCnHoverCardContent>
    );
};