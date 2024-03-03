import React from "react";
import useTopic from "@/components/customComponents/Topic/useTopic";

type Topic = {
    name: string;
    problemIDs?: string[];
    numberOfProblems: number;
    isSelected: boolean;
};
const Topic = (props: { topic: Topic }) => {
    const {isTopicSelected, handleTopicPress} = useTopic(props.topic.isSelected);
    return (
        <div>
            <button className={'flex flex-row space-x-2 mt-2'} onClick={handleTopicPress}>
                <p className={'mt-1 hover:underline font-thin'}>{props.topic.name}</p>
                <p className={`${isTopicSelected ? 'bg-primary' : 'bg-inputBackground brightness-150'}  p-1 pl-2 pr-2 rounded-2xl`}>{props.topic.numberOfProblems}</p>
            </button>
        </div>
    );
};

export default Topic;
