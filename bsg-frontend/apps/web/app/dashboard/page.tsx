"use client";
import React from "react";
import SearchBar from "@bsg/components/searchbar/searchbar";
import DifficultyDropdown from "@bsg/components/difficultyDropdown/difficultyDropdown";
import Difficulty from "@bsg/models/Difficulty";
import Topic from "@bsg/components/Topic/Topic";
import TopicList from "@bsg/components/TopicList";
import RoomItem from "@bsg/components/roomList/roomItem";
import RoomList from "@bsg/components/roomList/roomList";
import ProblemList from "@bsg/components/problemList/problemList";
import problemItem from "@bsg/components/problemList/problemItem";
import QuickStart from "@bsg/components/quickStart/quickStart";

const Dashboard = () => {
    const [difficulty, setDifficulty] = React.useState<Difficulty>(
        Difficulty.Easy,
    );
    const [problemPage, setProblemPage] = React.useState(0);

    const topics: Topic[] = [
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
    ];
    const roomList: RoomItem[] = [
        {
            id: "1",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "2",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "3",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "4",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "5",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "6",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "7",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "8",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "9",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
        {
            id: "10",
            problemIDs: ["Two Sum", "Two Sum", "Two Sum"],
            status: true,
            userIDs: ["Jessica Choi", "Jessica Choi", "Jessica Choi", "Jessica Choi"],
        },
    ];
    const problemList: problemItem[] = [
        {
            id: "1",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "2",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Medium,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "3",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Hard,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "4",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "5",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "6",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "7",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "8",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "9",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "10",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "11",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "12",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "13",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "14",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "15",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "16",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
        {
            id: "17",
            name: "Two Sum",
            acceptance: 100,
            difficulty: Difficulty.Easy,
            topic: "hashmap",
            description:
                "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
        },
    ];
    // dummy data

    return (
        <div className="flex">
            <div className={"w-full m-5 flex flex-col space-y-8"}>
                <div className={"flex row-auto space-x-2"}>
                    <SearchBar/>
                    <DifficultyDropdown position={difficulty} setPosition={setDifficulty}/>
                    <QuickStart/>
                </div>
                <TopicList topics={topics}/>
                <ProblemList problemList={problemList} page={problemPage}/>
            </div>
            <div className="mr-5 mt-5 mb-5g">
                <RoomList roomList={roomList}/>
            </div>
        </div>
    );
};

export default Dashboard;
