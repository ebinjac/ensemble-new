"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DIcons } from "dicons";
import EnsembleLogo from "../home/logo";

const sidebarItems = [
  {
    title: "Overview",
    href: "/admin",
    icon: DIcons.LayoutDashboard,
  },
  {
    title: "Teams",
    href: "/admin/teams",
    icon: DIcons.Users,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: DIcons.Activity,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: DIcons.Settings,
  },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-2 font-semibold">
          <EnsembleLogo />
          <span>Ensemble Admin</span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid gap-1 px-2">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2",
                    isActive && "bg-secondary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
} 