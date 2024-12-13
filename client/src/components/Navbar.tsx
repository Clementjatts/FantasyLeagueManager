import { Link, useLocation } from "wouter";
import { Home, Users, Repeat, BarChart, Trophy, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/team", label: "Team", icon: Users },
    { href: "/players", label: "Players", icon: Repeat },
    { href: "/statistics", label: "Statistics", icon: BarChart },
    { href: "/leagues", label: "Leagues", icon: Trophy },
    { href: "/chips", label: "Chips", icon: Rocket },
  ];

  return (
    <nav className="border-b bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-6 sm:px-8">
        <div className="flex h-20 items-center justify-between py-4">
          <div className="flex-shrink-0 mr-10">
            <div className="text-3xl font-black tracking-tighter bg-gradient-to-r from-purple-500 via-primary to-blue-500 bg-clip-text text-transparent select-none hover:scale-105 transition-transform duration-200">
              FPLManager
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <a
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium",
                    "transition-all duration-300 ease-in-out",
                    "hover:bg-gradient-to-r hover:from-purple-500/15 hover:to-blue-500/15",
                    "hover:shadow-lg hover:scale-105 hover:text-white",
                    "active:scale-95 active:shadow-inner",
                    location === href
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "w-4 h-4 transition-all duration-300",
                    location === href ? "scale-110 animate-pulse" : "",
                    "group-hover:rotate-3"
                  )} />
                  <span className="hidden sm:inline font-medium">{label}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
