import { Link, useLocation } from "wouter";
import { Home, Users, Repeat, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/team", label: "Team", icon: Users },
    { href: "/transfers", label: "Transfers", icon: Repeat },
    { href: "/statistics", label: "Statistics", icon: BarChart },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center space-x-4">
          <div className="font-bold text-xl text-primary">FPL Manager</div>
          <div className="flex space-x-4">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <a
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent",
                    location === href && "bg-primary text-primary-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
