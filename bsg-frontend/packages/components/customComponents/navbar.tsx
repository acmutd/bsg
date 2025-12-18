"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import {
  NavigationMenu,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@bsg/ui/navigation-menu";

const Navbar = () => {
  const pathname = usePathname();
  const isLandingPage = pathname === "/"; 
  const [isHidden, setIsHidden] = useState(false);
  const hoverZoneHeight = 80;

  useEffect(() => {
    if (!isLandingPage) return; 
    const handleScroll = () => setIsHidden(window.scrollY !== 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLandingPage]);

  useEffect(() => {
    if (!isLandingPage) return; 
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY !== 0 && e.clientY < hoverZoneHeight) {
        setIsHidden(false);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isLandingPage]);

  const handleMouseLeave = () => {
    if (isLandingPage && window.scrollY !== 0) setIsHidden(true);
  };

  return (
    <nav
      onMouseEnter={() => isLandingPage && setIsHidden(false)}
      onMouseLeave={handleMouseLeave}
      className={`
        fixed top-0 left-0 right-0 z-50
        border-b border-white/10
        bg-grey/40 backdrop-blur-xl
        transition-all duration-300
        ${isLandingPage && isHidden ? "opacity-0 -translate-y-4" : "opacity-100 translate-y-0"}
      `}
    >
      <div className="flex items-center justify-between px-10 py-2">
        {/* Logo */}
        <div
          onClick={() => {
            if (window.location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.location.href = "/";
            }
          }}
          className="cursor-pointer hover:opacity-80 transition-opacity scale-80"
        >
          <Logo />
        </div>


        {/* Navigation Links */}
        <NavigationMenu className="flex gap-8">
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#three-columns">
            About
          </NavigationMenuLink>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="#coming-soon">
            Upcoming
          </NavigationMenuLink>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="/contact">
            Contact
          </NavigationMenuLink>
          <NavigationMenuLink className={navigationMenuTriggerStyle()} href="/auth/signUp">
            Sign Up
          </NavigationMenuLink>
        </NavigationMenu>
      </div>
    </nav>
  );
};

export default Navbar;
