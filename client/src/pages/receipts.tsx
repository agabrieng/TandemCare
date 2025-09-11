import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import { FileText, Upload, Search, Eye, Trash2, Download, Plus, Filter, CalendarIcon, User, DollarSign, FileIcon, ChevronDown, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { format, parseISO, getYear, getMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { UploadResult } from '@uppy/core';

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
  const fileTypes = Array.from(new Set(expenses.flatMap(e => e.receipts?.map(r => r.fileType) || [])));
  const children = Array.from(new Set(expenses.map(e => `${e.child.firstName}${e.child.lastName ? ` ${e.child.lastName}` : ''}`)));
  
  return { years: years.sort((a, b) => b - a), months: months.sort(), fileTypes, children };
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Receipts() {
  const [selectedExpense, setSelectedExpense] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState<string>("all-years");
  const [selectedMonth, setSelectedMonth] = useState<string>("all-months");
  const [selectedChild, setSelectedChild] = useState<string>("all-children");
  const [selectedFileType, setSelectedFileType] = useState<string>("all-types");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Collapsible states
  const [openChildren, setOpenChildren] = useState<Record<string, boolean>>({});
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({});
  const [openMonths, setOpenMonths] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    retry: false,
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    retry: false,
  });

  const { data: user } = useQuery<{ id: string; email: string; firstName: string; lastName: string }>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const createReceiptMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/receipts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setIsUploadDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Comprovante enviado com sucesso!",
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
        description: "Erro ao enviar comprovante. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteReceiptMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/receipts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({
        title: "Sucesso",
        description: "Comprovante removido com sucesso!",
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
        description: "Erro ao remover comprovante. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleGetUploadParameters = async (organizationParams?: {
    userId: string;
    childId: string;
    expenseDate: string;
  }) => {
    try {
      const requestBody = organizationParams || {};
      const response = await apiRequest("POST", "/api/objects/upload", requestBody);
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao preparar upload. Tente novamente.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0 && selectedExpense) {
      const uploadedFile = result.successful[0];
      
      createReceiptMutation.mutate({
        expenseId: selectedExpense,
        receiptURL: uploadedFile.uploadURL,
        fileType: uploadedFile.type || 'application/pdf',
        fileName: uploadedFile.name || 'receipt',
      });
    }
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pago':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'reembolsado':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'educação':
        return 'bg-blue-100 text-blue-800';
      case 'saúde':
        return 'bg-green-100 text-green-800';
      case 'alimentação':
        return 'bg-orange-100 text-orange-800';
      case 'vestuário':
        return 'bg-purple-100 text-purple-800';
      case 'transporte':
        return 'bg-yellow-100 text-yellow-800';
      case 'lazer':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique values for filters
  const uniqueValues = useMemo(() => getUniqueValues(expenses || []), [expenses]);

  // Filter expenses based on all criteria
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return expenses.filter((expense: any) => {
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
      
      // Year filter
      if (selectedYear && selectedYear !== "all-years") {
        const expenseYear = getYear(parseISO(expense.expenseDate));
        if (expenseYear.toString() !== selectedYear) return false;
      }
      
      // Month filter
      if (selectedMonth && selectedMonth !== "all-months") {
        const expenseMonth = getMonth(parseISO(expense.expenseDate));
        if (expenseMonth.toString() !== selectedMonth) return false;
      }
      
      // Child filter
      if (selectedChild && selectedChild !== "all-children") {
        const childName = `${expense.child.firstName}${expense.child.lastName ? ` ${expense.child.lastName}` : ''}`;
        if (childName !== selectedChild) return false;
      }
      
      // File type filter
      if (selectedFileType && selectedFileType !== "all-types") {
        const hasMatchingFileType = expense.receipts?.some((receipt: any) => 
          receipt.fileType === selectedFileType
        );
        if (!hasMatchingFileType) return false;
      }
      
      // Amount range filter
      const amount = parseFloat(expense.amount);
      if (minAmount && amount < parseFloat(minAmount)) return false;
      if (maxAmount && amount > parseFloat(maxAmount)) return false;
      
      return true;
    });
  }, [expenses, searchTerm, selectedYear, selectedMonth, selectedChild, selectedFileType, minAmount, maxAmount]);

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

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedYear("all-years");
    setSelectedMonth("all-months");
    setSelectedChild("all-children");
    setSelectedFileType("all-types");
    setMinAmount("");
    setMaxAmount("");
  };

  // Get all receipts from all expenses
  const allReceipts = filteredExpenses.flatMap((expense: any) => 
    (expense.receipts || []).map((receipt: any) => ({
      ...receipt,
      expense,
    }))
  );

  if (expensesLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="title-receipts">Comprovantes</h1>
            <p className="text-muted-foreground">Gerencie todos os comprovantes das despesas</p>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-receipt">
                <Upload className="mr-2 w-4 h-4" />
                Enviar Comprovante
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" data-testid="dialog-upload-receipt">
              <DialogHeader>
                <DialogTitle>Enviar Comprovante</DialogTitle>
                <DialogDescription>
                  Selecione a despesa e envie o comprovante correspondente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Despesa *</label>
                  <Select value={selectedExpense} onValueChange={setSelectedExpense}>
                    <SelectTrigger data-testid="select-expense-for-receipt">
                      <SelectValue placeholder="Selecione uma despesa" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenses?.map((expense: any) => (
                        <SelectItem key={expense.id} value={expense.id}>
                          {expense.description} - {expense.child.firstName} - {formatCurrency(expense.amount)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedExpense && user?.id && expenses && (() => {
                  const expense = expenses.find(e => e.id === selectedExpense);
                  if (!expense || !expense.child?.id) {
                    return null;
                  }
                  
                  // Format expenseDate to YYYY-MM-DD format
                  const formattedDate = format(parseISO(expense.expenseDate), 'yyyy-MM-dd');
                  
                  const organizationParams = {
                    userId: user.id,
                    childId: expense.child.id,
                    expenseDate: formattedDate,
                  };

                  return (
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760} // 10MB
                      onGetUploadParameters={handleGetUploadParameters}
                      onComplete={handleUploadComplete}
                      buttonClassName="w-full"
                      organizationParams={organizationParams}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span>Selecionar Arquivo</span>
                      </div>
                    </ObjectUploader>
                  );
                })()}
              </div>
            </DialogContent>
          </Dialog>
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
                data-testid="input-search-receipts"
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

                    {/* File Type Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <FileIcon className="w-4 h-4" />
                        Tipo de Arquivo
                      </label>
                      <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                        <SelectTrigger data-testid="select-filetype-filter">
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-types">Todos os tipos</SelectItem>
                          {uniqueValues.fileTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Min Amount Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Valor Mínimo
                      </label>
                      <Input
                        type="number"
                        placeholder="R$ 0,00"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        data-testid="input-min-amount"
                      />
                    </div>

                    {/* Max Amount Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Valor Máximo
                      </label>
                      <Input
                        type="number"
                        placeholder="R$ 1000,00"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        data-testid="input-max-amount"
                      />
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
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total de Comprovantes</p>
                    <p className="text-2xl font-bold" data-testid="text-total-receipts">{allReceipts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Despesas com Comprovante</p>
                    <p className="text-2xl font-bold" data-testid="text-expenses-with-receipts">
                      {filteredExpenses.filter((e: any) => e.receipts && e.receipts.length > 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Sem Comprovante</p>
                    <p className="text-2xl font-bold" data-testid="text-expenses-without-receipts">
                      {filteredExpenses.filter((e: any) => !e.receipts || e.receipts.length === 0).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hierarchical Receipts View */}
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
                                                        <FileText className="w-4 h-4 text-green-600" />
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
                                                                  {formatDate(expense.expenseDate)} • {formatCurrency(expense.amount)}
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
                                                                {(!expense.receipts || expense.receipts.length === 0) && (
                                                                  <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                      setSelectedExpense(expense.id);
                                                                      setIsUploadDialogOpen(true);
                                                                    }}
                                                                    data-testid={`button-add-receipt-${expense.id}`}
                                                                  >
                                                                    <Plus className="w-4 h-4 mr-1" />
                                                                    Adicionar
                                                                  </Button>
                                                                )}
                                                              </div>
                                                            </div>
                                                          </CardHeader>
                                                          <CardContent>
                                                            {expense.receipts && expense.receipts.length > 0 ? (
                                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {expense.receipts.map((receipt: any) => (
                                                                  <Card key={receipt.id} className="hover-elevate">
                                                                    <CardContent className="p-3">
                                                                      <div className="flex items-start justify-between">
                                                                        <div className="flex items-center space-x-3">
                                                                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                            <FileText className="w-4 h-4 text-blue-600" />
                                                                          </div>
                                                                          <div className="min-w-0 flex-1">
                                                                            <p className="text-sm font-medium truncate" data-testid={`text-receipt-name-${receipt.id}`}>
                                                                              {receipt.fileName || 'Comprovante'}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                              {formatDate(receipt.uploadedAt)}
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                              {receipt.fileType}
                                                                            </p>
                                                                          </div>
                                                                        </div>
                                                                        <div className="flex space-x-1">
                                                                          <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => window.open(receipt.filePath, '_blank')}
                                                                            data-testid={`button-view-receipt-${receipt.id}`}
                                                                          >
                                                                            <Eye className="w-4 h-4" />
                                                                          </Button>
                                                                          <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => deleteReceiptMutation.mutate(receipt.id)}
                                                                            data-testid={`button-delete-receipt-${receipt.id}`}
                                                                          >
                                                                            <Trash2 className="w-4 h-4 text-destructive" />
                                                                          </Button>
                                                                        </div>
                                                                      </div>
                                                                    </CardContent>
                                                                  </Card>
                                                                ))}
                                                              </div>
                                                            ) : (
                                                              <div className="text-center py-6 text-muted-foreground">
                                                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-90" />
                                                                <p className="text-sm">Nenhum comprovante anexado</p>
                                                                <p className="text-xs">Clique em "Adicionar" para enviar um comprovante</p>
                                                              </div>
                                                            )}
                                                          </CardContent>
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
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/90 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma despesa encontrada
                </h3>
                <p className="text-muted-foreground mb-6">
                  {filteredExpenses.length === 0 && expenses?.length > 0 
                    ? "Nenhuma despesa corresponde aos filtros aplicados. Tente ajustar os critérios de busca."
                    : "Adicione algumas despesas para começar a anexar comprovantes."
                  }
                </p>
                {filteredExpenses.length === 0 && expenses?.length > 0 && (
                  <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters-empty">
                    Limpar Filtros
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
