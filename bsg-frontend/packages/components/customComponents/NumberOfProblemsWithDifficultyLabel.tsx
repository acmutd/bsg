import {Label} from "@bsg/ui/label";
import Difficulty from "@bsg/models/Difficulty";

const NumberOfProblemsWithDifficultyLabel = (props: { difficulty: Difficulty, num: number }) => {
    return (
        <div>
            <Label className="text-lg px-2 pr-0 rounded-md ">
                {props.difficulty}
            </Label>
            <Label className="text-lg px-2 rounded-md text-gray-500">
                x{props.num}
            </Label>
        </div>
    );
};

export default NumberOfProblemsWithDifficultyLabel;
