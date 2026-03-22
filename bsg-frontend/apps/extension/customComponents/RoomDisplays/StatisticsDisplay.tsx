export const StatisticsDisplay = ({ isActive }: { isActive: boolean }) => {
    return (
        <div className={` ${(isActive) ? '' : 'hidden'}`}>

        </div>
    );
};