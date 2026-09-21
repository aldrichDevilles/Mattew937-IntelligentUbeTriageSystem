// components/Navbar.tsx
"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-8">
        {/* Updated Branding: IUTS -> UbeRated */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="h-4 w-4 rounded-full bg-violet-600 shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
          <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            UbeRated
          </span>
        </Link>

        {/* Navigation Links */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link href="/terminal" />}
                className={navigationMenuTriggerStyle()}
              >
                Grading Terminal
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link href="/dashboard" />}
                className={navigationMenuTriggerStyle()}
              >
                Inventory Ledger
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Quick CTA for Hackathon Judges */}
      <div className="flex items-center">
        <Button
          render={<Link href="/terminal" />}
          nativeButton={false}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 text-white border-none shadow-sm hidden sm:flex"
        >
          Launch Terminal
        </Button>
      </div>
    </header>
  );
}
