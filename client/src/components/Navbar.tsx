import { Link, useLocation } from "wouter";
import { Home, Users, Repeat, BarChart, Trophy, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/team", label: "Team", icon: Users },
    { href: "/transfers", label: "Transfers", icon: Repeat },
    { href: "/statistics", label: "Statistics", icon: BarChart },
    { href: "/leagues", label: "Leagues", icon: Trophy },
    { href: "/chips", label: "Chips", icon: Rocket },
  ];

  return (
    <nav className="border-b bg-gradient-to-r from-zinc-900/90 via-background to-zinc-900/90 backdrop-blur-sm sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-black tracking-tighter bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent select-none">
              FPLManager
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <a
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    "hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-blue-500/20 hover:shadow-lg hover:scale-105",
                    location === href
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "w-4 h-4 transition-transform",
                    location === href ? "scale-110" : ""
                  )} />
                  <span className="hidden sm:inline">{label}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
