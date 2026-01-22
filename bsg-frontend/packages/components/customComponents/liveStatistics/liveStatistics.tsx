import React, { useState, useMemo } from 'react';
import ProblemStatistics from "./problemStatistics";
import Leaderboard from "./leaderboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import { cn } from "@bsg/lib/utils"
import { Participant } from '@bsg/models/Participant';
import { Problem } from '@bsg/models/Problem';

type LiveStatisticsProps = {
    participants: Participant[]
    problems: Problem[]
    className?: String
}

const LiveStatistics = ({ participants, problems, className }: LiveStatisticsProps) => {

    const [selectedProblem, setSelectedProblem] = useState(0)
    const [completedProblem, setCompletedProblem] = useState(-1)
    //const completedProblem = 1

    const incrementProblem = () => {
        setCompletedProblem(completedProblem + 1)
    }
    const decrementProblem = () => {
        setCompletedProblem(completedProblem - 1)
    }

    const solving = participants.filter(participant =>
        participant.currentProblemIndex == selectedProblem
    )
    const submitted = participants.filter(participant =>
        participant.currentProblemIndex == null || 
        participant.currentProblemIndex > selectedProblem
    )

    return (
        <div className={cn("flex flex-col items-center p-4 gap-4", className)}>

            {/* Timer */}
            <div className="flex px-4 py-3 gap-2 rounded-xl bg-muted/5 items-center">
                <div className="text-3xl tracking-wider leading-none">
                    60:00
                </div>
                <FontAwesomeIcon icon={faClock} className="h-5 w-5" />
            </div>

            <div className="flex gap-1">
                <button className="rounded px-1 bg-muted/10" onClick={decrementProblem}>{"<"}</button>
                <button className="rounded px-1 bg-muted/10" onClick={incrementProblem}>{">"}</button>
            </div>

            {/* Problem Selection & Progress Bar */}
            <div className="relative flex w-fit gap-4">
                {problems.map((problem, i) => (
                    <button
                        key={problem.id}
                        onClick={() => setSelectedProblem(i)}
                        className={cn(
                            i <= completedProblem ? (
                                problem.difficulty == 0
                                    ? "border-green-500"
                                    : problem.difficulty == 1
                                        ? "border-yellow-500"
                                        : "border-red-500"
                            ) : (
                                problem.difficulty == 0
                                    ? "border-green-800"
                                    : problem.difficulty == 1
                                        ? "border-yellow-800"
                                        : "border-red-800"
                            ),
                            i == selectedProblem && " drop-shadow-[0_0_5px_rgba(255,255,255,0.75)]",
                            " flex h-6 w-6 border-4 rounded-full bg-muted hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.75)] transition-[filter] duration-300"
                        )}
                    />
                ))}
                <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-1 bg-muted pointer-events-none" />
            </div>

            <ProblemStatistics
                problem={problems[selectedProblem]}
                solving={solving}
                submitted={submitted}
            />
            <Leaderboard participants={participants} />
        </div>
    )
}

export default LiveStatistics;