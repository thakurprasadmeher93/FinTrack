import { Link, useLocation } from "wouter";
import { LayoutDashboard, ReceiptText, PieChart, Settings, LogOut, WalletMinimal, User, Zap, CheckCircle2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles, useSwitchProfile } from "@/hooks/use-fin-track";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { data: profiles } = useProfiles();
  const { mutate: switchProfile } = useSwitchProfile();

  const isPro = (user as any)?.subscriptionStatus === 'paid';
  
  const activeProfile = profiles?.find(p => p.id === (user as any)?.activeProfileId) || profiles?.[0];
  
  const isAdmin = (user as any)?.isAdmin;
  
  const navItems = [
    { href: "/dashboard-full", label: "Dashboard", icon: LayoutDashboard },
    { href: "/transactions", label: "Transactions", icon: ReceiptText },
    { href: "/analytics", label: "Analytics", icon: PieChart },
    { href: "/settings", label: "Settings", icon: Settings },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Settings }] : []),
  ];

  const ProfileSwitcher = () => (
    <div className="mb-8 px-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-start gap-2 h-12 rounded-xl border-dashed">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="truncate flex-1 text-left">
              {activeProfile?.name || 'My Profiles'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 rounded-xl p-2" align="start">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Switch Profile</span>
            {isPro && (
              <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => window.location.href = '/settings'}>
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {profiles?.map((p) => (
            <DropdownMenuItem 
              key={p.id} 
              onClick={() => switchProfile(p.id)} 
              className={cn(
                "gap-2 cursor-pointer rounded-lg",
                activeProfile?.id === p.id && "bg-primary/10 text-primary"
              )}
            >
              <div className={cn(
                "h-2 w-2 rounded-full", 
                p.type === 'business' ? 'bg-blue-500' : 'bg-green-500',
                activeProfile?.id === p.id && "ring-2 ring-primary/20 ring-offset-1"
              )} />
              <span className="flex-1">{p.name}</span>
              {activeProfile?.id === p.id && <CheckCircle2 className="h-3 w-3 text-primary" />}
            </DropdownMenuItem>
          ))}
          {!isPro && profiles && profiles.length >= 1 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-primary text-xs font-bold justify-center cursor-pointer"
                onClick={() => window.location.href = "/settings"}
              >
                Upgrade for More Profiles
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border z-50 px-4 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "flex flex-col items-center justify-center min-w-[64px] space-y-1 text-[10px] font-medium transition-colors",
              location === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
        
        <div className="flex items-center gap-2 border-l pl-4 ml-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-muted/50">
                <User className="h-5 w-5 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl p-2" align="end" side="top">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Switch Profile</span>
                {isPro && (
                  <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => window.location.href = '/settings'}>
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {profiles?.map((p) => (
                <DropdownMenuItem 
                  key={p.id} 
                  onClick={() => switchProfile(p.id)} 
                  className={cn(
                    "gap-2 cursor-pointer rounded-lg",
                    activeProfile?.id === p.id && "bg-primary/10 text-primary"
                  )}
                >
                  <div className={cn(
                    "h-2 w-2 rounded-full", 
                    p.type === 'business' ? 'bg-blue-500' : 'bg-green-500'
                  )} />
                  <span className="flex-1 truncate">{p.name}</span>
                  {activeProfile?.id === p.id && <CheckCircle2 className="h-3 w-3 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-muted-foreground text-xs justify-center cursor-pointer"
                onClick={() => logout()}
              >
                <LogOut className="h-3 w-3 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-card border-r border-border px-4 py-6">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <WalletMinimal className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight font-display text-foreground">FinTrack</h1>
        </div>

        <ProfileSwitcher />

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group",
              location === item.href 
                ? "bg-primary/10 text-primary shadow-sm" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
              <item.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", location === item.href && "text-primary")} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-2">
          <div className={cn(
            "rounded-2xl p-4 mb-4 border transition-all",
            isPro ? "bg-emerald-500/10 border-emerald-500/20" : "bg-gradient-to-br from-primary/10 to-accent/10 border-primary/5"
          )}>
            <h4 className={cn(
              "font-semibold text-sm mb-1",
              isPro ? "text-emerald-600" : "text-primary-foreground/90 mix-blend-difference"
            )}>
              {isPro ? 'FinTrack Pro' : 'Pro Plan'}
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              {isPro ? 'Unlimited profiles & priority features active.' : 'Unlock advanced analytics & multiple profiles.'}
            </p>
            {!isPro && (
              <Button 
                size="sm" 
                className="w-full bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                onClick={() => window.location.href = "/settings"}
              >
                Upgrade Now
              </Button>
            )}
            {isPro && (
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium">
                <Zap className="h-3 w-3 fill-current" />
                Active Subscription
              </div>
            )}
          </div>
          
          <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive" onClick={() => logout()}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
