import React from 'react';
import RoomItem from './roomItem';
import CreateRoom from "@bsg/components/createRoom/createRoom";

const RoomList = (props: { roomList: RoomItem[] }) => {
    const handleCreateRoom = () => {
    };

    return (
        <div className='bg-inputBackground p-4 rounded-md w-80 overflow-y-auto'>
            <div className='flex items-center justify-between px-2 mb-2'>
                <p className='text-2xl my-2 font-medium'>Rooms</p>

                <CreateRoom/>
            </div>
            <div className='flex flex-col space-y-4'>
                {props.roomList.map((it, index) => (
                    <RoomItem roomItem={it} key={index}/>
                ))}
            </div>
        </div>
    );
};

export default RoomList;
