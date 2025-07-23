"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DIcons } from "dicons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EnsembleNavigation } from "@/components/home/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import EnsembleLogo from "./logo";


interface User {
  name: string;
  email: string;
  image?: string;
}

interface Team {
  id: string;
  name: string;
}

interface HeaderProps {
  user?: User;
  teams?: Team[];
}

export function Header({ user, teams }: HeaderProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-[1400px]">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center h-12">
            <EnsembleLogo className=" size-12" />
          </div>
        </Link>

        {/* Navigation - centered */}
        <div className="flex-1 flex justify-center">
          <EnsembleNavigation />
        </div>

        {/* User section */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {user ? (
            <>
              {/* Team Selection or Create Team Button */}
              {teams && teams.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <DIcons.Users className="h-4 w-4" />
                      <span>Teams</span>
                      <DIcons.ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Your Teams</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {teams.map((team) => (
                      <DropdownMenuItem key={team.id} asChild>
                        <Link
                          href={`/teams/${team.id}`}
                          className="flex w-full items-center"
                        >
                          <DIcons.Folder className="mr-2 h-4 w-4" />
                          {team.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/teams/register"
                        className="flex w-full items-center"
                      >
                        <DIcons.Plus className="mr-2 h-4 w-4" />
                        Create New Team
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/teams/register">
                  <Button variant="outline" className="flex items-center gap-2">
                    <DIcons.Plus className="h-4 w-4" />
                    Create Team
                  </Button>
                </Link>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.image}
                        alt={user.name}
                      />
                      <AvatarFallback>
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="flex w-full items-center"
                    >
                      <DIcons.LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex w-full items-center"
                    >
                      <DIcons.Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <DIcons.LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/register">
                <Button>Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 