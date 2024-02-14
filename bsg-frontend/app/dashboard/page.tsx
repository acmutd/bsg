"use client"
import React from "react";
import SearchBar from "@/components/customComponents/searchbar/searchbar";
import DifficultyDropdown from "@/components/customComponents/difficultyDropdown/difficultyDropdown";
import Difficulty from "@/app/models/Difficulty";
import Topic from "@/components/customComponents/Topic/Topic";

const Dashboard = () => {
    const [position, setPosition] = React.useState<Difficulty>(Difficulty.Easy);

    return (
        <div>
            <div className={'justify-center space-y-3 ml-3'}>
                <SearchBar/>
                <DifficultyDropdown position={position} setPosition={setPosition}/>
                <div className={'flex flex-row space-x-2 flex-wrap '}>
                    <Topic topic={{name: 'Arrays', numberOfProblems: 213}} isSelected={false}/>
                    <Topic topic={{name: 'Hash Table', numberOfProblems: 12}} isSelected={true}/>
                    <Topic topic={{name: 'Sorting', numberOfProblems: 53}} isSelected={false}/>
                    <Topic topic={{name: 'Arrays', numberOfProblems: 213}} isSelected={false}/>
                    <Topic topic={{name: 'Arrays', numberOfProblems: 213}} isSelected={false}/>
                    <Topic topic={{name: 'Hash Table', numberOfProblems: 12}} isSelected={true}/>
                    <Topic topic={{name: 'Sorting', numberOfProblems: 53}} isSelected={false}/>
                    <Topic topic={{name: 'Hash Table', numberOfProblems: 12}} isSelected={true}/>
                    <Topic topic={{name: 'Sorting', numberOfProblems: 53}} isSelected={false}/>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
