'use client';

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
import Topic from "@/components/customComponents/Topic/Topic";
import {ScrollArea} from "@/components/ui/scroll-area";
import useCreateRoom from "@/components/customComponents/createRoom/useCreateRoom";

const CreateRoom = () => {
    const {
        numberOfEasyProblems,
        numberOfMediumProblems,
        numberOfHardProblems,
        topics,
        duration,
        setDuration,
        handleSubmit,
        decrementEasy,
        incrementEasy,
        decrementMedium,
        incrementMedium,
        decrementHard,
        incrementHard
    } = useCreateRoom();

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
                            decrementOnClick={() => decrementEasy()}
                            incrementOnClick={() => incrementEasy()}/>
                    </div>

                    <div className="flex items-center justify-between">
                        <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Medium}
                                                             num={numberOfMediumProblems}/>
                        <IncDecButtons
                            decrementOnClick={() => decrementMedium()}
                            incrementOnClick={() => incrementMedium()}/>
                    </div>

                    <div className="flex items-center justify-between">
                        <NumberOfProblemsWithDifficultyLabel difficulty={Difficulty.Hard} num={numberOfHardProblems}/>
                        <IncDecButtons
                            decrementOnClick={() => decrementHard()}
                            incrementOnClick={() => incrementHard()}/>
                    </div>

                    <div>
                        <Label className="text-lg">Select Topics</Label>
                        <ScrollArea
                            className="max-h-32 overflow-y-auto rounded-md p-2 mt-2 border-2 border-inputBackground">
                            <div className="flex flex-wrap gap-2">
                                {topics.map((topic, index) => (
                                    <Topic key={index} topic={topic}/>
                                ))}
                            </div>
                        </ScrollArea>
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
