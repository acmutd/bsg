import React, {useState} from "react";
import Topic from "@/components/customComponents/Topic/Topic";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faAnglesDown, faAnglesUp} from "@fortawesome/free-solid-svg-icons";

type TopicListProps = {
    topics: Topic[];
    maxVisible?: number;
};

const TopicList = ({topics, maxVisible = 5}: TopicListProps) => {
    const [expanded, setExpanded] = useState(false);

    const visibleTopics = expanded ? topics : topics.slice(0, maxVisible);

    return (
        <div className="relative w-full max-w-[650px]">
            <div className="flex flex-wrap gap-2">
                {visibleTopics.map((topic, index) => (
                    <Topic topic={topic} key={index}/>
                ))}

                {topics.length > maxVisible && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-3 py-1 text-sm font-medium rounded-full transition bg-inputBackground hover:opacity-75 flex items-center"
                    >
                        {expanded ? <FontAwesomeIcon icon={faAnglesUp}/> : <FontAwesomeIcon icon={faAnglesDown}/>}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TopicList;
