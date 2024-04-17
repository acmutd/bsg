import Difficulty from "@/app/models/Difficulty";
import {useState} from "react";
import DifficultyButton from "./difficultyButton";

const DifficultyButtonGroup = (props: {
  selectedDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}) => {
  const {Easy, Medium, Hard} = Difficulty;

  return (
    <>
      {[Easy, Medium, Hard].map((diff) => (
        <DifficultyButton
          key={diff}
          difficulty={diff}
          selectedDifficulty={props.selectedDifficulty}
          onDifficultyChange={props.onDifficultyChange}
        />
      ))}
    </>
  );
};

export default DifficultyButtonGroup;
