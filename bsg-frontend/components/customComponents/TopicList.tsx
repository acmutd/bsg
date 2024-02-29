import React from "react";
import Topic from "@/components/customComponents/Topic/Topic";

const TopicList = (props: { topics: Topic[] }) => {
    return (
        <div className={'flex flex-row space-x-2 flex-wrap '}>
            {props.topics.map((topic, index) => {
                return <Topic topic={topic} key={index}/>;
            })}
        </div>
    );
};

export default TopicList;
