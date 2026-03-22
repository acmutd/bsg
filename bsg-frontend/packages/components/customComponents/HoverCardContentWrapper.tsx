import React from 'react';
import { HoverCardContent } from '@bsg/ui/hover-card';

export const HoverCardContentWrapper = ({
    sideOffset = 6,
    children,
    ...props
}: React.ComponentProps<typeof HoverCardContent>) => {
    return (
        <HoverCardContent
            sideOffset={6}
            className='bg-[#333333] border border-[#484848] rounded-lg'
        >
            {children}
        </HoverCardContent>
    );
};