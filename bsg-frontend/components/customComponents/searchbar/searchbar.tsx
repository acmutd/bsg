import * as React from "react"

import {cn} from "@/lib/utils"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass} from "@fortawesome/free-solid-svg-icons";
import useSearchbar from "@/components/customComponents/searchbar/useSearchbar";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
}

const SearchBar = React.forwardRef<HTMLInputElement, InputProps>(
    ({className, type, ...props}) => {
        const {searchRef, isFocused, setIsFocused} = useSearchbar();
        return (
            <div
                className={`hover:brightness-125 items-center w-80 flex-row bg-inputBackground rounded-md flex ${isFocused ? 'ring-2 ring-ring ring-offset-2 outline-none ring-offset-background' : ''}`}>
                <button className={'pl-2.5'} onClick={() => searchRef.current?.focus()}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} className={'text-muted-foreground'}/>
                </button>
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border-0 bg-inputBackground px-3 py-2 text-sm file:border-0 file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 outline-none",
                        className
                    )}
                    placeholder={"Search..."}
                    ref={searchRef}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
            </div>
        )
    }
)
SearchBar.displayName = "SearchBar"

export default SearchBar;
