import {useState} from "react";

const useDefaultPopup = () => {
    const [title, setTitle] = useState('hello');
    const handleClick = () => {
        setTitle('helloooo');
        console.log(title);
    }

    return {handleClick, title};
};

export default useDefaultPopup;
