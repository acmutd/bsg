import {Dispatch, SetStateAction, useState} from "react";
import Topic from "@bsg/components/Topic/Topic";

const useCreateRoom = () => {
    const [numberOfEasyProblems, setNumberOfEasyProblems] = useState(1);
    const [numberOfMediumProblems, setNumberOfMediumProblems] = useState(0);
    const [numberOfHardProblems, setNumberOfHardProblems] = useState(0);
    const [duration, setDuration] = useState(30);
    const [total, setTotal] = useState(1); // total must be between 1 and 10 problems
    const minNumberOfProblems: number = 0;
    const maxNumberOfProblems: number = 10;

    const handleSubmit = () => {
        console.log({easy: numberOfEasyProblems, medium: numberOfMediumProblems, hard: numberOfHardProblems, duration});
    };

    // dummy data
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

    const decrement = (set: Dispatch<SetStateAction<number>>, num: number) => {
        if (total <= 1 || num <= minNumberOfProblems) {
            return;
        }
        set(num - 1);
        setTotal(total - 1);
    }

    const increment = (set: Dispatch<SetStateAction<number>>, num: number) => {
        if (total >= maxNumberOfProblems) {
            return;
        }
        set(num + 1);
        setTotal(total + 1);
    }

    const decrementEasy = () => {
        decrement(setNumberOfEasyProblems, numberOfEasyProblems);
    }
    const incrementEasy = () => {
        increment(setNumberOfEasyProblems, numberOfEasyProblems);
    }
    const decrementMedium = () => {
        decrement(setNumberOfMediumProblems, numberOfMediumProblems);
    }
    const incrementMedium = () => {
        increment(setNumberOfMediumProblems, numberOfMediumProblems);
    }
    const decrementHard = () => {
        decrement(setNumberOfHardProblems, numberOfHardProblems);
    }
    const incrementHard = () => {
        increment(setNumberOfHardProblems, numberOfHardProblems);
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
