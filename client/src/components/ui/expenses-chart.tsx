import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
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
      <CardHeader className="px-4 sm:px-6">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle className="text-base sm:text-lg">Gastos por Categoria</CardTitle>
          <Select defaultValue="30">
            <SelectTrigger className="w-full sm:w-40 text-base">
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
      <CardContent className="px-4 sm:px-6">
        {data.length > 0 ? (
          <div className="space-y-4">
            {/* Chart */}
            <div className="h-56 sm:h-72 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={isMobile ? 45 : 70}
                    outerRadius={isMobile ? 90 : 120}
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
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 pt-2">
              {data.map((item) => (
                <div key={item.category} className="flex items-center gap-1.5 bg-muted/50 hover-elevate rounded-md px-2 py-1.5 text-sm whitespace-nowrap min-w-fit">
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: getCategoryColor(item.category) }}
                  />
                  <span className="text-foreground capitalize font-medium">{item.category}</span>
                  <span className="text-foreground font-semibold">
                    {formatCurrency(item.amount)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-56 sm:h-72 md:h-80 text-muted-foreground">
            <div className="text-center p-4">
              <p className="text-base sm:text-lg font-medium">Nenhuma despesa encontrada</p>
              <p className="text-sm sm:text-base mt-2 text-muted-foreground">Adicione algumas despesas para ver os gráficos</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
