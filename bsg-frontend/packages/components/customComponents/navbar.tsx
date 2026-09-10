"use client";
import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { NavigationMenu, NavigationMenuLink } from "@bsg/ui/navigation-menu";

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
        px-4 sm:px-6 pt-3
        transition-[opacity,transform] duration-500 ease-spring
        ${
          isLandingPage && isHidden
            ? "opacity-0 -translate-y-6 pointer-events-none"
            : "opacity-100 translate-y-0"
        }
      `}
    >
      <div className="glass-panel mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-3 sm:px-5 py-2">
        {/* Logo */}
        <button
          type="button"
          aria-label="BSG home"
          onClick={() => {
            if (window.location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              window.location.href = "/";
            }
          }}
          className="group flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-opacity hover:opacity-85"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inset-0 rounded-full bg-signal animate-pulse-dot" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            BSG<span className="text-signal">_</span>
          </span>
        </button>

        {/* Navigation Links */}
        <NavigationMenu className="flex items-center gap-5 sm:gap-8">
          <NavigationMenuLink className="nav-link hidden sm:inline-block" href="#three-columns">
            About
          </NavigationMenuLink>

          <NavigationMenuLink className="nav-link hidden sm:inline-block" href="#coming-soon">
            Upcoming
          </NavigationMenuLink>

          <NavigationMenuLink className="nav-link" href="/contact">
            Contact
          </NavigationMenuLink>

          <NavigationMenuLink
            className="btn-signal inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold"
            href="/auth/signUp"
          >
            Sign Up
          </NavigationMenuLink>
        </NavigationMenu>
      </div>
    </nav>
  );
};

export default Navbar;
