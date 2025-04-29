"use client"
import React from "react";
import {NavigationMenu, NavigationMenuLink, navigationMenuTriggerStyle,} from "@bsg/ui/navigation-menu"
import Link from "next/link";
import Logo from "./Logo";

const Navbar = () => {
    return (
        <div>
            <NavigationMenu>
                <Link href={"/public"}>
                    <Logo/>
                </Link>
                <NavigationMenuLink className={navigationMenuTriggerStyle()} href={'/public'}>
                    Problems
                </NavigationMenuLink>
            </NavigationMenu>
        </div>
    );
};

export default Navbar;
