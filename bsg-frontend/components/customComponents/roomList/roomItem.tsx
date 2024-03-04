'use client';

import * as React from 'react';
import Link from 'next/link';

type RoomItem = {
  id: string;
  problemIDs: string[];
  status: boolean;
  userIDs: string[];
};

const RoomItem = ({roomItem}: {roomItem: RoomItem}) => {
  const {id, problemIDs, userIDs} = roomItem;

  return (
    <Link className='text-lg' href={`/problem/${id}`}>
      <div
        className={'bg-background px-4 py-2 rounded-md hover:bg-background/70'}>
        {`${id}. ${problemIDs[0]}`}
        <p className='whitespace-nowrap text-sm text-ellipsis overflow-hidden text-muted-foreground'>
          {userIDs.join(', ')}
        </p>
      </div>
    </Link>
  );
};
RoomItem.displayName = 'RoomItem';

export default RoomItem;
