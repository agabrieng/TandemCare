import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Search, Receipt, Edit, Trash2, Download, RefreshCw, CalendarIcon, User, ChevronDown, ChevronRight, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ExpenseForm } from "@/components/ui/expense-form";
import { ExpensesTable } from "@/components/ui/expenses-table";
import { isUnauthorizedError } from "@/lib/authUtils";
import { formatDateForBrazil } from "@/lib/date-utils";
import { parseISO, getYear, getMonth } from "date-fns";

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

interface Child {
  id: string;
  firstName: string;
  lastName?: string;
  dateOfBirth?: string;
}

interface UploadedFile {
  uploadURL: string;
  fileName: string;
  fileType: string;
}

// Utility functions for data organization
function groupExpensesByHierarchy(expenses: Expense[]) {
  const hierarchy: Record<string, Record<number, Record<number, Expense[]>>> = {};

  expenses.forEach(expense => {
    const childName = expense.child.firstName + (expense.child.lastName ? ` ${expense.child.lastName}` : '');
    const expenseDate = parseISO(expense.expenseDate);
    const year = getYear(expenseDate);
    const month = getMonth(expenseDate); // 0-based (0=Jan, 11=Dec)

    if (!hierarchy[childName]) {
      hierarchy[childName] = {};
    }
    if (!hierarchy[childName][year]) {
      hierarchy[childName][year] = {};
    }
    if (!hierarchy[childName][year][month]) {
      hierarchy[childName][year][month] = [];
    }

    hierarchy[childName][year][month].push(expense);
  });

  return hierarchy;
}

