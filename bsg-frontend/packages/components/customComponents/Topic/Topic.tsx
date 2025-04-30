import React from "react";
import useTopic from "@bsg/components/Topic/useTopic";

type Topic = {
    name: string;
    problemIDs?: string[];
    numberOfProblems: number;
    isSelected: boolean;
};

const Topic = ({topic}: { topic: Topic }) => {
    const {isTopicSelected, handleTopicPress} = useTopic(topic.isSelected);

    return (
        <button
            className={`flex items-center space-x-2 px-3 py-1 rounded-full transition 
            ${isTopicSelected ? 'bg-primary text-white border-primary' : 'bg-inputBackground  hover:opacity-75'}`}
            onClick={handleTopicPress}
        >
            <span className="text-sm font-medium">{topic.name}</span>
            <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full 
                ${isTopicSelected ? 'bg-white text-primary' : 'bg-gray-300 text-gray-700 opacity-75'}`}
            >
                {topic.numberOfProblems}
            </span>
        </button>
    );
};

export default Topic;
