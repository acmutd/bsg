import Link from 'next/link';
import Difficulty from '@bsg/models/Difficulty';

type ProblemItem = {
    id: string;
    name: string;
    acceptance: number;
    difficulty: Difficulty;
    topic?: string;
    description: string;
    examples?: [{ input: string; output: string; explanation: string }];
    constraints?: string;
};
const ProblemItem = ({problemItem}: { problemItem: ProblemItem }) => {
    const {id, name, acceptance, difficulty} = problemItem;

    let difficultyColorClass = '';
    switch (difficulty) {
        case Difficulty.Easy:
            difficultyColorClass = 'text-green-400'; // 초록색
            break;
        case Difficulty.Medium:
            difficultyColorClass = 'text-yellow-400'; // 노란색
            break;
        case Difficulty.Hard:
            difficultyColorClass = 'text-red-400'; // 빨간색
            break;
        default:
            difficultyColorClass = 'text-gray-400'; // 기본색
    }

    return (
        <Link href={`/apps/web/app/problem/${id}`}>
            <div
                className='grid grid-cols-9 gap-4 bg-background px-4 py-2 rounded-md text-primary-foreground hover:bg-background/70'>
                <div className='grid grid-cols-subgrid gap-4 col-span-5'>{`${id}. ${name}`}</div>
                <div className='grid grid-cols-subgrid gap-4 col-span-2'>
                    {`${acceptance}%`}
                </div>
                <div
                    className={`grid grid-cols-subgrid gap-4 col-span-2 ${difficultyColorClass}`}>
                    {difficulty}
                </div>
            </div>
        </Link>
    );
};
export default ProblemItem;
