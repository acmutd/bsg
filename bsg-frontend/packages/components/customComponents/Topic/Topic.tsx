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
            type="button"
            aria-pressed={isTopicSelected}
            className={`inline-flex items-center gap-2 rounded-full border pl-3 pr-1.5 py-1 text-sm font-medium transition-all duration-200 ease-spring active:scale-95
            ${isTopicSelected
                ? 'border-signal/60 bg-signal text-primary-foreground shadow-glow-sm'
                : 'border-bsg-border bg-inputBackground/70 text-foreground/80 hover:border-signal/40 hover:text-foreground'}`}
            onClick={handleTopicPress}
        >
            <span>{topic.name}</span>
            <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[11px] leading-none
                ${isTopicSelected ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-white/[0.06] text-foreground/55'}`}
            >
                {topic.numberOfProblems}
            </span>
        </button>
    );
};

export default Topic;
