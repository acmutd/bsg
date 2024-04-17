"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import DifficultyButtonGroup from "../difficultyButtonGroup/difficultyButtonGroup";
import Topic from "../Topic/Topic";
import TopicButtonGroup from "../topicButtonGroup/topicButtonGroup";
import Difficulty from "@/app/models/Difficulty";

export function CreateRoomDialog() {
  const topics: Topic[] = [
    {name: "Arrays", numberOfProblems: 214, isSelected: false},
    {name: "Linked List", numberOfProblems: 214, isSelected: false},
    {name: "Dynamic Programming", numberOfProblems: 214, isSelected: false},
    {name: "Stack", numberOfProblems: 214, isSelected: false},
    {name: "Two Pointers", numberOfProblems: 214, isSelected: false},
    {name: "Sliding Window", numberOfProblems: 214, isSelected: false},
    {name: "Backtracking", numberOfProblems: 214, isSelected: false},
    {name: "Heap", numberOfProblems: 214, isSelected: false},
    {name: "Trees", numberOfProblems: 214, isSelected: false},
  ];

  const [formData, setFormData] = useState({
    roomname: "",
    difficulty: Difficulty.Easy,
    topics: [] as Topic[],
  });

  const handleRoomnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({...formData, roomname: e.target.value});
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    setFormData({...formData, difficulty});
  };

  const handleTopicsChange = (selectedTopics: Topic[]) => {
    setFormData({...formData, topics: selectedTopics});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <DialogContent className="md:max-w-[525px]">
      <DialogHeader>
        <DialogTitle className="text-xl">Create room</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="roomname" className="text-right">
              Room Name
            </Label>
            <Input
              id="roomname"
              className="col-span-3"
              value={formData.roomname}
              onChange={handleRoomnameChange}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Difficulty
            </Label>
            <div className="flex space-x-2">
              <DifficultyButtonGroup
                selectedDifficulty={formData.difficulty}
                onDifficultyChange={handleDifficultyChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="topics" className="text-right">
              Topics
            </Label>
            <div className="flex col-span-3 overflow-y-auto h-36">
              <TopicButtonGroup
                topics={topics}
                selectedTopics={formData.topics}
                onTopicsChange={handleTopicsChange}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Create Room</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
