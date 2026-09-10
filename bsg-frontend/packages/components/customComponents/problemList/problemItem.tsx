import React from 'react';
import Link from 'next/link';
import Difficulty from '@bsg/models/Difficulty';

type ProblemItem = {
    id: string;
    name: string;
    acceptance: number;
    difficulty: Difficulty;
    tags?: string[];
    topic?: string;
    description: string;
    examples?: [{ input: string; output: string; explanation: string }];
    constraints?: string;
};
const ProblemItem = ({problemItem}: { problemItem: ProblemItem }) => {
    const {id, name, acceptance, difficulty, tags, topic} = problemItem;
    const displayTags = (tags && tags.length > 0) ? tags : (topic ? [topic] : []);

    let difficultyColorClass = '';
    switch (difficulty) {
        case Difficulty.Easy:
            difficultyColorClass = 'difficulty-easy'; // 초록색
            break;
        case Difficulty.Medium:
            difficultyColorClass = 'difficulty-medium'; // 노란색
            break;
        case Difficulty.Hard:
            difficultyColorClass = 'difficulty-hard'; // 빨간색
            break;
        default:
            difficultyColorClass = 'text-foreground/50'; // 기본색
    }

    return (
        <Link href={`/apps/web/app/problem/${id}`} className='block'>
            <div
                className='row-link grid grid-cols-2 sm:grid-cols-12 gap-x-4 gap-y-1.5 items-center rounded-xl border border-white/[0.05] bg-white/[0.03] px-4 py-3'>
                <div className='col-span-2 sm:col-span-5 min-w-0 truncate text-sm font-medium'>
                    <span className='font-mono text-xs text-foreground/45 mr-2'>{id}.</span>
                    {name}
                </div>
                <div className='col-span-2 sm:col-span-3 flex flex-wrap gap-1'>
                    {displayTags.map((tag) => (
                        <span
                            key={`${id}-${tag}`}
                            className='inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.04] px-2 py-0.5 text-[11px] text-foreground/60'
                        >
                            {tag}
                        </span>
                    ))}
                </div>
                <div className='sm:col-span-2 font-mono text-xs text-foreground/60 tabular-nums'>
                    {`${acceptance}%`}
                </div>
                <div className={`sm:col-span-2 text-right sm:text-left font-mono text-xs ${difficultyColorClass}`}>
                    {difficulty}
                </div>
            </div>
        </Link>
    );
};
export default ProblemItem;
