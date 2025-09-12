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
  Scale,
  Tags,
  Settings, 
  LogOut, 
  Menu, 
  X,
  Wallet,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModernSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
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
  {
    title: "Dados Jurídicos",
    url: "/legal-data",
    icon: Scale,
    description: "Advogados e processos judiciais",
  },
];

export function ModernSidebar({ isOpen, onToggle, isCollapsed = false, onToggleCollapse }: ModernSidebarProps) {
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

  const handleMobileNavClick = () => {
    // Close sidebar on mobile when navigating
    if (window.innerWidth < 768 && isOpen) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="fixed top-4 left-4 z-[60] md:hidden bg-background border shadow-lg hover-elevate"
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
        "fixed left-0 top-0 h-full bg-background border-r border-border z-50 transform transition-all duration-300 ease-in-out shadow-lg",
        "md:relative md:transform-none md:z-auto",
        // Mobile behavior
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        // Desktop width behavior  
        isCollapsed ? "md:w-16" : "md:w-72",
        "w-80" // Mobile width optimized for touch
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-3", isCollapsed && "md:justify-center")}>
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-6 h-6 text-primary-foreground" />
                </div>
                {!isCollapsed && (
                  <div className="md:block">
                    <h1 className="text-xl font-bold text-foreground">FinanceKids</h1>
                    <p className="text-xs text-muted-foreground">Gestão Financeira</p>
                  </div>
                )}
              </div>
              {/* Desktop Toggle Button */}
              {onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  className="hidden md:flex h-8 w-8"
                  data-testid="button-sidebar-collapse"
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className={cn("flex-1 space-y-1 sm:space-y-2", isCollapsed ? "p-2" : "p-3 sm:p-4")}>
            {menuItems.map((item) => {
              const isActive = location === item.url;
              const Icon = item.icon;
              
              return (
                <Link key={item.url} href={item.url}>
                  <div
                    onClick={handleMobileNavClick}
                    className={cn(
                      "flex items-center rounded-xl transition-all duration-200 group cursor-pointer",
                      "hover:bg-accent hover:text-accent-foreground",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg" 
                        : "text-muted-foreground hover:text-foreground",
                      isCollapsed ? "md:justify-center md:px-2 md:py-3 px-4 py-4" : "px-4 py-4 gap-3"
                    )}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Icon className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {!isCollapsed && (
                      <div className="flex-1">
                        <div className={cn(
                          "font-medium text-sm",
                          isActive ? "text-primary-foreground" : "text-foreground"
                        )}>
                          {item.title}
                        </div>
                        <div className={cn(
                          "text-xs",
                          isActive ? "text-primary-foreground" : "text-muted-foreground"
                        )}>
                          {item.description}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Sistema */}
          <div className={cn("border-t border-border", isCollapsed ? "p-2" : "p-4")}>
            {!isCollapsed && (
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-2">
                Sistema
              </div>
            )}
            <Link href="/categories">
              <div 
                onClick={handleMobileNavClick}
                className={cn(
                  "flex items-center rounded-xl transition-all duration-200 group cursor-pointer",
                  "hover:bg-accent hover:text-accent-foreground",
                  location === "/categories" 
                    ? "bg-primary text-primary-foreground shadow-lg" 
                    : "text-muted-foreground hover:text-foreground",
                  isCollapsed ? "md:justify-center md:px-2 md:py-3 px-4 py-4" : "px-4 py-4 gap-3"
                )}
                data-testid="nav-categories">
                <Tags className="w-5 h-5" />
                {!isCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium text-sm">Categorias</div>
                    <div className="text-xs text-muted-foreground">Gerenciar categorias personalizadas</div>
                  </div>
                )}
              </div>
            </Link>
            
            <Link href="/settings">
              <div 
                onClick={handleMobileNavClick}
                className={cn(
                  "flex items-center rounded-xl transition-all duration-200 group cursor-pointer mt-2",
                  "hover:bg-accent hover:text-accent-foreground",
                  location === "/settings" 
                    ? "bg-primary text-primary-foreground shadow-lg" 
                    : "text-muted-foreground hover:text-foreground",
                  isCollapsed ? "md:justify-center md:px-2 md:py-3 px-4 py-4" : "px-4 py-4 gap-3"
                )}
                data-testid="nav-settings">
                <Settings className="w-5 h-5" />
                {!isCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium text-sm">Configurações</div>
                    <div className="text-xs text-muted-foreground">Preferências e conta</div>
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* User Profile */}
          <div className={cn("border-t border-border", isCollapsed ? "p-2" : "p-4")}>
            <div className={cn(
              "flex items-center rounded-xl bg-accent hover-elevate",
              isCollapsed ? "md:justify-center md:p-2 p-3 gap-3" : "p-3 gap-3"
            )}>
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                  {getUserInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {user?.firstName || 'Usuário'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user?.email || 'user@example.com'}
                  </div>
                </div>
              )}
            </div>
            
            <Button
              variant="ghost"
              size={isCollapsed ? "icon" : "sm"}
              onClick={handleLogout}
              className={cn(
                "mt-3 text-muted-foreground hover:text-destructive",
                isCollapsed ? "md:w-full md:justify-center w-full justify-start gap-2" : "w-full justify-start gap-2"
              )}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && "Sair"}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}