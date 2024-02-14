import React from "react";

type Topic = {
    name: string;
    problemIDs?: string[];
    numberOfProblems: number;
};
const Topic = (props: { topic: Topic; isSelected: boolean }) => {
    return (
        <div className={'flex flex-row space-x-2 mt-2'}>
            <p className={'mt-1 hover:underline font-thin'}>{props.topic.name}</p>
            <p className={`${props.isSelected ? 'bg-primary' : 'bg-inputBackground brightness-150'}  p-1 pl-2 pr-2 rounded-2xl`}>{props.topic.numberOfProblems}</p>
        </div>
    );
};

export default Topic;
