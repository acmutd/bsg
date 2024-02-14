import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleDown} from "@fortawesome/free-solid-svg-icons";
import Difficulty from "@/app/models/Difficulty";

const DifficultyDropdown = (props: {
    position: string;
    setPosition: React.Dispatch<React.SetStateAction<Difficulty>>
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className={'flex-row'}>
                    <Button
                        className={'space-x-2 bg-inputBackground hover:brightness-125 hover:bg-inputBackground'}>
                        <p>Difficulty</p>
                        <FontAwesomeIcon icon={faAngleDown}/>
                    </Button>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-inputBackground">
                <DropdownMenuRadioGroup value={props.position}
                                        onValueChange={(difficulty: string) => props.setPosition(difficulty as Difficulty)}>
                    <DropdownMenuRadioItem value={Difficulty.Easy}
                                           className={'text-green-400'}>{Difficulty.Easy}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={Difficulty.Medium}
                                           className={'text-yellow-400'}>{Difficulty.Medium}</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value={Difficulty.Hard}
                                           className={'text-red-400'}>{Difficulty.Hard}</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default DifficultyDropdown;