function getUniqueValues(expenses: Expense[]) {
  const years = Array.from(new Set(expenses.map(e => getYear(parseISO(e.expenseDate)))));
  const months = Array.from(new Set(expenses.map(e => getMonth(parseISO(e.expenseDate)))));
  const children = Array.from(new Set(expenses.map(e => `${e.child.firstName}${e.child.lastName ? ` ${e.child.lastName}` : ''}`)));
  
  return { years: years.sort((a, b) => b - a), months: months.sort(), children };
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Expenses() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedChild, setSelectedChild] = useState("");
  
  // Filter states for hierarchical view
  const [selectedYear, setSelectedYear] = useState<string>("all-years");
  const [selectedMonth, setSelectedMonth] = useState<string>("all-months");
  const [showFilters, setShowFilters] = useState(false);
  
  // Collapsible states
  const [openChildren, setOpenChildren] = useState<Record<string, boolean>>({});
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({});
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build structured filter object for query key
  const filters = {
    category: selectedCategory || null,
    status: selectedStatus || null,
    childId: selectedChild || null
  };

  // Build query parameters for filtering
  const queryParams = new URLSearchParams();
  if (selectedCategory) queryParams.append('category', selectedCategory);
  if (selectedStatus) queryParams.append('status', selectedStatus);
  if (selectedChild) queryParams.append('childId', selectedChild);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", filters],
    queryFn: async () => {
      const url = queryParams.toString() 
        ? `/api/expenses?${queryParams.toString()}` 
        : '/api/expenses';
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    },
    retry: false,
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    retry: false,
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/expenses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/expenses"],
        exact: false,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/dashboard/stats"],
        refetchType: 'active'
      });
      setIsAddDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Despesa adicionada com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Erro ao adicionar despesa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/expenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/expenses"],
        exact: false,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/dashboard/stats"],
        refetchType: 'active'
      });
      setEditingExpense(null);
      toast({
        title: "Sucesso",
        description: "Despesa atualizada com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Erro ao atualizar despesa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/expenses"],
        exact: false,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/dashboard/stats"],
        refetchType: 'active'
      });
      toast({
        title: "Sucesso",
        description: "Despesa removida com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Erro ao remover despesa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const createReceiptMutation = useMutation({
    mutationFn: async ({ expenseId, files }: { expenseId: string; files: UploadedFile[] }) => {
      const promises = files.map(file => 
        apiRequest("POST", "/api/receipts", {
          receiptURL: file.uploadURL,
          expenseId,
          fileType: file.fileType,
          fileName: file.fileName,
        }).then(res => res.json())
      );
      return Promise.all(promises);
    },
    onError: (error) => {
      console.error("Error creating receipts:", error);
      toast({
        title: "Aviso",
        description: "Despesa criada, mas houve erro ao salvar alguns comprovantes.",
        variant: "default",
      });
    },
  });

  const handleCreateExpense = (data: any, uploadedFiles?: UploadedFile[]) => {
    createExpenseMutation.mutate(data, {
      onSuccess: (expense) => {
        // If there are uploaded files, create receipts for them
        if (uploadedFiles && uploadedFiles.length > 0) {
          createReceiptMutation.mutate({ expenseId: expense.id, files: uploadedFiles });
        }
      },
    });
  };

  const handleUpdateExpense = (data: any) => {
    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data });
    }
  };

  const handleDeleteExpense = (expense: any) => {
    if (window.confirm(`Tem certeza que deseja remover a despesa "${expense.description}"? Esta ação não pode ser desfeita.`)) {
      deleteExpenseMutation.mutate(expense.id);
    }
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedStatus("");
    setSelectedChild("");
    setSearchTerm("");
    setSelectedYear("all-years");
    setSelectedMonth("all-months");
  };

  // Helper functions for styling
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'educação':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-300';
      case 'saúde':
        return 'bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-300';
      case 'alimentação':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/80 dark:text-orange-300';
      case 'vestuário':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-300';
      case 'transporte':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/80 dark:text-yellow-300';
      case 'lazer':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/80 dark:text-pink-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/80 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pago':
        return 'bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-300';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/80 dark:text-yellow-300';
      case 'reembolsado':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/80 dark:text-gray-300';
    }
  };

  // Generate unique values for filters
  const uniqueValues = useMemo(() => {
    return getUniqueValues(expenses);
  }, [expenses]);

  // Apply filters to expenses
  const filteredExpenses = useMemo(() => {
    return expenses?.filter((expense: any) => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          expense.description.toLowerCase().includes(searchLower) ||
          expense.child.firstName.toLowerCase().includes(searchLower) ||
          expense.category.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory && expense.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus && expense.status !== selectedStatus) {
        return false;
      }

      // Child filter
      if (selectedChild !== "all-children" && selectedChild) {
        const childName = `${expense.child.firstName}${expense.child.lastName ? ` ${expense.child.lastName}` : ''}`;
        if (childName !== selectedChild) return false;
      }

      // Year filter
      if (selectedYear !== "all-years") {
        const expenseYear = getYear(parseISO(expense.expenseDate));
        if (expenseYear.toString() !== selectedYear) return false;
      }

      // Month filter
      if (selectedMonth !== "all-months") {
        const expenseMonth = getMonth(parseISO(expense.expenseDate));
        if (expenseMonth.toString() !== selectedMonth) return false;
      }

      return true;
    }) || [];
  }, [expenses, searchTerm, selectedCategory, selectedStatus, selectedChild, selectedYear, selectedMonth]);

  // Group filtered expenses hierarchically
  const hierarchicalData = useMemo(() => {
    return groupExpensesByHierarchy(filteredExpenses);
  }, [filteredExpenses]);

  // Toggle functions for collapsibles
  const toggleChild = (childName: string) => {
    setOpenChildren(prev => ({ ...prev, [childName]: !prev[childName] }));
  };

  const toggleYear = (key: string) => {
    setOpenYears(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMonth = (key: string) => {
    setOpenMonths(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const categories = [
    { value: "educação", label: "Educação" },
    { value: "saúde", label: "Saúde" },
    { value: "alimentação", label: "Alimentação" },
    { value: "vestuário", label: "Vestuário" },
    { value: "transporte", label: "Transporte" },
    { value: "lazer", label: "Lazer" },
    { value: "outros", label: "Outros" },
  ];

  const statusOptions = [
    { value: "pendente", label: "Pendente" },
    { value: "pago", label: "Pago" },
    { value: "reembolsado", label: "Reembolsado" },
  ];

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="title-expenses">Despesas</h1>
            <p className="text-muted-foreground">Gerencie todas as despesas dos seus filhos</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                // Invalida todas as queries que começam com "/api/expenses"
                queryClient.invalidateQueries({ 
                  queryKey: ["/api/expenses"],
                  exact: false,
                  refetchType: 'active'
                });
                queryClient.invalidateQueries({ 
                  queryKey: ["/api/dashboard/stats"],
                  refetchType: 'active'
                });
                queryClient.invalidateQueries({ 
                  queryKey: ["/api/children"],
                  refetchType: 'active'
                });
                toast({
                  title: "Atualizado",
                  description: "Dados atualizados com sucesso!",
                });
              }}
              data-testid="button-refresh-expenses"
            >
              <RefreshCw className="mr-2 w-4 h-4" />
              Atualizar
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-expense">
                  <Plus className="mr-2 w-4 h-4" />
                  Nova Despesa
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl" data-testid="dialog-add-expense">
              <DialogHeader>
                <DialogTitle>Adicionar Nova Despesa</DialogTitle>
                <DialogDescription>
                  Registre uma nova despesa relacionada aos seus filhos.
                </DialogDescription>
              </DialogHeader>
              <ExpenseForm
                onSubmit={handleCreateExpense}
                isLoading={createExpenseMutation.isPending || createReceiptMutation.isPending}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <main className="p-6">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, filho ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-expenses"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {showFilters ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          {/* Advanced Filters */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent className="space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Filtros Avançados</CardTitle>
                    <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
                      Limpar Filtros
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        Categoria
                      </label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger data-testid="select-category-filter">
                          <SelectValue placeholder="Todas as categorias" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Status
                      </label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger data-testid="select-status-filter">
                          <SelectValue placeholder="Todos os status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(status => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Year Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Ano
                      </label>
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger data-testid="select-year-filter">
                          <SelectValue placeholder="Todos os anos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-years">Todos os anos</SelectItem>
                          {uniqueValues.years.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Month Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        Mês
                      </label>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger data-testid="select-month-filter">
                          <SelectValue placeholder="Todos os meses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-months">Todos os meses</SelectItem>
                          {uniqueValues.months.map(month => (
                            <SelectItem key={month} value={month.toString()}>{monthNames[month]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Child Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Filho
                      </label>
                      <Select value={selectedChild} onValueChange={setSelectedChild}>
                        <SelectTrigger data-testid="select-child-filter">
                          <SelectValue placeholder="Todos os filhos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-children">Todos os filhos</SelectItem>
                          {uniqueValues.children.map(child => (
                            <SelectItem key={child} value={child}>{child}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total de Despesas</p>
                    <p className="text-2xl font-bold" data-testid="text-total-expenses">{filteredExpenses.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Despesas Pagas</p>
                    <p className="text-2xl font-bold" data-testid="text-paid-expenses">
                      {filteredExpenses.filter((e: any) => e.status === 'pago').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Pendentes</p>
                    <p className="text-2xl font-bold" data-testid="text-pending-expenses">
                      {filteredExpenses.filter((e: any) => e.status === 'pendente').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hierarchical Expenses View */}
        <div className="space-y-6">
          {Object.keys(hierarchicalData).length > 0 ? (
            Object.entries(hierarchicalData).map(([childName, yearData]) => {
              const childKey = `child-${childName}`;
              const isChildOpen = openChildren[childKey];
              
              return (
                <Card key={childKey} data-testid={`card-child-${childName}`}>
                  <Collapsible open={isChildOpen} onOpenChange={() => toggleChild(childKey)}>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="hover-elevate">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-3">
                            <User className="w-6 h-6 text-primary" />
                            <div className="text-left">
                              <CardTitle className="text-xl">{childName}</CardTitle>
                              <CardDescription>
                                {Object.values(yearData).reduce((total, monthData) => 
                                  total + Object.values(monthData).reduce((monthTotal, expenses) => 
                                    monthTotal + expenses.length, 0), 0)} despesas
                              </CardDescription>
                            </div>
                          </div>
                          {isChildOpen ? 
                            <ChevronDown className="w-5 h-5 text-muted-foreground" /> : 
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                          }
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {Object.entries(yearData).map(([year, monthData]) => {
                            const yearKey = `${childKey}-year-${year}`;
                            const isYearOpen = openYears[yearKey];
                            
                            return (
                              <Card key={yearKey} className="ml-4" data-testid={`card-year-${year}`}>
                                <Collapsible open={isYearOpen} onOpenChange={() => toggleYear(yearKey)}>
                                  <CollapsibleTrigger className="w-full">
                                    <CardHeader className="py-3 hover-elevate">
                                      <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center space-x-3">
                                          <CalendarIcon className="w-5 h-5 text-blue-600" />
                                          <div className="text-left">
                                            <CardTitle className="text-lg">{year}</CardTitle>
                                            <CardDescription>
                                              {Object.values(monthData).reduce((total, expenses) => 
                                                total + expenses.length, 0)} despesas
                                            </CardDescription>
                                          </div>
                                        </div>
                                        {isYearOpen ? 
                                          <ChevronDown className="w-4 h-4 text-muted-foreground" /> : 
                                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                        }
                                      </div>
                                    </CardHeader>
                                  </CollapsibleTrigger>
                                  
                                  <CollapsibleContent>
                                    <CardContent className="pt-0">
                                      <div className="space-y-3">
                                        {Object.entries(monthData).map(([month, expenses]) => {
                                          const monthKey = `${yearKey}-month-${month}`;
                                          const isMonthOpen = openMonths[monthKey];
                                          
                                          return (
                                            <Card key={monthKey} className="ml-4" data-testid={`card-month-${month}`}>
                                              <Collapsible open={isMonthOpen} onOpenChange={() => toggleMonth(monthKey)}>
                                                <CollapsibleTrigger className="w-full">
                                                  <CardHeader className="py-2 hover-elevate">
                                                    <div className="flex items-center justify-between w-full">
                                                      <div className="flex items-center space-x-3">
                                                        <Receipt className="w-4 h-4 text-green-600" />
                                                        <div className="text-left">
                                                          <CardTitle className="text-md">{monthNames[parseInt(month)]}</CardTitle>
                                                          <CardDescription>
                                                            {expenses.length} despesas
                                                          </CardDescription>
                                                        </div>
                                                      </div>
                                                      {isMonthOpen ? 
                                                        <ChevronDown className="w-4 h-4 text-muted-foreground" /> : 
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                      }
                                                    </div>
                                                  </CardHeader>
                                                </CollapsibleTrigger>
                                                
                                                <CollapsibleContent>
                                                  <CardContent className="pt-0">
                                                    <div className="space-y-3">
                                                      {expenses.map((expense: any) => (
                                                        <Card key={expense.id} className="ml-4" data-testid={`card-expense-${expense.id}`}>
                                                          <CardHeader className="pb-3">
                                                            <div className="flex items-start justify-between">
                                                              <div className="flex-1">
                                                                <CardTitle className="text-base">{expense.description}</CardTitle>
                                                                <CardDescription className="mt-1">
                                                                  {formatDateForBrazil(expense.expenseDate)} • {formatCurrency(expense.amount)}
                                                                </CardDescription>
                                                                <div className="flex items-center space-x-2 mt-2">
                                                                  <Badge className={getCategoryColor(expense.category)} variant="secondary">
                                                                    {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                                                                  </Badge>
                                                                  <Badge className={getStatusColor(expense.status)} variant="secondary">
                                                                    {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                                                                  </Badge>
                                                                </div>
                                                              </div>
                                                              <div className="flex items-center space-x-2">
                                                                <Button
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  onClick={() => setEditingExpense(expense)}
                                                                  data-testid={`button-edit-expense-${expense.id}`}
                                                                >
                                                                  <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  onClick={() => handleDeleteExpense(expense)}
                                                                  data-testid={`button-delete-expense-${expense.id}`}
                                                                >
                                                                  <Trash2 className="w-4 h-4 text-destructive" />
                                                                </Button>
                                                              </div>
                                                            </div>
                                                          </CardHeader>
                                                        </Card>
                                                      ))}
                                                    </div>
                                                  </CardContent>
                                                </CollapsibleContent>
                                              </Collapsible>
                                            </Card>
                                          );
                                        })}
                                      </div>
                                    </CardContent>
                                  </CollapsibleContent>
                                </Collapsible>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma despesa encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Não há despesas que correspondam aos filtros selecionados.
                </p>
                {(selectedCategory || selectedStatus || selectedChild || searchTerm || selectedYear !== "all-years" || selectedMonth !== "all-months") && (
                  <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters-empty">
                    Limpar Filtros
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingExpense} onOpenChange={(open) => {
          if (!open) setEditingExpense(null);
        }}>
          <DialogContent className="max-w-2xl" data-testid="dialog-edit-expense">
            <DialogHeader>
              <DialogTitle>Editar Despesa</DialogTitle>
              <DialogDescription>
                Atualize os dados da despesa.
              </DialogDescription>
            </DialogHeader>
            {editingExpense && (
              <ExpenseForm
                initialData={editingExpense}
                onSubmit={handleUpdateExpense}
                isLoading={updateExpenseMutation.isPending}
                onCancel={() => setEditingExpense(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
