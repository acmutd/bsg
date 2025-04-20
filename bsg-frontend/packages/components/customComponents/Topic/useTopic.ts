import {useState} from "react";

const useTopic = (isSelected: boolean) => {
    const [isTopicSelected, setIsTopicSelected] = useState(isSelected);

    const handleTopicPress = () => {
        setIsTopicSelected(!isTopicSelected);
        // filter results based on topic selection
    };

    return {
        isTopicSelected,
        handleTopicPress,
    };
};

export default useTopic;
