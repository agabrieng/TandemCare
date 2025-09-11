import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  Receipt, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    description: "Visão geral das finanças",
  },
  {
    title: "Filhos",
    url: "/children",
    icon: Users,
    description: "Gerenciar perfis dos filhos",
  },
  {
    title: "Despesas",
    url: "/expenses",
    icon: Receipt,
    description: "Registrar e acompanhar gastos",
  },
  {
    title: "Comprovantes",
    url: "/receipts",
    icon: FileText,
    description: "Documentos e recibos",
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: BarChart3,
    description: "Análises e estatísticas",
  },
];

export function ModernSidebar({ isOpen, onToggle }: ModernSidebarProps) {
  const { user, logout } = useAuth() as any;
  const [location] = useLocation();

  const handleLogout = async () => {
    try {
      await logout?.();
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  const getUserInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return 'U';
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 md:hidden bg-background/80 backdrop-blur-sm border shadow-lg"
        data-testid="button-sidebar-toggle"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-72 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out",
        "md:relative md:transform-none md:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">FinanceKids</h1>
                <p className="text-xs text-muted-foreground">Gestão Financeira</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = location === item.url;
              const Icon = item.icon;
              
              return (
                <Link key={item.url} href={item.url}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    <div className="flex-1">
                      <div className={cn(
                        "font-medium text-sm",
                        isActive ? "text-primary-foreground" : "text-foreground"
                      )}>
                        {item.title}
                      </div>
                      <div className={cn(
                        "text-xs",
                        isActive ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="p-4 border-t border-border">
            <Link href="/settings">
              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                "hover:bg-accent hover:text-accent-foreground",
                location === "/settings" 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:text-foreground"
              )}>
                <Settings className="w-5 h-5" />
                <span className="font-medium text-sm">Configurações</span>
              </div>
            </Link>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {getUserInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {user?.firstName || 'Usuário'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {user?.email || 'user@example.com'}
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full mt-3 justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}