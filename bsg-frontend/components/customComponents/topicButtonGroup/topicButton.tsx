import React from "react";
import useTopic from "../Topic/useTopic";

type Topic = {
  name: string;
  problemIDs?: string[];
  numberOfProblems: number;
  isSelected: boolean;
};

const TopicButton = (props: {
  topic: Topic;
  selectedTopics: Topic[];
  onTopicsChange: (selectedTopics: Topic[]) => void;
}) => {
  const {isTopicSelected, handleTopicPress} = useTopic(props.topic.isSelected);

  const handleClick = () => {
    handleTopicPress();
    props.selectedTopics.push(props.topic);
    if (!isTopicSelected) {
      props.onTopicsChange(props.selectedTopics);
    } else {
      props.onTopicsChange(
        props.selectedTopics.filter((t) => t.name !== props.topic.name),
      );
    }
  };

  return (
    <div className="">
      <button
        className="flex flex-row mt-2 ml-2 bg-gray-500 hover:bg-gray-700 rounded-full"
        onClick={handleClick}>
        <p
          className={`p-1 py-1 px-4 rounded-2xl ${
            isTopicSelected ? "bg-primary" : ""
          }`}>
          {props.topic.name}
        </p>
      </button>
    </div>
  );
};

export default TopicButton;
