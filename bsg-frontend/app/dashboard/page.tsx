"use client"
import React from "react";
import SearchBar from "@/components/customComponents/searchbar/searchbar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {Button} from "@/components/ui/button"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAngleDown} from "@fortawesome/free-solid-svg-icons";

const Dashboard = () => {
    const [position, setPosition] = React.useState("Easy")

    return (
        <div>
            <div className={'justify-center space-y-3'}>
                <SearchBar/>
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
                        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                            <DropdownMenuRadioItem value='Easy'
                                                   className={'text-green-400'}>Easy</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Medium"
                                                   className={'text-yellow-400'}>Medium</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="Hard" className={'text-red-400'}>Hard</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default Dashboard;
