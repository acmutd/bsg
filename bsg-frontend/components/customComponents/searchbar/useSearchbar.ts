import {useRef, useState} from "react";

const useSearchbar = () => {
    const searchRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    return {
        searchRef,
        isFocused,
        setIsFocused,
    };
};

export default useSearchbar;
