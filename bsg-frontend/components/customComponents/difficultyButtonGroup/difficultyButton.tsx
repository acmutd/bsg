import {Button} from "@/components/ui/button";
import Difficulty from "@/app/models/Difficulty";
import useDifficultyButton from "./useDifficultyButton";

interface DifficultyButtonProps {
  difficulty: Difficulty;
  selectedDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

const DifficultyButton = ({
  difficulty,
  selectedDifficulty,
  onDifficultyChange,
}: DifficultyButtonProps) => {
  const {buttonClass} = useDifficultyButton(difficulty, selectedDifficulty);

  return (
    <Button
      size="sm"
      className={`rounded-full text-sm ${buttonClass}`}
      onClick={() => onDifficultyChange(difficulty)}>
      <span className="px-1">{difficulty}</span>
    </Button>
  );
};

export default DifficultyButton;
