import { useState } from "react";
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
import { FileText, Upload, Search, Eye, Trash2, Download, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
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

export default function Receipts() {
  const [selectedExpense, setSelectedExpense] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    retry: false,
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["/api/children"],
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

  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/objects/upload");
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
                
                {selectedExpense && (
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760} // 10MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleUploadComplete}
                    buttonClassName="w-full"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      <span>Selecionar Arquivo</span>
                    </div>
                  </ObjectUploader>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <main className="p-6">
        {/* Search and Summary */}
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
          </div>

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

        {/* Expenses with Receipts */}
        <div className="space-y-6">
          {filteredExpenses.length > 0 ? (
            filteredExpenses.map((expense: any) => (
              <Card key={expense.id} data-testid={`card-expense-${expense.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{expense.description}</CardTitle>
                      <CardDescription className="mt-1">
                        {expense.child.firstName} • {formatDate(expense.expenseDate)} • {formatCurrency(expense.amount)}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {expense.receipts.map((receipt: any) => (
                        <Card key={receipt.id} className="hover-elevate">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-blue-600" />
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
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-90" />
                      <p>Nenhum comprovante anexado</p>
                      <p className="text-sm">Clique em "Adicionar" para enviar um comprovante</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/90 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Nenhuma despesa encontrada
                </h3>
                <p className="text-muted-foreground mb-6">
                  Adicione algumas despesas para começar a anexar comprovantes.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
