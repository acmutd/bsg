import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger
} from "@bsg/ui/dropdown-menu";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleDown} from "@fortawesome/free-solid-svg-icons";
import Difficulty from "@bsg/models/Difficulty";

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
    [Difficulty.Easy]: "difficulty-easy",
    [Difficulty.Medium]: "difficulty-medium",
    [Difficulty.Hard]: "difficulty-hard",
};

const DifficultyDropdown = (props: {
    position: string;
    setPosition: React.Dispatch<React.SetStateAction<Difficulty>>
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="btn-ghost inline-flex h-11 items-center gap-2.5 rounded-full px-4 text-sm font-medium"
                >
                    <span className="text-foreground/60">Difficulty</span>
                    <span className={`font-mono text-xs ${DIFFICULTY_CLASS[props.position as Difficulty] ?? ""}`}>
                        {props.position}
                    </span>
                    <FontAwesomeIcon icon={faAngleDown} className="h-3 w-3 text-foreground/50"/>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 glass-panel rounded-xl p-1.5">
                <DropdownMenuRadioGroup value={props.position}
                                        onValueChange={(difficulty: string) => props.setPosition(difficulty as Difficulty)}>
                    {[Difficulty.Easy, Difficulty.Medium, Difficulty.Hard].map((level) => (
                        <DropdownMenuRadioItem
                            key={level}
                            value={level}
                            className={`rounded-lg px-2.5 py-2 font-mono text-xs cursor-pointer ${DIFFICULTY_CLASS[level]}`}
                        >
                            {level}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default DifficultyDropdown;
