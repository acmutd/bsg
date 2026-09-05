import Difficulty from "@bsg/models/Difficulty";
import React from "react";

export const NumberOfProblemsWithDifficultyLabel = ({difficulty, num, disabled}: { difficulty: Difficulty; num: number; disabled?: boolean }) => {
    // TODO: also existing component in packages (try to reuse)
    const getColorClass = (diff: Difficulty) => {
        if (disabled) return 'text-gray-500'
        switch (diff) {
            case Difficulty.Easy:
                return 'text-green-500'
            case Difficulty.Medium:
                return 'text-yellow-500'
            case Difficulty.Hard:
                return 'text-red-500'
            default:
                return 'text-gray-500'
        }
    }
    return <span className={`text-lg font-medium ${getColorClass(difficulty)}`}>{difficulty}: {num}</span>
}
