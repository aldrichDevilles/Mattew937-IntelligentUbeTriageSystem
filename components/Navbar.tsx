"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-8">
        {/* Branding */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="h-4 w-4 rounded-full bg-primary shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
          <span className="text-base font-bold tracking-tight text-foreground">
            UbeRated
          </span>
        </Link>

        {/* Desktop Navigation */}
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

      <div className="flex items-center gap-4">
        {/* Desktop CTA */}
        <Button
          render={<Link href="/terminal" />}
          nativeButton={false}
          size="sm"
          className="hidden sm:flex"
        >
          Launch Terminal
        </Button>

        {/* Mobile Navigation Menu */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle mobile menu</span>
              </Button>
            }
          />
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                href="/terminal"
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
              >
                Grading Terminal
              </Link>
              <Link
                href="/dashboard"
                className="text-lg font-medium text-foreground hover:text-primary transition-colors"
              >
                Inventory Ledger
              </Link>
              <div className="mt-4 pt-4 border-t border-border">
                <Button
                  render={<Link href="/terminal" />}
                  nativeButton={false}
                  className="w-full"
                >
                  Launch Terminal
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
