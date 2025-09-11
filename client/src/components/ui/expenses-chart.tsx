import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ExpensesChartProps {
  data: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  userCategoryColors?: Record<string, string>;
  fallbackColor?: string;
  categoryColors?: Record<string, string>; // Manter para compatibilidade
  className?: string;
}

export function ExpensesChart({ data, userCategoryColors, fallbackColor, categoryColors, className, ...props }: ExpensesChartProps) {
  // Extrair props customizadas para evitar warnings do React
  const { ...cardProps } = props;
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const chartData = data.map(item => ({
    name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    value: item.amount,
    percentage: item.percentage,
    color: getCategoryColor(item.category)
  }));

  function getCategoryColor(category: string): string {
    // Priorizar cores das categorias definidas pelo usuário
    if (userCategoryColors && userCategoryColors[category.toLowerCase()]) {
      return userCategoryColors[category.toLowerCase()];
    }

    // Fallback para categorias não definidas pelo usuário
    if (fallbackColor) {
      return fallbackColor;
    }

    // Compatibilidade com o sistema antigo
    if (categoryColors) {
      const colorMap: Record<string, string> = {
        'educação': '#3b82f6',
        'saúde': '#10b981',
        'alimentação': '#f97316',
        'vestuário': '#8b5cf6',
        'transporte': '#eab308',
        'lazer': '#ec4899',
        'outros': '#6b7280'
      };
      return colorMap[category.toLowerCase()] || '#6b7280';
    }

    // Cor padrão final
    return '#6b7280';
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-card border border-border p-2 rounded-lg shadow-md">
          <p className="text-sm font-medium">{data.payload.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(data.value)} ({data.payload.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className} {...cardProps}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gastos por Categoria</CardTitle>
          <Select defaultValue="30">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Este ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {data.map((item) => (
                <div key={item.category} className="flex items-center justify-between py-1">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getCategoryColor(item.category) }}
                    />
                    <span className="text-sm text-foreground capitalize">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p>Nenhuma despesa encontrada</p>
              <p className="text-sm">Adicione algumas despesas para ver os gráficos</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
