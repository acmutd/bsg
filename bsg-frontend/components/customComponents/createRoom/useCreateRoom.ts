import {useState} from "react";
import Topic from "@/components/customComponents/Topic/Topic";

const useCreateRoom = () => {
    const [numberOfEasyProblems, setNumberOfEasyProblems] = useState(1);
    const [numberOfMediumProblems, setNumberOfMediumProblems] = useState(0);
    const [numberOfHardProblems, setNumberOfHardProblems] = useState(0);
    const [duration, setDuration] = useState(30);
    const minNumberOfProblems: number = 0;
    const maxNumberOfProblems: number = 10;

    const handleSubmit = () => {
        console.log({easy: numberOfEasyProblems, medium: numberOfMediumProblems, hard: numberOfHardProblems, duration});
    };

    // delete this later
    const topics: Topic[] = [
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
        {name: "Arrays", numberOfProblems: 214, isSelected: false},
    ];

    const decrementEasy = () => {
        setNumberOfEasyProblems(Math.max(minNumberOfProblems, numberOfEasyProblems - 1))
    }
    const incrementEasy = () => {
        setNumberOfEasyProblems(Math.min(maxNumberOfProblems, numberOfEasyProblems + 1))
    }
    const decrementMedium = () => {
        setNumberOfMediumProblems(Math.max(minNumberOfProblems, numberOfMediumProblems - 1));
    }
    const incrementMedium = () => {
        setNumberOfMediumProblems(Math.min(maxNumberOfProblems, numberOfMediumProblems + 1))
    }
    const decrementHard = () => {
        setNumberOfHardProblems(Math.max(minNumberOfProblems, numberOfHardProblems - 1))
    }
    const incrementHard = () => {
        setNumberOfHardProblems(Math.min(maxNumberOfProblems, numberOfHardProblems + 1))
    }

    return {
        numberOfEasyProblems,
        numberOfMediumProblems,
        numberOfHardProblems,
        topics,
        duration,
        handleSubmit,
        setDuration,
        decrementEasy,
        incrementEasy,
        decrementMedium,
        incrementMedium,
        decrementHard,
        incrementHard,
    };
}

export default useCreateRoom;
