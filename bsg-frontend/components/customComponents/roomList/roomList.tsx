import React from "react";
import RoomItem from "./roomItem";
import CreateRoomTriggerButton from "../createRoomDialog/createRoomTriggerButton";
import {Dialog} from "@/components/ui/dialog";
import {CreateRoomDialog} from "../createRoomDialog/createRoomDialog";

const RoomList = (props: {roomList: RoomItem[]}) => {
  return (
    <>
      <div className="bg-inputBackground p-4 rounded-md w-80 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-2">
          <p className="text-2xl my-2 font-black">Rooms</p>
          <Dialog>
            <CreateRoomTriggerButton />
            <CreateRoomDialog />
          </Dialog>
        </div>
        <div className="flex flex-col space-y-4">
          {props.roomList.map((it, index) => (
            <RoomItem roomItem={it} key={index} />
          ))}
        </div>
      </div>
    </>
  );
};

export default RoomList;
