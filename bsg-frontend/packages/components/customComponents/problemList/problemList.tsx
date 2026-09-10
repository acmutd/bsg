import React, {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAngleLeft, faAngleRight} from '@fortawesome/free-solid-svg-icons';
import ProblemItem from './problemItem';
import { TooltipWrapper } from "@bsg/components/TooltipWrapper";

interface ProblemListProps {
    problemList: ProblemItem[];
    page: number;
}

const ProblemList = ({problemList, page}: ProblemListProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const problemsPerPage = 10;
    const indexOfLastProblem = currentPage * problemsPerPage;
    const indexOfFirstProblem = indexOfLastProblem - problemsPerPage;
    const currentProblems = problemList.slice(
        indexOfFirstProblem,
        indexOfLastProblem,
    );

    const totalPages = Math.ceil(problemList.length / problemsPerPage);
    const handlePrevPage = () => {
        currentPage > 1 && setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        currentPage < totalPages && setCurrentPage(currentPage + 1);
    };

    const pagerButton = 'btn-ghost inline-flex h-8 w-8 items-center justify-center rounded-full text-xs disabled:opacity-35 disabled:hover:translate-y-0';

    return (
        <div className='surface-panel rounded-2xl p-4 sm:p-5 min-w-0'>
            <div className='flex items-center justify-between mb-4 px-1'>
                <div>
                    <p className='eyebrow mb-1'>Practice</p>
                    <p className='font-display text-xl font-semibold tracking-tight'>Problems</p>
                </div>
                <div className='flex items-center gap-2'>
                    <span className='font-mono text-xs text-foreground/45 tabular-nums'>
                        {Math.min(currentPage, Math.max(totalPages, 1))} / {Math.max(totalPages, 1)}
                    </span>
                    <TooltipWrapper text={"Previous"}>
                        <button type='button' aria-label='Previous page' className={pagerButton}
                                onClick={handlePrevPage} disabled={currentPage <= 1}>
                            <FontAwesomeIcon icon={faAngleLeft}/>
                        </button>
                    </TooltipWrapper>
                    <TooltipWrapper text={"Next"}>
                        <button type='button' aria-label='Next page' className={pagerButton}
                                onClick={handleNextPage} disabled={currentPage >= totalPages}>
                            <FontAwesomeIcon icon={faAngleRight}/>
                        </button>
                    </TooltipWrapper>
                </div>
            </div>
            <div className='hidden sm:grid px-4 grid-cols-12 gap-4 mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-foreground/40'>
                <p className='col-span-5'>Title</p>
                <p className='col-span-3'>Tags</p>
                <p className='col-span-2'>Acceptance</p>
                <p className='col-span-2'>Difficulty</p>
            </div>
            <div className='flex flex-col gap-1.5'>
                {currentProblems.map((it, index) => (
                    <div key={index} className='reveal' style={{'--i': index} as React.CSSProperties}>
                        <ProblemItem problemItem={it}/>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProblemList;
