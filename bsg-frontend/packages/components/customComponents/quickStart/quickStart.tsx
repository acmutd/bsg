import {Button} from "@bsg/ui/button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faShuffle} from "@fortawesome/free-solid-svg-icons";
import TooltipWrapper from "@bsg/components/TooltipWrapper";
import React from "react";

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
