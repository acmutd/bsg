"use client"
import React from "react";
import SearchBar from "@/components/customComponents/searchbar/searchbar";
import DifficultyDropdown from "@/components/customComponents/difficultyDropdown/difficultyDropdown";
import Difficulty from "@/app/models/Difficulty";

const Dashboard = () => {
    const [position, setPosition] = React.useState<Difficulty>(Difficulty.Easy);

    return (
        <div>
            <div className={'justify-center space-y-3'}>
                <SearchBar/>
                <DifficultyDropdown position={position} setPosition={setPosition}/>
            </div>
        </div>
    );
};

export default Dashboard;
