import React, {useState} from 'react';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAngleLeft, faAngleRight} from '@fortawesome/free-solid-svg-icons';
import ProblemItem from './problemItem';
import {Button} from '@/components/ui/button';
import TooltipWrapper from "@/components/customComponents/TooltipWrapper";

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
    return (
        <div className='bg-inputBackground p-4 rounded-md overflow-y-auto'>
            <div className='flex justify-between'>
                <p className='text-2xl font-medium mb-2 ml-2'>Problems</p>
                <div className='flex space-x-2'>
                    <TooltipWrapper text={"Previous"}>
                        <Button size='sm' onClick={handlePrevPage}>
                            <FontAwesomeIcon icon={faAngleLeft}/>
                        </Button>
                    </TooltipWrapper>
                    <TooltipWrapper text={"Next"}>
                        <Button size='sm' onClick={handleNextPage}>
                            <FontAwesomeIcon icon={faAngleRight}/>
                        </Button>
                    </TooltipWrapper>
                </div>
            </div>
            <div className='px-3 grid grid-cols-9 gap-4 mb-2'>
                <p className='grid grid-cols-subgrid gap-4 col-span-5'>Title</p>
                <p className='grid grid-cols-subgrid gap-4 col-span-2'>Acceptance</p>
                <p className='grid grid-cols-subgrid gap-4 col-span-2'>Difficulty</p>
            </div>
            <div className='flex flex-col space-y-4'>
                {currentProblems.map((it, index) => (
                    <ProblemItem problemItem={it} key={index}/>
                ))}
            </div>
        </div>
    );
};

export default ProblemList;
