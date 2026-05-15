"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Waypoints } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col gap-1 bg-sidebar text-sidebar-foreground p-4 border-r",
        className,
      )}
    >
      <Link
        href="/"
        className="flex items-center gap-2 px-2 pb-4 font-semibold"
      >
        <Waypoints className="size-5" />
        <span>Traefik Manager</span>
      </Link>
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
