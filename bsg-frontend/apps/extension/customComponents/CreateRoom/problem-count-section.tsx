import {Dispatch, SetStateAction} from 'react'
import {Checkbox} from "@bsg/ui/checkbox"
import {
    Field,
    FieldContent,
    FieldGroup,
    FieldLabel,
} from "@bsg/ui/field"
import Difficulty from "@bsg/models/Difficulty"
import {IncDecButtons} from "@/customComponents/CreateRoom/inc-dec-buttons"
import {NumberOfProblemsWithDifficultyLabel} from "@/customComponents/number-of-problems-with-difficulty-label"

const MAX_ANY_DIFFICULTY = 10
const MIN_ANY_DIFFICULTY = 1

type ProblemCountSectionProps = {
    numberOfEasyProblems: number;
    numberOfMediumProblems: number;
    numberOfHardProblems: number;
    setNumberOfEasyProblems: Dispatch<SetStateAction<number>>;
    setNumberOfMediumProblems: Dispatch<SetStateAction<number>>;
    setNumberOfHardProblems: Dispatch<SetStateAction<number>>;
    anyDifficulty: boolean;
    setAnyDifficulty: Dispatch<SetStateAction<boolean>>;
    anyDifficultyCount: number;
    setAnyDifficultyCount: Dispatch<SetStateAction<number>>;
    increment: (setter: (num: number) => void, current: number) => void;
    decrement: (setter: (num: number) => void, current: number) => void;
    onTouch: () => void;
};

// How many problems of each difficulty the round should pull. Picking "Any
// Difficulty" ignores the per-difficulty counts, so those controls grey out.
export const ProblemCountSection = ({
    numberOfEasyProblems,
    numberOfMediumProblems,
    numberOfHardProblems,
    setNumberOfEasyProblems,
    setNumberOfMediumProblems,
    setNumberOfHardProblems,
    anyDifficulty,
    setAnyDifficulty,
    anyDifficultyCount,
    setAnyDifficultyCount,
    increment,
    decrement,
    onTouch,
}: ProblemCountSectionProps) => {
    const difficultyRows = [
        {
            difficulty: Difficulty.Easy,
            num: numberOfEasyProblems,
            setNum: setNumberOfEasyProblems,
        },
        {
            difficulty: Difficulty.Medium,
            num: numberOfMediumProblems,
            setNum: setNumberOfMediumProblems,
        },
        {
            difficulty: Difficulty.Hard,
            num: numberOfHardProblems,
            setNum: setNumberOfHardProblems,
        },
    ]

    return (
        <div className="space-y-3">
            {difficultyRows.map(({difficulty, num, setNum}) => (
                <div key={difficulty} className="flex items-center justify-between gap-3">
                    <span className="shrink-0 whitespace-nowrap">
                        <NumberOfProblemsWithDifficultyLabel
                            difficulty={difficulty}
                            num={num}
                            disabled={anyDifficulty}
                        />
                    </span>
                    <IncDecButtons
                        disabled={anyDifficulty}
                        decrementOnClick={() => {
                            onTouch()
                            decrement(setNum, num)
                        }}
                        incrementOnClick={() => {
                            onTouch()
                            increment(setNum, num)
                        }}
                    />
                </div>
            ))}

            {/* Any difficulty */}
            <div className="flex items-center justify-between gap-3">
                <FieldGroup>
                    <Field orientation={'horizontal'}>
                        <Checkbox
                            id="any-difficulty-checkbox"
                            checked={anyDifficulty}
                            onCheckedChange={(checked: boolean) => {
                                onTouch()
                                setAnyDifficulty(checked)
                            }}
                        />
                        <FieldContent>
                            <FieldLabel htmlFor="any-difficulty-checkbox" className="text-base">
                                Any Difficulty: {anyDifficultyCount}
                            </FieldLabel>
                        </FieldContent>
                    </Field>
                </FieldGroup>
                <IncDecButtons
                    decrementOnClick={() => {
                        onTouch()
                        setAnyDifficultyCount(Math.max(MIN_ANY_DIFFICULTY, anyDifficultyCount - 1))
                    }}
                    incrementOnClick={() => {
                        onTouch()
                        setAnyDifficultyCount(Math.min(MAX_ANY_DIFFICULTY, anyDifficultyCount + 1))
                    }}
                />
            </div>
        </div>
    )
}
