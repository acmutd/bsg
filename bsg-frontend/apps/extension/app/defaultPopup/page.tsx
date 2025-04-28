"use client";
import {Button} from "@bsg/ui/button";
import useDefaultPopup from "@/app/defaultPopup/useDefaultPopup";

const DefaultPopup = () => {
    const {handleClick, title} = useDefaultPopup();
    return (
        <Button onClick={() => handleClick()}>{title}</Button>
    );
};

export default DefaultPopup;
