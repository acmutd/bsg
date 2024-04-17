import Difficulty from "@/app/models/Difficulty";

const useDifficultyButton = (
  difficulty: Difficulty,
  selectedDifficulty: Difficulty,
) => {
  const buttonColors = {
    [Difficulty.Easy]: {
      selected: "bg-green-500 hover:bg-green-500",
      default: "bg-gray-500 hover:bg-gray-700",
    },
    [Difficulty.Medium]: {
      selected: "bg-yellow-500 hover:bg-yellow-500",
      default: "bg-gray-500 hover:bg-gray-700",
    },
    [Difficulty.Hard]: {
      selected: "bg-red-500 hover:bg-red-500",
      default: "bg-gray-500 hover:bg-gray-700",
    },
  };

  const isSelected = selectedDifficulty === difficulty;
  const buttonClass = isSelected
    ? buttonColors[difficulty].selected
    : buttonColors[difficulty].default;

  return {
    buttonClass,
  };
};

export default useDifficultyButton;
