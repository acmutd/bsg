import * as React from "react"

import {cn} from "@bsg/lib/utils"
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faMagnifyingGlass} from "@fortawesome/free-solid-svg-icons";
import useSearchbar from "@bsg/components/searchbar/useSearchbar";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
}

const SearchBar = React.forwardRef<HTMLInputElement, InputProps>(
    ({className, type, ...props}) => {
        const {searchRef, isFocused, setIsFocused} = useSearchbar();
        return (
            <div
                className={cn(
                    "flex h-11 w-full sm:w-80 items-center rounded-full border bg-inputBackground/80 pl-4 pr-2 transition-[border-color,box-shadow] duration-200",
                    isFocused
                        ? "border-signal/60 shadow-glow-sm"
                        : "border-bsg-border hover:border-bsg-hover",
                )}>
                <button
                    type="button"
                    aria-label="Focus search"
                    className="text-foreground/45 transition-colors hover:text-signal"
                    onClick={() => searchRef.current?.focus()}
                >
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="h-3.5 w-3.5"/>
                </button>
                <input
                    type={type}
                    className={cn(
                        "h-full w-full bg-transparent px-3 text-sm outline-none placeholder:text-foreground/35 disabled:cursor-not-allowed disabled:opacity-50",
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
