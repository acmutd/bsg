'use client';

import * as React from 'react';
import Link from 'next/link';

type RoomItem = {
    id: string;
    problemIDs: string[];
    status: boolean;
    userIDs: string[];
};

const RoomItem = ({roomItem}: { roomItem: RoomItem }) => {
    const {id, problemIDs, userIDs, status} = roomItem;

    return (
        <Link href={`/apps/web/app/problem/${id}`} className='block'>
            <div className='row-link rounded-xl border border-white/[0.05] bg-white/[0.03] px-3.5 py-3'>
                <div className='flex items-center gap-2.5'>
                    <span
                        aria-hidden='true'
                        className={`h-1.5 w-1.5 rounded-full ${status ? 'bg-signal animate-pulse-dot' : 'bg-foreground/30'}`}
                    />
                    <p className='truncate text-sm font-medium'>
                        <span className='font-mono text-xs text-foreground/45 mr-1.5'>#{id}</span>
                        {problemIDs[0]}
                    </p>
                </div>
                <p className='mt-1 pl-4 whitespace-nowrap text-xs text-ellipsis overflow-hidden text-foreground/50'>
                    {userIDs.join(', ')}
                </p>
            </div>
        </Link>
    );
};
RoomItem.displayName = 'RoomItem';

export default RoomItem;
