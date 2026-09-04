import {Button} from "@bsg/ui/button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown, faChevronUp} from "@fortawesome/free-solid-svg-icons";

export const IncDecButtons = ({decrementOnClick, incrementOnClick}: {
    decrementOnClick: () => void;
    incrementOnClick: () => void
}) => (
    <div className="flex items-center gap-2 shrink-0">
        <Button size="icon" onClick={decrementOnClick} className="bg-bsg-surface border-0 hover:brightness-110">
            <FontAwesomeIcon icon={faChevronDown} className="text-foreground"/>
        </Button>
        <Button size="icon" onClick={incrementOnClick} className="bg-bsg-surface border-0 hover:brightness-110">
            <FontAwesomeIcon icon={faChevronUp} className="text-foreground"/>
        </Button>
    </div>
)
