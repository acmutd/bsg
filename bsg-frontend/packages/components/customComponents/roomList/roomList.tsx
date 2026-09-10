import React from 'react';
import RoomItem from './roomItem';
import CreateRoom from "@bsg/components/createRoom/createRoom";

const RoomList = (props: { roomList: RoomItem[] }) => {
    const handleCreateRoom = () => {
    };

    return (
        <div className='surface-panel rounded-2xl p-4 w-full lg:max-h-[calc(100vh-8rem)] flex flex-col'>
            <div className='flex items-center justify-between px-1 mb-4'>
                <div>
                    <p className='eyebrow mb-1'>Live</p>
                    <p className='font-display text-xl font-semibold tracking-tight'>Rooms</p>
                </div>

                <CreateRoom/>
            </div>
            <div className='flex flex-col gap-2 overflow-y-auto no-scrollbar'>
                {props.roomList.map((it, index) => (
                    <RoomItem roomItem={it} key={index}/>
                ))}
            </div>
        </div>
    );
};

export default RoomList;
