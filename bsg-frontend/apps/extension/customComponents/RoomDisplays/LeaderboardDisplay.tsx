export const LeaderboardDisplay = ({ isActive }: { isActive: boolean }) => {
    return (
        <div className={` ${(isActive) ? '' : 'hidden'}`}>

        </div>
    );
};