import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/ui/stats-card";
import { ExpensesChart } from "@/components/ui/expenses-chart";
import { RecentActivities } from "@/components/ui/recent-activities";
import { ExpensesTable } from "@/components/ui/expenses-table";
import { formatDateForBrazil } from "@/lib/date-utils";
import { Plus, Filter, DollarSign, Clock, Users, FileText, Search, PlusCircle, Download, Upload, BarChart3 } from "lucide-react";

interface DashboardStats {
  totalSpent: number;
  pendingAmount: number;
  childrenCount: number;
  receiptsCount: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  recentExpenses: any[];
}

interface Expense {
  id: string;
  description: string;
  amount: string;
  expenseDate: string;
  category: string;
  status: string;
  child: any;
  receipts: any[];
}

interface Category {
  id: string;
  name: string;
  color?: string;
  isDefault: boolean;
  userId: string;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Não autorizado",
        description: "Você foi desconectado. Redirecionando...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
    enabled: isAuthenticated,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    retry: false,
    enabled: isAuthenticated,
  });

  // Buscar categorias do usuário
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
    enabled: isAuthenticated,
  });

  if (isLoading || statsLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-secondary rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-secondary rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-80 bg-secondary rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Criar mapeamento dinâmico de cores das categorias do usuário
  const categoryColors = useMemo(() => {
    const userColorMap: Record<string, string> = {};
    const usedColors = new Set<string>();

    // Mapear cores das categorias definidas pelo usuário
    categories.forEach(category => {
      if (category.color) {
        userColorMap[category.name.toLowerCase()] = category.color;
        usedColors.add(category.color);
      }
    });

    // Cores padrão para categorias não definidas pelo usuário
    const defaultColors = [
      '#6b7280', // gray-500
      '#94a3b8', // slate-400
      '#78716c', // stone-500
      '#71717a', // zinc-500
      '#737373', // neutral-500
    ];

    // Encontrar uma cor padrão que não está sendo usada pelo usuário
    let fallbackColor = '#6b7280'; // gray-500 como padrão
    for (const color of defaultColors) {
      if (!usedColors.has(color)) {
        fallbackColor = color;
        break;
      }
    }

    return { userColorMap, fallbackColor };
  }, [categories]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b px-4 sm:px-6 py-4">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="title-dashboard">Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Visão geral das suas finanças familiares</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="sm:size-default" data-testid="button-future-balance">
              <Filter className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
            <Button size="sm" className="sm:size-default" data-testid="button-add-expense">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nova Despesa</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-spent">
                {formatCurrency(stats?.totalSpent || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12.5% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-amount">
                {formatCurrency(stats?.pendingAmount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {expenses?.filter((e: any) => e.status === 'pendente').length || 0} despesas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Filhos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-children-count">
                {stats?.childrenCount?.toString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                Cadastrados no sistema
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comprovantes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-receipts-count">
                {stats?.receiptsCount?.toString() || "0"}
              </div>
              <p className="text-xs text-muted-foreground">
                100% documentado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Recent Activities */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 w-5 h-5" />
                Despesas por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExpensesChart 
                data={stats?.categoryBreakdown || []}
                userCategoryColors={categoryColors.userColorMap}
                fallbackColor={categoryColors.fallbackColor}
                data-testid="chart-expenses-by-category"
              />
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 w-5 h-5" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(stats?.recentExpenses || []).slice(0, 5).map((expense: any, index: number) => (
                  <div key={expense.id || index} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateForBrazil(expense.expenseDate)} • {expense.category}
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(Number(expense.amount))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Expenses Table */}
        <Card data-testid="table-recent-expenses">
          <CardHeader>
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="text-lg sm:text-xl">Despesas Recentes</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Search className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Buscar</span>
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filtrar</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ExpensesTable 
              expenses={(stats?.recentExpenses || []).slice(0, 10)} 
              loading={statsLoading}
              showPagination={false}
              className="border-none"
            />
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
