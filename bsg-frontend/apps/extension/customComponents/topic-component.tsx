import React from "react";
import {Topic} from "@/pages/room-choice";

export const TopicComponent = ({topic, toggle}: { topic: Topic; toggle: () => void }) => {
    // TODO: try to use the existing topic component in packages folder, refactor this
    return (
        <button
            className={`flex items-center space-x-2 px-3 py-1 rounded-full transition 
            ${topic.isSelected ? 'bg-primary text-white border-primary' : 'bg-inputBackground  hover:opacity-75'}`}
            onClick={toggle}
        >
            <span className="text-sm font-medium">{topic.name}</span>
            <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full 
                ${topic.isSelected ? 'bg-white text-primary' : 'bg-gray-300 text-gray-700 opacity-75'}`}
            >
                {topic.numberOfProblems}
            </span>
        </button>
    )
}
