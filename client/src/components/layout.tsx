import React from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";

export function Layout({ children, className }: { children: React.ReactNode; className?: string }) {
  const { user, logout } = useAuthStore();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout();
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground pb-20">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-md mx-auto flex h-14 items-center px-4">
          <button 
            onClick={() => setLocation("/")}
            className="font-bold text-lg tracking-tight bg-transparent border-0 cursor-pointer p-0 text-foreground hover:opacity-80 transition-opacity" 
            data-testid="link-home"
          >
            Ward Manager
          </button>
          
          <div className="ml-auto flex items-center gap-3">
            {user && (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <UserIcon className="w-4 h-4" />
                  <span className="max-w-[100px] truncate" data-testid="text-user-name">{user.name}</span>
                </div>
                
                <Button 
                  onClick={() => setLocation("/add")}
                  className="h-9 px-4 py-2" 
                  data-testid="button-add-person"
                >
                  Add
                </Button>
                
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" data-testid="button-logout">
                  <LogOut className="w-5 h-5 text-muted-foreground hover:text-destructive transition-colors" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className={cn("container max-w-md mx-auto p-4", className)}>
        {children}
      </main>
    </div>
  );
}
