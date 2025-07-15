"use client"

import * as React from "react"
import Link from "next/link"
import { DIcons } from "dicons"

import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const tools: { title: string; href: string; description: string; icon: keyof typeof DIcons }[] = [
  {
    title: "Workflow Builder",
    href: "/tools/workflow-builder",
    description: "Visual workflow designer to create and manage automated processes and pipelines.",
    icon: "Settings",
  },
  {
    title: "Task Manager",
    href: "/tools/task-manager",
    description: "Organize, track, and prioritize tasks across your team and projects.",
    icon: "Plus",
  },
  {
    title: "Resource Monitor",
    href: "/tools/resource-monitor",
    description: "Real-time monitoring of system resources, deployments, and infrastructure.",
    icon: "Activity",
  },
  {
    title: "Integration Hub",
    href: "/tools/integration-hub",
    description: "Connect and manage all your development tools and services in one place.",
    icon: "Plug",
  },
  {
    title: "Analytics Dashboard",
    href: "/tools/analytics",
    description: "Comprehensive insights into your workflows, performance metrics, and team productivity.",
    icon: "ChartBar",
  },
  {
    title: "API Gateway",
    href: "/tools/api-gateway",
    description: "Centralized API management, monitoring, and documentation.",
    icon: "Code",
  },
]

const resources: { title: string; href: string; description: string }[] = [
  {
    title: "Documentation",
    href: "/docs",
    description: "Comprehensive guides and API references for Ensemble features.",
  },
  {
    title: "Templates",
    href: "/resources/templates",
    description: "Pre-built workflow templates and automation recipes.",
  },
  {
    title: "Community",
    href: "/community",
    description: "Join discussions, share workflows, and connect with other users.",
  },
]

export function EnsembleNavigation() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    href="/dashboard"
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                  >
                    <DIcons.Sparkles className="h-6 w-6 text-primary mb-3" />
                    <div className="mb-2 text-lg font-medium">
                      Ensemble Dashboard
                    </div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Your command center for managing workflows, monitoring resources, and tracking progress.
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <ListItem href="/features" title="Features" icon={<DIcons.Star className="h-4 w-4" />}>
                Explore the full capabilities of the Ensemble platform.
              </ListItem>
              <ListItem href="/pricing" title="Pricing" icon={<DIcons.CreditCard className="h-4 w-4" />}>
                Flexible plans for teams of all sizes.
              </ListItem>
              <ListItem href="/enterprise" title="Enterprise" icon={<DIcons.Building02 className="h-4 w-4" />}>
                Custom solutions for large organizations.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Tools</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {tools.map((tool) => {
                const Icon = DIcons[tool.icon];
                return (
                  <ListItem
                    key={tool.title}
                    title={tool.title}
                    href={tool.href}
                    icon={<Icon className="h-4 w-4" />}
                  >
                    {tool.description}
                  </ListItem>
                );
              })}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {resources.map((resource) => (
                <ListItem
                  key={resource.title}
                  title={resource.title}
                  href={resource.href}
                >
                  {resource.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Team</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px]">
              <ListItem href="/team/members" title="Team Members" icon={<DIcons.Users className="h-4 w-4" />}>
                Manage your team members and their roles.
              </ListItem>
              <ListItem href="/team/projects" title="Projects" icon={<DIcons.Folder className="h-4 w-4" />}>
                Overview of all team projects and their status.
              </ListItem>
              <ListItem href="/team/settings" title="Settings" icon={<DIcons.Settings className="h-4 w-4" />}>
                Configure team preferences and permissions.
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link href="/register" className={cn(navigationMenuTriggerStyle(), "bg-primary text-primary-foreground hover:bg-primary/90")}>
              Get Started
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { icon?: React.ReactNode }
>(({ className, title, children, icon, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref as any}
          href={href || "#"}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2 text-sm font-medium leading-none">
            {icon}
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-2">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}); 