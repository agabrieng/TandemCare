import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/ui/stats-card";
import { ExpensesChart } from "@/components/ui/expenses-chart";
import { RecentActivities } from "@/components/ui/recent-activities";
import { ExpensesTable } from "@/components/ui/expenses-table";
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { useLoadingProgress } from "@/hooks/use-progress";
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
  const { progressState, simulateProgress } = useLoadingProgress();
  const [, setLocation] = useLocation();
  const [chartPeriod, setChartPeriod] = useState<string>("90");

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

  // Filtrar despesas por período e calcular categoryBreakdown
  const filteredCategoryBreakdown = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return stats?.categoryBreakdown || [];
    }

    const now = new Date();
    let startDate = new Date(now);

    // Calcular data de início baseado no período selecionado
    if (chartPeriod === 'current_month') {
      // Início do mês atual
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      const daysToSubtract = parseInt(chartPeriod);
      startDate.setDate(startDate.getDate() - daysToSubtract);
    }

    // Filtrar despesas pelo período
    const filteredExpenses = expenses.filter((expense: Expense) => {
      const expenseDate = new Date(expense.expenseDate);
      return expenseDate >= startDate && expenseDate <= now;
    });

    // Calcular total filtrado
    const totalFiltered = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    if (totalFiltered === 0) {
      return [];
    }

    // Agrupar por categoria
    const categoryTotals: Record<string, number> = {};
    filteredExpenses.forEach((expense: Expense) => {
      const category = expense.category.toLowerCase();
      categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(expense.amount);
    });

    // Calcular percentagens
    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / totalFiltered) * 100,
    }));
  }, [expenses, chartPeriod, stats?.categoryBreakdown]);

  // Simular progresso quando carregando dados
  useEffect(() => {
    if (statsLoading || expensesLoading || categoriesLoading) {
      simulateProgress(1500, "Carregando dados do dashboard...");
    }
  }, [statsLoading, expensesLoading, categoriesLoading, simulateProgress]);

  if (isLoading || statsLoading || expensesLoading || categoriesLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="min-h-[400px] flex items-center justify-center">
          <ProgressIndicator 
            progress={progressState.isLoading ? progressState.progress : 75} 
            message={progressState.isLoading ? progressState.message : "Carregando dashboard..."} 
            showPercentage={true}
            className="max-w-md"
          />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
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

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header - Sticky em mobile */}
      <div className="sticky top-0 z-50 bg-background border-b px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold" data-testid="title-dashboard">Dashboard</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Visão geral das suas finanças familiares</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="default" className="flex-1 sm:flex-initial min-h-11 sm:min-h-9" data-testid="button-future-balance">
              <Filter className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>
            <Button 
              size="default" 
              className="flex-1 sm:flex-initial min-h-11 sm:min-h-9" 
              onClick={() => setLocation('/expenses?add=true')}
              data-testid="button-add-expense"
            >
              <Plus className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Nova Despesa</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="p-3 sm:p-6 space-y-3 sm:space-y-6">
        {/* Summary Cards - Otimizado para mobile */}
        <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Gasto</CardTitle>
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-base sm:text-2xl font-bold" data-testid="text-total-spent">
                {formatCurrency(stats?.totalSpent || 0)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                +12.5% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-base sm:text-2xl font-bold" data-testid="text-pending-amount">
                {formatCurrency(stats?.pendingAmount || 0)}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                {expenses?.filter((e: any) => e.status === 'pendente').length || 0} despesas
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Filhos</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-base sm:text-2xl font-bold" data-testid="text-children-count">
                {stats?.childrenCount?.toString() || "0"}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                Cadastrados no sistema
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Comprovantes</CardTitle>
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-base sm:text-2xl font-bold" data-testid="text-receipts-count">
                {stats?.receiptsCount?.toString() || "0"}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                100% documentado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Recent Activities */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
          <ExpensesChart 
            data={filteredCategoryBreakdown}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
            userCategoryColors={categoryColors.userColorMap}
            fallbackColor={categoryColors.fallbackColor}
            data-testid="chart-expenses-by-category"
            className="hover-elevate"
          />
          
          <Card className="hover-elevate">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Clock className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                Atividades Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-3 sm:space-y-4">
                {(stats?.recentExpenses || []).slice(0, 5).map((expense: any, index: number) => (
                  <div key={expense.id || index} className="flex items-center justify-between border-b border-border pb-3 last:border-0 min-h-[44px] py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateForBrazil(expense.expenseDate)} • {expense.category}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-right ml-3">
                      {formatCurrency(Number(expense.amount))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Expenses Table */}
        <Card className="hover-elevate" data-testid="table-recent-expenses">
          <CardHeader className="px-4 sm:px-6">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <CardTitle className="text-base sm:text-xl">Despesas Recentes</CardTitle>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="default" className="flex-1 sm:flex-initial min-h-11 sm:min-h-9">
                  <Search className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Buscar</span>
                </Button>
                <Button variant="outline" size="default" className="flex-1 sm:flex-initial min-h-11 sm:min-h-9">
                  <Filter className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2" />
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
