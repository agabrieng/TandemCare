import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar";
import { ChevronUp, Settings, User, LogOut, ChevronRight, Tags } from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: "dashboard",
    description: "Visão geral das finanças",
  },
  {
    title: "Filhos",
    url: "/children",
    icon: "group",
    description: "Gerenciar perfis dos filhos",
  },
  {
    title: "Despesas",
    url: "/expenses",
    icon: "receipt_long",
    badge: "3",
    description: "Registrar e acompanhar gastos",
  },
  {
    title: "Comprovantes",
    url: "/receipts",
    icon: "description",
    description: "Documentos e recibos",
  },
  {
    title: "Relatórios",
    url: "/reports",
    icon: "bar_chart",
    description: "Análises e estatísticas",
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth() as any;
  const [location] = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();

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

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar variant="inset" data-testid="sidebar-main" className="border-r">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-4 group cursor-pointer rounded-lg">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
            <MaterialIcon icon="child_care" className="text-primary-foreground text-xl group-hover:scale-110 transition-transform duration-300" />
          </div>
          {state === "expanded" && (
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground">
                Finanças Kids
              </h1>
              <p className="text-xs text-muted-foreground">Gestão Familiar Inteligente</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    // tooltip={state === "collapsed" ? item.title : undefined}
                    data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                    className="group relative rounded-lg px-3 py-2.5 hover:bg-sidebar-accent hover:shadow-md transition-all duration-200"
                  >
                    <Link href={item.url} className="flex items-center gap-3 w-full" onClick={handleNavClick}>
                      <div className="relative">
                        <MaterialIcon icon={item.icon} className="text-lg" />
                        {location === item.url && null}
                      </div>
                      <span className="font-medium group-hover:text-sidebar-accent-foreground transition-colors duration-200">
                        {item.title}
                      </span>
                      {state === "expanded" && (
                        <ChevronRight className="ml-auto h-4 w-4 opacity-90" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge className="bg-destructive text-destructive-foreground shadow-sm border border-destructive font-bold">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                  {state === "expanded" && (
                    <div className="opacity-90 px-3 pb-1">
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator className="my-4" />
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
            Sistema
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location === "/categories"}
                  tooltip={state === "collapsed" ? "Categorias" : undefined}
                  className="group relative rounded-lg px-3 py-2.5 hover:bg-sidebar-accent hover:shadow-md transition-all duration-200"
                  data-testid="nav-categories"
                >
                  <Link href="/categories" className="flex items-center gap-3 w-full" onClick={handleNavClick}>
                    <Tags className="w-5 h-5" />
                    <span className="font-medium group-hover:text-sidebar-accent-foreground transition-colors duration-200">
                      Categorias
                    </span>
                    {state === "expanded" && (
                      <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1" />
                    )}
                  </Link>
                </SidebarMenuButton>
                {state === "expanded" && (
                  <div className="opacity-90 px-3 pb-1">
                    <p className="text-xs text-muted-foreground">Gerenciar categorias personalizadas</p>
                  </div>
                )}
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={location === "/settings"}
                  tooltip={state === "collapsed" ? "Configurações" : undefined}
                  className="group relative rounded-lg px-3 py-2.5 hover:bg-sidebar-accent hover:shadow-md transition-all duration-200"
                >
                  <Link href="/settings" className="flex items-center gap-3 w-full" onClick={handleNavClick}>
                    <Settings className="w-5 h-5" />
                    <span className="font-medium group-hover:text-sidebar-accent-foreground transition-colors duration-200">
                      Configurações
                    </span>
                    {state === "expanded" && (
                      <ChevronRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1" />
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        {user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton 
                      size="lg" 
                      className="group relative rounded-xl p-3 hover:bg-sidebar-accent hover:shadow-md transition-all duration-200 data-[state=open]:bg-sidebar-accent flex-1"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 rounded-xl border-2 border-transparent">
                          <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || ""} />
                          <AvatarFallback className="rounded-xl bg-primary text-primary-foreground font-semibold">
                            {getUserInitials(user?.firstName, user?.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold group-hover:text-sidebar-accent-foreground transition-colors duration-200" data-testid="text-user-name">
                          {user?.firstName && user?.lastName 
                            ? `${user?.firstName} ${user?.lastName}` 
                            : user?.firstName || "Usuário"
                          }
                        </span>
                        <span className="truncate text-xs text-muted-foreground" data-testid="text-user-email">
                          {user?.email}
                        </span>
                      </div>
                      <ChevronUp className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl shadow-xl border-2 z-50" 
                    side="right" 
                    align="start" 
                    sideOffset={4}
                  >
                    <DropdownMenuItem className="group rounded-lg p-3 hover:bg-accent transition-all duration-200 cursor-pointer">
                      <User className="mr-3 h-4 w-4" />
                      <span className="font-medium">Ver Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="group rounded-lg p-3 hover:bg-accent transition-all duration-200 cursor-pointer">
                      <Link href="/settings" onClick={handleNavClick}>
                        <Settings className="mr-3 h-4 w-4" />
                        <span className="font-medium">Configurações</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  data-testid="button-logout"
                  className="h-10 w-10 rounded-xl hover:bg-destructive/90 hover:text-destructive-foreground text-muted-foreground hover:text-white transition-all duration-200 group"
                  title="Sair da Conta"
                >
                  <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}