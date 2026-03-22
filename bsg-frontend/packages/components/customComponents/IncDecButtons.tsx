import {Button} from "@bsg/ui/button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faChevronDown, faChevronUp} from "@fortawesome/free-solid-svg-icons";
import React, {SetStateAction} from "react";

const IncDecButtons = (props: {
    decrementOnClick: (value: SetStateAction<number>) => void,
    incrementOnClick: (value: SetStateAction<number>) => void
}) => {
    return (
        <div className="flex gap-2">
            <Button
                size="icon"
                className={"bg-inputBackground"}
                onClick={() => props.decrementOnClick((prev) => Math.max(0, prev - 1))}
            >
                <FontAwesomeIcon icon={faChevronDown}/>
            </Button>
            <Button
                size="icon"
                className={"bg-inputBackground"}
                onClick={() => props.incrementOnClick((prev) => Math.min(10, prev + 1))}
            >
                <FontAwesomeIcon icon={faChevronUp}/>
            </Button>
        </div>
    );
};

export default IncDecButtons;
