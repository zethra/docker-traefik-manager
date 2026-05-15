import { Globe, LayoutDashboard, Server, Shield, Settings } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/domains", label: "Domains", icon: Globe },
  { href: "/hosts", label: "Hosts", icon: Server },
  { href: "/middlewares", label: "Middlewares", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
];
