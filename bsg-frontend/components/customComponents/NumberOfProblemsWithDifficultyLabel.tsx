import {Label} from "@/components/ui/label";
import Difficulty from "@/app/models/Difficulty";

const NumberOfProblemsWithDifficultyLabel = (props: { difficulty: Difficulty, num: number }) => {
    return (
        <div>
            <Label className="text-lg px-2 pr-0 py-1 rounded-md ">
                {props.difficulty}
            </Label>
            <Label className="text-lg px-2 py-1 rounded-md text-gray-500">
                x{props.num}
            </Label>
        </div>
    );
};

export default NumberOfProblemsWithDifficultyLabel;
