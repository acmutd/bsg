import {Button} from "@/components/ui/button";
import {DialogTrigger} from "@/components/ui/dialog";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus} from "@fortawesome/free-solid-svg-icons";

const CreateRoomTriggerButton = () => {
  return (
    <DialogTrigger asChild>
      <Button size="sm" className="text-base">
        <span className="pr-1">Create</span>
        <FontAwesomeIcon icon={faPlus} />
      </Button>
    </DialogTrigger>
  );
};
export default CreateRoomTriggerButton;
