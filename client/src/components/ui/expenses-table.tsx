import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { MoreHorizontal, Paperclip } from "lucide-react";
import { formatDateForBrazil } from "@/lib/date-utils";

interface ExpenseWithDetails {
  id: string;
  description: string;
  amount: string;
  status: string;
  category: string;
  expenseDate: string;
  createdAt: string;
  child: {
    firstName: string;
    lastName?: string;
  };
  receipts?: Array<{
    id: string;
    fileName: string;
  }>;
}

interface ExpensesTableProps {
  expenses: ExpenseWithDetails[];
  loading?: boolean;
  showPagination?: boolean;
  className?: string;
}

export function ExpensesTable({ 
  expenses, 
  loading = false, 
  showPagination = true, 
  className,
  ...props 
}: ExpensesTableProps) {
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
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

  const getChildInitials = (firstName: string, lastName?: string) => {
    const first = firstName.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  const getChildAvatarColor = (name: string) => {
    const colors = ['bg-blue-100', 'bg-purple-100', 'bg-green-100', 'bg-yellow-100', 'bg-pink-100'];
    const textColors = ['text-blue-800', 'text-purple-800', 'text-green-800', 'text-yellow-800', 'text-pink-800'];
    const index = name.charCodeAt(0) % colors.length;
    return `${colors[index]} ${textColors[index]}`;
  };

  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
              <div className="w-20 h-6 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile Card Layout
    return (
      <div className={className} {...props}>
        <div className="space-y-4">
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <Card key={expense.id} className="p-4 hover-elevate">
                <div className="space-y-4">
                  {/* Header with description and actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm leading-tight">{expense.description}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateForBrazil(expense.expenseDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {expense.receipts && expense.receipts.length > 0 && (
                        <Button variant="ghost" size="icon" data-testid={`button-view-receipt-${expense.id}`}>
                          <Paperclip className="w-4 h-4 text-primary" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" data-testid={`button-expense-actions-${expense.id}`}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Main info row */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={getChildAvatarColor(expense.child.firstName)}>
                          {getChildInitials(expense.child.firstName, expense.child.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{expense.child.firstName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">{formatCurrency(expense.amount)}</div>
                    </div>
                  </div>
                  
                  {/* Badges row */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={getCategoryColor(expense.category)} variant="secondary">
                      {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                    </Badge>
                    <Badge className={getStatusColor(expense.status)} variant="secondary">
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-base">Nenhuma despesa encontrada</p>
              <p className="text-sm mt-2">Adicione sua primeira despesa para começar</p>
            </div>
          )}
        </div>
        
        {showPagination && expenses.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-6 border-t border-border bg-muted">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Mostrando 1-{Math.min(10, expenses.length)} de {expenses.length} despesas
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Button variant="outline" size="default" disabled data-testid="button-previous-page">
                Anterior
              </Button>
              <Button variant="outline" size="default" disabled data-testid="button-next-page">
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Table Layout
  return (
    <div className={className} {...props}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Filho</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Comprovante</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-muted">
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{expense.description}</div>
                      <div className="text-xs text-muted-foreground">
                        Cadastrado em {formatDateForBrazil(expense.createdAt)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={getChildAvatarColor(expense.child.firstName)}>
                          {getChildInitials(expense.child.firstName, expense.child.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{expense.child.firstName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(expense.category)} variant="secondary">
                      {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateForBrazil(expense.expenseDate)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(expense.status)} variant="secondary">
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {expense.receipts && expense.receipts.length > 0 ? (
                      <Button variant="ghost" size="sm" data-testid={`button-view-receipt-${expense.id}`}>
                        <Paperclip className="w-4 h-4 text-primary" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem comprovante</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" data-testid={`button-expense-actions-${expense.id}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <div>
                    <p>Nenhuma despesa encontrada</p>
                    <p className="text-sm">Adicione sua primeira despesa para começar</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {showPagination && expenses.length > 0 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Mostrando 1-{Math.min(10, expenses.length)} de {expenses.length} despesas
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled data-testid="button-previous-page">
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled data-testid="button-next-page">
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
