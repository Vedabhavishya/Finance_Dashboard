import { Link, useLocation } from "wouter";
import { useTheme } from "next-themes";
import { LayoutDashboard, ReceiptText, LineChart, Moon, Sun, Monitor, Shield, Eye } from "lucide-react";
import { useRoleStore } from "@/lib/role-store";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { setTheme } = useTheme();
  const { role, setRole } = useRoleStore();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: ReceiptText },
    { href: "/insights", label: "Insights", icon: LineChart },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-3 font-mono font-bold text-xl tracking-tight">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-sm">$</span>
            </div>
            FINTRACK
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button 
                  variant={active ? "secondary" : "ghost"} 
                  className={`w-full justify-start gap-3 transition-colors ${active ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="md:hidden font-mono font-bold text-lg flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs">$</span>
            </div>
            FT
          </div>
          <div className="hidden md:flex" />
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-border/50">
                  {role === "admin" ? <Shield className="w-4 h-4 text-primary" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  <span className="capitalize">{role}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuLabel>Simulation Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setRole("viewer")} className="gap-2">
                  <Eye className="w-4 h-4" /> Viewer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setRole("admin")} className="gap-2">
                  <Shield className="w-4 h-4" /> Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
        </div>
      </main>
      
      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex justify-around p-2 z-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <Button 
                variant="ghost" 
                className={`w-full flex-col h-14 gap-1 rounded-xl ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
