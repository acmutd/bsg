import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faShuffle} from "@fortawesome/free-solid-svg-icons";
import { TooltipWrapper } from "@bsg/components/TooltipWrapper";
import React from "react";

const QuickStart = () => {
    return (
        <TooltipWrapper text={"Pick random"}>
            <button
                type="button"
                aria-label="Pick a random problem"
                className="btn-signal inline-flex h-11 w-11 items-center justify-center rounded-full"
            >
                <FontAwesomeIcon icon={faShuffle} className="h-4 w-4"/>
            </button>
        </TooltipWrapper>
    );
}

export default QuickStart;
