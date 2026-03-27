export const RoomInfoDisplay = ({ isActive }: { isActive: boolean }) => {
    return (
        <div className={` ${(isActive) ? '' : 'hidden'}`}>

        </div>
    );
};