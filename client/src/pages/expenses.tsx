import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Filter, Search, Receipt, Edit, Trash2, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/ui/expense-form";
import { ExpensesTable } from "@/components/ui/expenses-table";
import { isUnauthorizedError } from "@/lib/authUtils";

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

export default function Expenses() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedChild, setSelectedChild] = useState("");
  const { toast } = useToast();

  // Build query parameters for filtering
  const queryParams = new URLSearchParams();
  if (selectedCategory) queryParams.append('category', selectedCategory);
  if (selectedStatus) queryParams.append('status', selectedStatus);
  if (selectedChild) queryParams.append('childId', selectedChild);

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", queryParams.toString()],
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
      await apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
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

  const handleCreateExpense = (data: any) => {
    createExpenseMutation.mutate(data);
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
  };

  // Filter expenses based on search term
  const filteredExpenses = expenses?.filter((expense: any) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      expense.description.toLowerCase().includes(searchLower) ||
      expense.child.firstName.toLowerCase().includes(searchLower) ||
      expense.category.toLowerCase().includes(searchLower)
    );
  }) || [];

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
                isLoading={createExpenseMutation.isPending}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <main className="p-6 space-y-6">
        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 w-5 h-5" />
              Filtros e Busca
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por descrição, filho ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-expenses"
                  />
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="select-filter-category">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem 
                      key={category.value} 
                      value={category.value}
                    >
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger data-testid="select-filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem 
                      key={status.value} 
                      value={status.value}
                    >
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger data-testid="select-filter-child">
                  <SelectValue placeholder="Filho" />
                </SelectTrigger>
                <SelectContent>
                  {children?.map((child: any) => (
                    <SelectItem 
                      key={child.id} 
                      value={child.id}
                    >
                      {child.firstName} {child.lastName || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(selectedCategory || selectedStatus || selectedChild || searchTerm) && (
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  data-testid="button-clear-filters"
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card data-testid="table-expenses">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Receipt className="mr-2 w-5 h-5" />
                Despesas ({filteredExpenses.length})
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 w-4 h-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Filho</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredExpenses.map((expense: any) => (
                    <tr key={expense.id} className="hover:bg-muted">
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(expense.expenseDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{expense.description}</td>
                      <td className="px-6 py-4 text-sm">
                        {expense.child?.firstName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          expense.category === 'educação' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-300' :
                          expense.category === 'saúde' ? 'bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-300' :
                          expense.category === 'lazer' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/80 dark:text-yellow-300' :
                          expense.category === 'vestuário' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-300' :
                          expense.category === 'transporte' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-300' :
                          expense.category === 'alimentação' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/80 dark:text-orange-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/80 dark:text-gray-300'
                        }`}>
                          {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        R$ {Number(expense.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          expense.status === 'pago' ? 'bg-green-100 text-green-800 dark:bg-green-900/80 dark:text-green-300' :
                          expense.status === 'pendente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/80 dark:text-yellow-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-300'
                        }`}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingExpense(expense)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setExpenseToDelete(expense)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

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
