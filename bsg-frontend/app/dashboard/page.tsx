"use client"
import React from "react";
import SearchBar from "@/components/customComponents/searchbar/searchbar";
import DifficultyDropdown from "@/components/customComponents/difficultyDropdown/difficultyDropdown";
import Difficulty from "@/app/models/Difficulty";
import Topic from "@/components/customComponents/Topic/Topic";
import TopicList from "@/components/customComponents/TopicList";

const Dashboard = () => {
    const [difficulty, setDifficulty] = React.useState<Difficulty>(Difficulty.Easy);
    const topics: Topic[] = [
        {name: 'Arrays', numberOfProblems: 214, isSelected: false},
        {name: 'Arrays', numberOfProblems: 214, isSelected: false},
        {name: 'Arrays', numberOfProblems: 214, isSelected: false},
        {name: 'Arrays', numberOfProblems: 214, isSelected: false},
        {name: 'Arrays', numberOfProblems: 214, isSelected: false},
        {name: 'Arrays', numberOfProblems: 214, isSelected: false},
        {name: 'Arrays', numberOfProblems: 214, isSelected: false},
        {name: 'Arrays', numberOfProblems: 214, isSelected: false},
    ];
    // dummy data

    return (
        <div>
            <div className={'justify-center space-y-3 ml-3'}>
                <SearchBar/>
                <DifficultyDropdown position={difficulty} setPosition={setDifficulty}/>
                <TopicList topics={topics}/>
            </div>
        </div>
    );
};

export default Dashboard;
