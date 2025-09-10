import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Plus, Upload, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExpenseWithDetails {
  id: string;
  description: string;
  amount: string;
  status: string;
  createdAt: string;
  child: {
    firstName: string;
    lastName?: string;
  };
  category: string;
}

interface RecentActivitiesProps {
  expenses: ExpenseWithDetails[];
  className?: string;
}

export function RecentActivities({ expenses, className, ...props }: RecentActivitiesProps) {
  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pago':
        return 'default'; // green
      case 'pendente':
        return 'secondary'; // yellow
      case 'reembolsado':
        return 'outline'; // blue
      default:
        return 'secondary';
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

  const getActivityIcon = (index: number) => {
    // Simulate different activity types for visual variety
    const icons = [Plus, Upload, FileText];
    const colors = ['text-green-600 bg-green-100', 'text-blue-600 bg-blue-100', 'text-purple-600 bg-purple-100'];
    const IconComponent = icons[index % icons.length];
    const colorClass = colors[index % colors.length];
    
    return { IconComponent, colorClass };
  };

  const getActivityType = (index: number) => {
    const types = ['Nova despesa adicionada', 'Comprovante enviado', 'Relatório gerado'];
    return types[index % types.length];
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'há pouco tempo';
    }
  };

  return (
    <Card className={className} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Atividades Recentes</CardTitle>
          <Link href="/expenses">
            <a className="text-sm text-primary hover:text-primary/80" data-testid="link-view-all-activities">
              Ver todas
            </a>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length > 0 ? (
          <div className="space-y-4">
            {expenses.map((expense, index) => {
              const { IconComponent, colorClass } = getActivityIcon(index);
              const activityType = getActivityType(index);
              
              return (
                <div key={expense.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{activityType}</p>
                    <p className="text-sm text-muted-foreground">
                      {expense.description} - {expense.child.firstName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(expense.amount)} • {formatTimeAgo(expense.createdAt)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge 
                      className={getStatusColor(expense.status)}
                      data-testid={`badge-status-${expense.status}`}
                    >
                      {expense.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <p>Nenhuma atividade recente</p>
            <p className="text-sm">As atividades aparecerão aqui quando você adicionar despesas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
