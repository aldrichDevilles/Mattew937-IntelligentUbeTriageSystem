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

export function Navbar() {
  return (
    <header className="flex h-14 items-center border-b px-6">
      <div className="mr-8 flex items-center gap-2">
        <span className="h-3 w-3 rounded-full bg-purple-600" />
        <span className="text-sm font-semibold tracking-tight">IUTS</span>
      </div>

      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              render={<Link href="/terminal" />}
              className={navigationMenuTriggerStyle()}
            >
              Co-op Terminal
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink
              render={<Link href="/dashboard" />}
              className={navigationMenuTriggerStyle()}
            >
              Buyer Dashboard
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}
