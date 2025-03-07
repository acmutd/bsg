import {Button} from "@/components/ui/button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faShuffle} from "@fortawesome/free-solid-svg-icons";
import TooltipWrapper from "@/components/customComponents/TooltipWrapper";

const QuickStart = () => {
    return (
        <TooltipWrapper text={"Pick random"}>
            <Button variant="default">
                <FontAwesomeIcon icon={faShuffle} size={'lg'}/>
            </Button>
        </TooltipWrapper>
    );
}

export default QuickStart;
