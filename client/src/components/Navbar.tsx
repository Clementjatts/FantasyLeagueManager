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
  ];

  return (
    <nav className="border-b border-slate-900/10 dark:border-slate-300/10 bg-glass-bg backdrop-blur-xl supports-[backdrop-filter]:bg-glass-bg sticky top-0 z-50 shadow-glass">
      <div className="container mx-auto px-6 sm:px-8">
        <div className="flex h-20 items-center justify-between py-4">
          <div className="flex-shrink-0 mr-10">
            <div className="text-3xl font-black tracking-tighter bg-gradient-to-r from-radiant-violet to-pink-500 bg-clip-text text-transparent select-none hover:scale-105 hover:opacity-90 transition-all duration-200 [text-shadow:0_0_8px_rgba(124,58,237,0.5)]">
              FPLManager
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium",
                  "transition-all duration-200 ease-in-out",
                  "hover:bg-slate-500/10",
                  location === href
                    ? "text-primary"
                    : "text-slate-500 hover:text-primary"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 transition-all duration-200",
                  location === href ? "scale-110" : ""
                )} />
                <span className="hidden sm:inline font-medium">{label}</span>
                
                {/* The new active state indicator - glowing underline */}
                {location === href && (
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-primary rounded-full [box-shadow:0_0_10px_theme(colors.primary)]" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}