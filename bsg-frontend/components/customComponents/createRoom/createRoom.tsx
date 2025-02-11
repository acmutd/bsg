'use client';

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Slider} from "@/components/ui/slider";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus} from "@fortawesome/free-solid-svg-icons";
import IncDecButtons from "@/components/customComponents/IncDecButtons";
import NumberOfProblemsWithDifficultyLabel from "@/components/customComponents/NumberOfProblemsWithDifficultyLabel";
import Difficulty from "@/app/models/Difficulty";

const CreateRoom = () => {
    const [numberOfEasyProblems, setNumberOfEasyProblems] = useState(1);
    const [numberOfMediumProblems, setNumberOfMediumProblems] = useState(0);
    const [numberOfHardProblems, setNumberOfHardProblems] = useState(0);
    const [duration, setDuration] = useState(30);
    const minNumberOfProblems: number = 0;
    const maxNumberOfProblems: number = 10;

    const handleSubmit = () => {
        console.log({easy: numberOfEasyProblems, medium: numberOfMediumProblems, hard: numberOfHardProblems, duration});
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size='sm' className='text-base'>
                    <span className='pr-1'>Create</span>
                    <FontAwesomeIcon icon={faPlus} className="pl-1"/>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Room</DialogTitle>
                    <DialogDescription>Customize your room settings.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between">
                        <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Easy} num={numberOfEasyProblems}/>
                        <IncDecButtons
                            decrementOnClick={() => setNumberOfEasyProblems(Math.max(minNumberOfProblems, numberOfEasyProblems - 1))}
                            incrementOnClick={() => setNumberOfEasyProblems(Math.min(maxNumberOfProblems, numberOfEasyProblems + 1))}/>
                    </div>

                    <div className="flex items-center justify-between">
                        <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Medium}
                                                             num={numberOfMediumProblems}/>
                        <IncDecButtons
                            decrementOnClick={() => setNumberOfMediumProblems(Math.max(minNumberOfProblems, numberOfMediumProblems - 1))}
                            incrementOnClick={() => setNumberOfMediumProblems(Math.min(maxNumberOfProblems, numberOfMediumProblems + 1))}/>
                    </div>

                    <div className="flex items-center justify-between">
                        <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Hard} num={numberOfHardProblems}/>
                        <IncDecButtons
                            decrementOnClick={() => setNumberOfHardProblems(Math.max(minNumberOfProblems, numberOfHardProblems - 1))}
                            incrementOnClick={() => setNumberOfHardProblems(Math.min(maxNumberOfProblems, numberOfHardProblems + 1))}/>
                    </div>

                    <div>
                        <Label className="text-lg">Duration: {duration} mins</Label>
                        <Slider
                            min={5}
                            max={120}
                            step={5}
                            value={[duration]}
                            onValueChange={(val) => setDuration(val[0])}
                            className={'pt-2'}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" onClick={handleSubmit}>Create</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CreateRoom;
