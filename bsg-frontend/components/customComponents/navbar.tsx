"use client"
import React from "react";
import {
    NavigationMenu,
    NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import Link from "next/link";
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"

const Navbar = () => {
    return (
        <div>
            <NavigationMenu >
                <Link href={"/"}>
                    <p className={"p-4 text-3xl font-bold"}>BSG</p>
                </Link>
                <Link href={'/'}>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                       Problems
                    </NavigationMenuLink>
                </Link>
            </NavigationMenu>
        </div>
    );
};

export default Navbar;
