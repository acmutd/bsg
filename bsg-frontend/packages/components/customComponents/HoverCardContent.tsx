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
                'ring-0 bg-bsg-surface border border-bsg-hover rounded-lg',
                className
            )}
            {...props}
        >
            {children}
        </ShadCnHoverCardContent>
    );
};