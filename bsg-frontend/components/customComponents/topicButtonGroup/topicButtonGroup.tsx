import {useState} from "react";
import TopicButton from "./topicButton";
import Topic from "../Topic/Topic";

const TopicButtonGroup = (props: {
  topics: Topic[];
  selectedTopics: Topic[];
  onTopicsChange: (selectedTopics: Topic[]) => void;
}) => {
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);

  return (
    <div className={"flex flex-row flex-wrap text-sm"}>
      {props.topics.map((topic, index) => {
        return (
          <TopicButton
            topic={topic}
            key={index}
            selectedTopics={selectedTopics}
            onTopicsChange={props.onTopicsChange}
          />
        );
      })}
    </div>
  );
};

export default TopicButtonGroup;
