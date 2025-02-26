import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {ReactNode} from "react";

const TooltipWrapper = (props: { children: ReactNode, text: string }) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {props.children}
                </TooltipTrigger>
                <TooltipContent className={'bg-inputBackground '}>
                    <p className={'text-white'}>{props.text}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>

    );
};

export default TooltipWrapper;
