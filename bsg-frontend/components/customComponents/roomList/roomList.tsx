import React from 'react';
import RoomItem from './roomItem';
import {Button} from '@/components/ui/button';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faPlus} from '@fortawesome/free-solid-svg-icons';

const RoomList = (props: {roomList: RoomItem[]}) => {
  // TODO: create room modal
  const handleCreateRoom = () => {};

  return (
    <div className='bg-inputBackground p-4 rounded-md w-80 overflow-y-auto'>
      <div className='flex items-center justify-between px-2 mb-2'>
        <p className='text-2xl my-2 font-black'>Rooms</p>

        <Button size='sm' className='text-base' onClick={handleCreateRoom}>
          <span className='pr-1'>Create</span>
          <FontAwesomeIcon icon={faPlus} />
        </Button>
      </div>
      <div className='flex flex-col space-y-4'>
        {props.roomList.map((it, index) => (
          <RoomItem roomItem={it} key={index} />
        ))}
      </div>
    </div>
  );
};

export default RoomList;
