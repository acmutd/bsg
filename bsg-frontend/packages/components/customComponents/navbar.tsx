"use client"
import React from "react";
import {NavigationMenu, NavigationMenuLink, navigationMenuTriggerStyle,} from "@bsg/ui/navigation-menu"
import Link from "next/link";

const Navbar = () => {
    return (
        <div>
            <NavigationMenu>
                <Link href={"/public"}>
                    <p className={"p-4 text-3xl font-medium"}>BSG_</p>
                </Link>
                <NavigationMenuLink className={navigationMenuTriggerStyle()} href={'/public'}>
                    Problems
                </NavigationMenuLink>
            </NavigationMenu>
        </div>
    );
};

export default Navbar;
