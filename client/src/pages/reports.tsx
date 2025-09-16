import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { BarChart3, Download, FileText, Filter, Calendar, TrendingUp, PieChart } from "lucide-react";
import { format, parse, subDays, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import { Chart, registerables } from 'chart.js';
import { useGlobalProgress } from "@/contexts/progress-context";
import { PdfDownloadModal } from "@/components/pdf-download-modal";
import type { Category, Lawyer, LegalCase, Parent, Child } from "@shared/schema";
// PDF.js será carregado dinamicamente

// Registrar os componentes do Chart.js
Chart.register(...registerables);

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


interface DashboardStats {
  totalSpent: number;
  pendingAmount: number;
  childrenCount: number;
  receiptsCount: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  recentExpenses: any[];
}


// Função auxiliar para carregar arquivo do object storage via API
const loadFileFromStorage = async (filePath: string): Promise<{ data: string; type: string } | null> => {
  try {
    const response = await fetch(`/api/object-storage/image?path=${encodeURIComponent(filePath)}`);
    
    if (!response.ok) {
      console.warn(`Erro ao buscar arquivo: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || blob.type;
    
    // Converter blob para base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ 
        data: reader.result as string, 
        type: contentType 
      });
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Erro ao carregar arquivo ${filePath}:`, error);
    return null;
  }
};

// Função para comprimir imagem e reduzir tamanho
const compressImage = async (imageData: string, maxWidth: number = 1600, quality: number = 0.85): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calcular novas dimensões mantendo aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Converter para JPEG com qualidade reduzida
      const compressedData = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedData);
    };
    
    img.onerror = () => resolve(imageData); // Fallback para imagem original
    img.src = imageData;
  });
};

// Função para gerar gráfico de pizza das categorias
const generatePieChart = async (categoryTotals: Record<string, number>): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // Aumentar resolução para melhor qualidade
    const scale = 2;
    canvas.width = 800 * scale;
    canvas.height = 600 * scale;
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    // Paleta de cores moderna e profissional
    const colors = [
      '#6366F1', // Azul índigo
      '#EC4899', // Rosa vibrante
      '#10B981', // Verde esmeralda
      '#F59E0B', // Âmbar
      '#8B5CF6', // Violeta
      '#EF4444', // Vermelho
      '#06B6D4', // Ciano
      '#84CC16', // Lima
      '#F97316', // Laranja
      '#6B7280'  // Cinza
    ];
    
    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 5,
          borderColor: '#ffffff',
          hoverBorderWidth: 5,
          hoverBorderColor: '#ffffff',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                size: 26,
                family: 'Times, serif',
                weight: 500
              },
              padding: 25,
              usePointStyle: true,
              pointStyle: 'circle',
              // Adicionar valores na legenda para melhor legibilidade em P&B
              generateLabels: function(chart: any) {
                const data = chart.data;
                if (data.labels && data.labels.length && data.datasets.length) {
                  const dataset = data.datasets[0];
                  const validData = dataset.data.filter((val: any) => val !== null && val !== undefined);
                  const total = validData.reduce((sum: number, value: number) => sum + (value || 0), 0);
                  
                  return data.labels.map((label: string, i: number) => {
                    const value = dataset.data[i] || 0;
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    const amount = value.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    });
                    
                    return {
                      text: `${label}: ${amount} (${percentage}%)`,
                      fillStyle: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor,
                      strokeStyle: dataset.borderColor,
                      lineWidth: dataset.borderWidth,
                      pointStyle: 'circle' as const,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          title: {
            display: true,
            text: 'Distribuição por Categoria',
            font: {
              size: 32,
              weight: 'bold',
              family: 'Times, serif'
            },
            padding: {
              top: 10,
              bottom: 20
            },
            color: '#000000'
          }
        },
        layout: {
          padding: 30
        },
        elements: {
          arc: {
            borderRadius: 2
          }
        }
      }
    });
    
    // Aguardar o gráfico ser renderizado e converter para imagem de alta qualidade
    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png', 1.0);
      chart.destroy();
      resolve(imageData);
    }, 800);
  });
};

// Função para gerar gráfico de linha do acumulado anual
const generateAccumulatedLineChart = async (expenses: any[]): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // Aumentar resolução para melhor qualidade
    const scale = 2;
    canvas.width = 900 * scale;
    canvas.height = 500 * scale;
    canvas.style.width = '900px';
    canvas.style.height = '500px';
    
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    
    // Organizar dados por mês
    const monthlyData: Record<string, number> = {};
    const sortedExpenses = expenses.sort((a, b) => new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime());
    
    let accumulated = 0;
    sortedExpenses.forEach(expense => {
      const date = new Date(expense.expenseDate);
      const monthKey = format(date, 'MMM/yyyy', { locale: ptBR });
      accumulated += parseFloat(expense.amount);
      monthlyData[monthKey] = accumulated;
    });
    
    const labels = Object.keys(monthlyData);
    const data = Object.values(monthlyData);
    
    // Fundo sutil para melhor legibilidade em P&B (reduzida transparência)
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Acumulado (R$)',
          data: data,
          borderColor: '#000080', // Azul mais escuro para melhor contraste em P&B
          backgroundColor: gradient,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#000080',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 4,
          pointRadius: 7,
          pointHoverRadius: 10,
          borderWidth: 5, // Linha mais grossa para impressão
          pointHoverBorderWidth: 5
        }]
      },
      options: {
        responsive: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 26,
                family: 'Times, serif',
                weight: 500
              },
              padding: 25,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Acumulado Anual de Despesas',
            font: {
              size: 32,
              weight: 'bold',
              family: 'Times, serif'
            },
            padding: {
              top: 10,
              bottom: 20
            },
            color: '#000000'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.2)', // Grid mais escuro para P&B

              lineWidth: 1
            },
            ticks: {
              font: {
                size: 22,
                family: 'Times, serif'
              },
              color: '#000000',
              padding: 15,
              callback: function(value: any) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.15)',

              lineWidth: 1
            },
            ticks: {
              font: {
                size: 22,
                family: 'Times, serif'
              },
              color: '#000000',
              maxRotation: 45,
              padding: 8
            }
          }
        },
        layout: {
          padding: 30
        }
      }
    });
    
    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png', 1.0);
      chart.destroy();
      resolve(imageData);
    }, 800);
  });
};

// Função para gerar gráfico de barras das despesas por mês
const generateMonthlyBarChart = async (expenses: any[]): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // Aumentar resolução para melhor qualidade
    const scale = 2;
    canvas.width = 900 * scale;
    canvas.height = 500 * scale;
    canvas.style.width = '900px';
    canvas.style.height = '500px';
    
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    
    // Organizar dados por mês
    const monthlyData: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.expenseDate);
      const monthKey = format(date, 'MMM/yyyy', { locale: ptBR });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(expense.amount);
    });
    
    const sortedEntries = Object.entries(monthlyData).sort((a, b) => {
      const dateA = parse(a[0], 'MMM/yyyy', new Date(), { locale: ptBR });
      const dateB = parse(b[0], 'MMM/yyyy', new Date(), { locale: ptBR });
      return dateA.getTime() - dateB.getTime();
    });
    
    const labels = sortedEntries.map(([month]) => month);
    const data = sortedEntries.map(([, amount]) => amount);
    
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Gastos Mensais (R$)',
          data: data,
          backgroundColor: '#4B5563', // Cinza escuro sólido para melhor P&B
          borderColor: '#000000',
          borderWidth: 2,
          borderRadius: 3, // Radius menor para impressão
          borderSkipped: false,
          hoverBorderWidth: 3,
          hoverBorderColor: '#000000'
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 26,
                family: 'Times, serif',
                weight: 500
              },
              padding: 25,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Despesas por Mês',
            font: {
              size: 32,
              weight: 'bold',
              family: 'Times, serif'
            },
            padding: {
              top: 10,
              bottom: 20
            },
            color: '#000000'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.2)', // Grid mais escuro para P&B

              lineWidth: 1
            },
            ticks: {
              font: {
                size: 22,
                family: 'Times, serif'
              },
              color: '#000000',
              padding: 15,
              callback: function(value: any) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 22,
                family: 'Times, serif'
              },
              color: '#000000',
              maxRotation: 45,
              padding: 8
            }
          }
        },
        layout: {
          padding: 30
        },
        elements: {
          bar: {
            borderRadius: 3
          }
        }
      }
    });
    
    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png', 1.0);
      chart.destroy();
      resolve(imageData);
    }, 800);
  });
};

// Função para gerar gráfico de tendência (média móvel)
const generateTrendChart = async (expenses: any[]): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    // Aumentar resolução para melhor qualidade
    const scale = 2;
    canvas.width = 900 * scale;
    canvas.height = 500 * scale;
    canvas.style.width = '900px';
    canvas.style.height = '500px';
    
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);
    
    // Organizar dados por mês
    const monthlyData: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.expenseDate);
      const monthKey = format(date, 'MMM/yyyy', { locale: ptBR });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(expense.amount);
    });
    
    const sortedEntries = Object.entries(monthlyData).sort((a, b) => {
      const dateA = parse(a[0], 'MMM/yyyy', new Date(), { locale: ptBR });
      const dateB = parse(b[0], 'MMM/yyyy', new Date(), { locale: ptBR });
      return dateA.getTime() - dateB.getTime();
    });
    
    const labels = sortedEntries.map(([month]) => month);
    const data = sortedEntries.map(([, amount]) => amount);
    
    // Calcular média móvel de 3 meses
    const movingAverage = data.map((_, index) => {
      if (index < 2) return data[index];
      const sum = data[index] + data[index - 1] + data[index - 2];
      return sum / 3;
    });
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Gastos Mensais (R$)',
            data: data,
            borderColor: '#000000', // Preto sólido para melhor P&B
            backgroundColor: 'rgba(0, 0, 0, 0.05)', // Fundo muito sutil
            fill: false, // Sem preenchimento para melhor legibilidade em P&B
            tension: 0.3,
            pointRadius: 7,
            pointBackgroundColor: '#000000',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 3,
            pointHoverRadius: 10,
            borderWidth: 5, // Linha mais grossa
            pointHoverBorderWidth: 4,
            pointStyle: 'circle'
          },
          {
            label: 'Tendência (Média Móvel 3 meses)',
            data: movingAverage,
            borderColor: '#4B5563', // Cinza escuro para distinguir
            backgroundColor: 'rgba(75, 85, 99, 0.05)',
            fill: false, // Sem preenchimento para melhor legibilidade em P&B
            tension: 0.3,
            pointRadius: 6,
            pointBackgroundColor: '#4B5563',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 3,
            pointHoverRadius: 11,
            borderWidth: 5,
            pointHoverBorderWidth: 4,
            borderDash: [8, 4], // Linha tracejada para distinguir
            pointStyle: 'triangle'
          }
        ]
      },
      options: {
        responsive: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                size: 26,
                family: 'Times, serif',
                weight: 500
              },
              padding: 25,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Tendência de Gastos Mensais',
            font: {
              size: 32,
              weight: 'bold',
              family: 'Times, serif'
            },
            padding: {
              top: 10,
              bottom: 20
            },
            color: '#000000'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.2)', // Grid mais escuro para P&B

              lineWidth: 1
            },
            ticks: {
              font: {
                size: 22,
                family: 'Times, serif'
              },
              color: '#000000',
              padding: 15,
              callback: function(value: any) {
                return 'R$ ' + value.toLocaleString('pt-BR');
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.15)',

              lineWidth: 1
            },
            ticks: {
              font: {
                size: 22,
                family: 'Times, serif'
              },
              color: '#000000',
              maxRotation: 45,
              padding: 8
            }
          }
        },
        layout: {
          padding: 30
        }
      }
    });
    
    setTimeout(() => {
      const imageData = canvas.toDataURL('image/png', 1.0);
      chart.destroy();
      resolve(imageData);
    }, 800);
  });
};


export default function Reports() {
  const [reportType, setReportType] = useState("detailed");
  const [dateRange, setDateRange] = useState("last30");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Estados para o modal de download do PDF
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [reportStats, setReportStats] = useState<{
    totalAmount: number;
    expenseCount: number;
    receiptCount: number;
    period: { start: Date; end: Date };
  } | null>(null);

  const { showProgress, updateProgress, hideProgress } = useGlobalProgress();
  const { toast } = useToast();

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    retry: false,
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["/api/children"],
    retry: false,
  });

  const { data: parents = [], isLoading: isLoadingParents, isError: isErrorParents } = useQuery<Parent[]>({
    queryKey: ["/api/parents"],
    retry: false,
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  const { data: lawyers = [] } = useQuery<Lawyer[]>({
    queryKey: ["/api/lawyers"],
    retry: false,
  });

  const { data: legalCases = [] } = useQuery<LegalCase[]>({
    queryKey: ["/api/legal-cases"],
    retry: false,
  });

  const { data: userCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: false,
  });

  // Converter categorias do usuário para o formato esperado pelo Select
  const categories = userCategories.map(category => ({
    value: category.name.toLowerCase(),
    label: category.name
  }));

  const statusOptions = [
    { value: "pendente", label: "Pendente" },
    { value: "pago", label: "Pago" },
    { value: "reembolsado", label: "Reembolsado" },
  ];

  const reportTypes = [
    { value: "detailed", label: "Relatório Detalhado", description: "Lista completa com todos os detalhes e comprovantes" },
    { value: "summary", label: "Relatório Resumido", description: "Totais por categoria e período" },
    { value: "legal", label: "Relatório Jurídico", description: "Formatado para uso em processos legais" },
  ];

  const dateRanges = [
    { value: "last7", label: "Últimos 7 dias" },
    { value: "last30", label: "Últimos 30 dias" },
    { value: "last90", label: "Últimos 90 dias" },
    { value: "last6months", label: "Últimos 6 meses" },
    { value: "lastyear", label: "Último ano" },
    { value: "custom", label: "Período personalizado" },
  ];

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "last7":
        return { start: subDays(now, 7), end: now };
      case "last30":
        return { start: subDays(now, 30), end: now };
      case "last90":
        return { start: subDays(now, 90), end: now };
      case "last6months":
        return { start: subMonths(now, 6), end: now };
      case "lastyear":
        return { start: subYears(now, 1), end: now };
      case "custom":
        return {
          start: startDate ? new Date(startDate) : subDays(now, 30),
          end: endDate ? new Date(endDate) : now
        };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  // Filter expenses based on selected criteria
  const getFilteredExpenses = () => {
    if (!expenses) return [];
    
    const { start, end } = getDateRangeFilter();
    
    return expenses.filter((expense: any) => {
      const expenseDate = new Date(expense.expenseDate);
      const dateInRange = expenseDate >= start && expenseDate <= end;
      
      const categoryMatch = selectedCategories.length === 0 || selectedCategories.includes(expense.category);
      const childMatch = selectedChildren.length === 0 || selectedChildren.includes(expense.child?.id || expense.childId);
      const statusMatch = selectedStatus.length === 0 || selectedStatus.includes(expense.status);
      
      return dateInRange && categoryMatch && childMatch && statusMatch;
    });
  };

  const generateReport = () => {
    const filteredExpenses = getFilteredExpenses();
    const { start, end } = getDateRangeFilter();
    
    // Calculate totals
    const totalAmount = filteredExpenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0);
    
    // Group by category
    const categoryTotals = filteredExpenses.reduce((acc: any, exp: any) => {
      acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});
    
    // Group by child
    const childTotals = filteredExpenses.reduce((acc: any, exp: any) => {
      const childName = exp.child.firstName;
      acc[childName] = (acc[childName] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});
    
    // Group by status
    const statusTotals = filteredExpenses.reduce((acc: any, exp: any) => {
      acc[exp.status] = (acc[exp.status] || 0) + parseFloat(exp.amount);
      return acc;
    }, {});

    return {
      filteredExpenses,
      totalAmount,
      categoryTotals,
      childTotals,
      statusTotals,
      period: { start, end },
      expenseCount: filteredExpenses.length,
      receiptCount: filteredExpenses.reduce((count: number, exp: any) => count + (exp.receipts?.length || 0), 0)
    };
  };

  const handleGeneratePDF = async () => {
    let timeoutIds: NodeJS.Timeout[] = [];
    
    try {
      // Verificar se os dados dos pais ainda estão carregando
      if (isLoadingParents) {
        toast({
          title: "Aguarde",
          description: "Os dados dos pais ainda estão sendo carregados. Tente novamente em alguns segundos.",
          variant: "default",
        });
        return;
      }
      
      if (isErrorParents) {
        toast({
          title: "Erro",
          description: "Erro ao carregar dados dos pais. Verifique sua conexão e tente novamente.",
          variant: "destructive",
        });
        return;
      }
      
      // Iniciar progresso
      showProgress("Preparando relatório...", "Gerando Relatório PDF");
      
      const timeoutId = setTimeout(() => {}, 500);
      timeoutIds.push(timeoutId);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay inicial
      
      updateProgress(10, "Coletando dados...");
      const report = generateReport();
      
      updateProgress(20, "Configurando documento PDF...");
      const pdf = new jsPDF('p', 'mm', 'A4'); // Formato A4 - norma ABNT
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Margens otimizadas para melhor aproveitamento do espaço dos comprovantes
      // Superior e inferior reduzidas para dar mais espaço às imagens
      const margins = { top: 20, bottom: 15, left: 30, right: 20 };
      const contentWidth = pageWidth - margins.left - margins.right;
      let yPosition = margins.top;
      let pageNumber = 1;

      // Função para adicionar numeração de páginas (ABNT - superior direito)
      const addPageNumber = (pageNum: number) => {
        pdf.setFontSize(10);
        pdf.setFont("times", "normal");
        pdf.text(pageNum.toString(), pageWidth - margins.right - 10, 20, { align: "right" });
      };

      // ===== PÁGINA DE CAPA (Padrão ABNT) =====
      updateProgress(30, "Criando página de capa...");
      pdf.setFont("times", "bold");
      pdf.setFontSize(14);
      
      // Nome da Instituição/Sistema (centralizado)
      yPosition = 50;
      pdf.text("SISTEMA DE GESTÃO FINANCEIRA", pageWidth / 2, yPosition, { align: "center" });
      pdf.text("PARA FILHOS DE PAIS DIVORCIADOS", pageWidth / 2, yPosition + 7, { align: "center" });
      
      // Título principal (centralizado, maiúsculo, negrito)
      yPosition = 110;
      pdf.setFontSize(16);
      pdf.text("RELATÓRIO DE PRESTAÇÃO DE CONTAS", pageWidth / 2, yPosition, { align: "center" });
      
      // Subtítulo
      yPosition += 12;
      pdf.setFontSize(14);
      pdf.text("DE DESPESAS INFANTIS", pageWidth / 2, yPosition, { align: "center" });
      
      // Subtítulo adicional - Padrão ABNT
      yPosition += 10;
      pdf.setFontSize(11);
      pdf.setFont("times", "normal");
      pdf.text("Conforme Normas ABNT para Prestação de Contas Judicial", pageWidth / 2, yPosition, { align: "center" });
      
      // Período de análise
      yPosition = 160;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      pdf.text(`Período analisado: ${formatDate(report.period.start)} a ${formatDate(report.period.end)}`, pageWidth / 2, yPosition, { align: "center" });
      
      // Data e hora de geração do relatório
      yPosition += 20;
      pdf.setFontSize(10);
      pdf.text(`Data e hora de geração: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPosition, { align: "center" });
      
      // Informações do rodapé da capa
      yPosition = 260; // Posição fixa para o rodapé
      pdf.text("Local: Brasil", pageWidth / 2, yPosition, { align: "center" });
      pdf.text(`Data: ${format(new Date(), 'MMMM \'de\' yyyy', { locale: ptBR })}`, pageWidth / 2, yPosition + 10, { align: "center" });

      // ===== PÁGINA DEDICADA PARA INFORMAÇÕES DOS FILHOS =====
      updateProgress(35, "Criando página de informações dos filhos...");
      pdf.addPage();
      pageNumber = 2;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("INFORMAÇÕES DOS FILHOS ENVOLVIDOS NO RELATÓRIO", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      // Obter crianças incluídas no relatório
      const reportChildren = selectedChildren.length > 0 
        ? children.filter(child => selectedChildren.includes(child.id))
        : children;
      
      // Calcular altura necessária por criança para evitar quebras de página
      const estimatedHeightPerChild = 70; // Estimativa conservadora
      const availableHeight = pageHeight - margins.top - margins.bottom - 60; // Espaço disponível
      const maxChildrenPerPage = Math.floor(availableHeight / estimatedHeightPerChild);
      
      // Dividir crianças em grupos para evitar quebras
      for (let i = 0; i < reportChildren.length; i += maxChildrenPerPage) {
        if (i > 0) {
          // Adicionar nova página se necessário
          pdf.addPage();
          pageNumber++;
          addPageNumber(pageNumber);
          yPosition = margins.top + 20;
        }
        
        const childrenGroup = reportChildren.slice(i, i + maxChildrenPerPage);
        
        childrenGroup.forEach((child, groupIndex) => {
          if (groupIndex > 0) yPosition += 10; // Espaço entre crianças
          
          // Nome da criança
          const childFullName = `${child.firstName}${child.lastName ? ' ' + child.lastName : ''}`;
          pdf.setFont("times", "bold");
          pdf.text(`Criança: ${childFullName}`, pageWidth / 2, yPosition, { align: "center" });
          yPosition += 10;
          
          pdf.setFont("times", "normal");
          
          // Buscar pai e mãe específicos
          const father = parents.find(parent => parent.id === child.fatherId);
          const mother = parents.find(parent => parent.id === child.motherId);
          
          if (!father && !mother) {
            pdf.text("Dados dos pais não cadastrados", pageWidth / 2, yPosition, { align: "center" });
            yPosition += 8;
          } else {
            // Mostrar informações do pai
            if (father) {
              pdf.text(`Pai: ${father.fullName}`, pageWidth / 2, yPosition, { align: "center" });
              yPosition += 6;
              
              if (father.cpf) {
                pdf.text(`CPF: ${father.cpf}`, pageWidth / 2, yPosition, { align: "center" });
                yPosition += 6;
              }
              
              if (father.city && father.state) {
                pdf.text(`Endereço: ${father.city} - ${father.state}`, pageWidth / 2, yPosition, { align: "center" });
                yPosition += 6;
              }
              
              if (father.phone) {
                pdf.text(`Telefone: ${father.phone}`, pageWidth / 2, yPosition, { align: "center" });
                yPosition += 6;
              }
              
              if (father.email) {
                pdf.text(`Email: ${father.email}`, pageWidth / 2, yPosition, { align: "center" });
                yPosition += 6;
              }
              
              yPosition += 3; // Espaço entre pai e mãe
            }
            
            // Mostrar informações da mãe
            if (mother) {
              pdf.text(`Mãe: ${mother.fullName}`, pageWidth / 2, yPosition, { align: "center" });
              yPosition += 6;
              
              if (mother.cpf) {
                pdf.text(`CPF: ${mother.cpf}`, pageWidth / 2, yPosition, { align: "center" });
                yPosition += 6;
              }
              
              if (mother.city && mother.state) {
                pdf.text(`Endereço: ${mother.city} - ${mother.state}`, pageWidth / 2, yPosition, { align: "center" });
                yPosition += 6;
              }
              
              if (mother.phone) {
                pdf.text(`Telefone: ${mother.phone}`, pageWidth / 2, yPosition, { align: "center" });
                yPosition += 6;
              }
              
              if (mother.email) {
                pdf.text(`Email: ${mother.email}`, pageWidth / 2, yPosition, { align: "center" });
                yPosition += 6;
              }
            }
          }
        });
      }

      // ===== SUMÁRIO (ABNT) =====
      updateProgress(40, "Gerando sumário...");
      pdf.addPage();
      pageNumber++;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("SUMÁRIO", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const summaryItems = [
        { text: "1 CONTEXTO LEGAL E ACORDO DE PENSÃO ALIMENTÍCIA", page: (pageNumber + 1).toString() },
        { text: "2 RESUMO EXECUTIVO", page: (pageNumber + 2).toString() },
        { text: "3 ANÁLISE FINANCEIRA", page: (pageNumber + 3).toString() },
        { text: "3.1 Distribuição por categoria", page: (pageNumber + 3).toString() },
        { text: "3.2 Distribuição por status", page: (pageNumber + 3).toString() },
        { text: "3.3 Análise de conformidade documental", page: (pageNumber + 3).toString() },
        { text: "4 GRÁFICOS E INSIGHTS", page: (pageNumber + 4).toString() },
        { text: "4.1 Distribuição por categoria", page: (pageNumber + 4).toString() },
        { text: "4.2 Acumulado anual de despesas", page: (pageNumber + 4).toString() },
        { text: "4.3 Despesas por mês", page: (pageNumber + 5).toString() },
        { text: "4.4 Tendência de gastos", page: (pageNumber + 5).toString() },
        { text: "5 DETALHAMENTO DAS DESPESAS", page: (pageNumber + 6).toString() },
        { text: "6 EXTRATO DE DESPESAS COM COMPROVANTES", page: (pageNumber + 7).toString() },
        { text: "7 CONCLUSÕES E RECOMENDAÇÕES", page: (pageNumber + 8).toString() },
        { text: "REFERÊNCIAS", page: (pageNumber + 9).toString() }
      ];
      
      summaryItems.forEach((item) => {
        // Texto do item alinhado à esquerda
        pdf.text(item.text, margins.left, yPosition);
        
        // Pontos de preenchimento
        const textWidth = pdf.getTextWidth(item.text);
        const pageNumWidth = pdf.getTextWidth(item.page);
        const availableSpace = contentWidth - textWidth - pageNumWidth;
        const dotCount = Math.floor(availableSpace / pdf.getTextWidth('.'));
        const dots = '.'.repeat(Math.max(dotCount, 3));
        
        pdf.text(dots, margins.left + textWidth, yPosition);
        
        // Número da página alinhado à direita
        pdf.text(item.page, margins.left + contentWidth - pageNumWidth, yPosition);
        
        yPosition += 8;
      });

      // ===== 1. CONTEXTO LEGAL E ACORDO DE PENSÃO ALIMENTÍCIA =====
      updateProgress(45, "Criando contexto legal...");
      pdf.addPage();
      pageNumber = 3;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("1 CONTEXTO LEGAL E ACORDO DE PENSÃO ALIMENTÍCIA", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const activeLegalCase = legalCases.find(lc => lc.status === 'em_andamento' || lc.status === 'ativo') || legalCases[0];
      const associatedLawyer = activeLegalCase?.lawyerId ? lawyers.find(l => l.id === activeLegalCase.lawyerId) : null;
      
      let contextualInfo = [];
      
      if (activeLegalCase) {
        contextualInfo = [
          "Esta seção estabelece a base legal para a prestação de contas, fornecendo ao juiz o",
          "enquadramento necessário para a análise das despesas infantis.",
          ``,
          activeLegalCase.caseNumber ? `• Número do Processo Judicial: ${activeLegalCase.caseNumber}` : `• Número do Processo Judicial: [Número do Processo]`,
          activeLegalCase.courtName ? `• Vara/Tribunal: ${activeLegalCase.courtName}` : `• Vara/Tribunal: [Vara e Tribunal]`,
          activeLegalCase.judgeName ? `• Juiz Responsável: ${activeLegalCase.judgeName}` : `• Juiz Responsável: [Nome do Juiz]`,
          activeLegalCase.startDate ? `• Data da Decisão/Acordo: ${format(new Date(activeLegalCase.startDate), 'dd/MM/yyyy')}` : `• Data da Decisão/Acordo: [Data da Decisão]`,
          activeLegalCase.alimonyAmount ? `• Valor Mensal da Pensão Alimentícia Fixada: ${formatCurrency(parseFloat(activeLegalCase.alimonyAmount.toString()))}` : `• Valor Mensal da Pensão Alimentícia Fixada: [Valor Mensal]`,
          ``,
          "• Cláusulas Relevantes do Acordo/Decisão:",
          activeLegalCase.custodyType ? `  - Tipo de Guarda: ${activeLegalCase.custodyType}` : `  - [Cláusulas específicas sobre destinação da pensão]`,
          activeLegalCase.visitationSchedule ? `  - Cronograma de Visitas: ${activeLegalCase.visitationSchedule.substring(0, 80)}${activeLegalCase.visitationSchedule.length > 80 ? '...' : ''}` : `  - [Responsabilidades e cronograma de visitas]`,
        ];
      } else {
        contextualInfo = [
          "Esta seção estabelece a base legal para a prestação de contas, fornecendo ao juiz o",
          "enquadramento necessário para a análise das despesas infantis.",
          ``,
          `• Número do Processo Judicial: [Número do Processo]`,
          `• Vara/Tribunal: [Vara e Tribunal]`,
          `• Data da Decisão/Acordo: [Data da Decisão]`,
          `• Valor Mensal da Pensão Alimentícia Fixada: [Valor Mensal]`,
          ``,
          `• Cláusulas Relevantes do Acordo/Decisão:`,
          `  - [Citar brevemente quaisquer cláusulas específicas sobre a destinação da pensão]`,
          `  - [Responsabilidades de cada genitor e despesas extraordinárias]`,
        ];
      }
      
      contextualInfo.forEach((line) => {
        if (line === '') {
          yPosition += 6;
        } else {
          const lines = pdf.splitTextToSize(line, contentWidth);
          lines.forEach((splitLine: string) => {
            pdf.text(splitLine, margins.left, yPosition);
            yPosition += 6;
          });
        }
      });

      // ===== 2. RESUMO EXECUTIVO OTIMIZADO =====
      updateProgress(50, "Criando resumo executivo otimizado...");
      pdf.addPage();
      pageNumber = 3;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("2 RESUMO EXECUTIVO OTIMIZADO", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const documentationRate = ((report.receiptCount / Math.max(report.expenseCount, 1)) * 100).toFixed(1);
      
      // Calcular valor teórico da pensão baseado no período
      const periodInMonths = Math.ceil((report.period.end.getTime() - report.period.start.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const theoreticalPensionAmount = activeLegalCase?.alimonyAmount ? 
        parseFloat(activeLegalCase.alimonyAmount.toString()) * Math.max(periodInMonths, 1) : 0;
      
      { // Block scope for Section 2 variables
        const beneficiariesText = Object.keys(report.childTotals).length > 0 ? 
          Object.keys(report.childTotals).join(', ') : '[Nome do(s) Filho(s)]';
      
      const executiveSummary = [
        `Durante o período de ${formatDate(report.period.start)} a ${formatDate(report.period.end)}, ${theoreticalPensionAmount > 0 ? `o valor total da pensão alimentícia recebida para o(s) beneficiário(s) ${beneficiariesText} foi de ${formatCurrency(theoreticalPensionAmount)}` : `foram gerenciados os recursos da pensão alimentícia para o(s) beneficiário(s) ${beneficiariesText}`}. Neste mesmo período, foram registradas e comprovadas ${report.expenseCount} despesas, totalizando ${formatCurrency(report.totalAmount)}.`,
        ``,
        `A taxa de documentação, indicando a proporção de despesas com comprovantes anexados, foi de ${documentationRate}%. A análise detalhada das despesas, conforme apresentado nas seções seguintes, demonstra a aplicação dos recursos da pensão alimentícia de acordo com as necessidades do(s) beneficiário(s) e em conformidade com o acordo/decisão judicial estabelecido.`,
        ``,
        theoreticalPensionAmount > 0 && theoreticalPensionAmount !== report.totalAmount ? 
          `${theoreticalPensionAmount > report.totalAmount ? 
            `Saldo remanescente de ${formatCurrency(theoreticalPensionAmount - report.totalAmount)} foi mantido para despesas futuras.` : 
            `Diferença adicional de ${formatCurrency(report.totalAmount - theoreticalPensionAmount)} foi aplicada complementarmente às necessidades dos beneficiários.`}` :
          `Este relatório visa fornecer ao judiciário uma base sólida para a avaliação da prestação de contas, confirmando a correta aplicação dos valores.`
      ];
      
      executiveSummary.forEach((paragraph) => {
        if (paragraph === '') {
          yPosition += 8;
        } else {
          const lines = pdf.splitTextToSize(paragraph, contentWidth);
          lines.forEach((line: string) => {
            pdf.text(line, margins.left, yPosition);
            yPosition += 6;
          });
          yPosition += 4;
        }
      });

      // Tabela de indicadores consolidados otimizada
      yPosition += 10;
      pdf.setFont("times", "bold");
      pdf.text("2.1 Indicadores Consolidados", margins.left, yPosition);
      
      yPosition += 10;
      pdf.setFont("times", "normal");
      const summaryData = [
        [`Indicador`, `Valor`],
        theoreticalPensionAmount > 0 ? [`Valor Total da Pensão Recebida`, `${formatCurrency(theoreticalPensionAmount)}`] : null,
        [`Total de Despesas Registradas`, `${report.expenseCount}`],
        [`Valor Total das Despesas Comprovadas`, `${formatCurrency(report.totalAmount)}`],
        [`Comprovantes Anexados`, `${report.receiptCount}`],
        [`Taxa de Documentação`, `${documentationRate}%`],
        [`Número de Beneficiários`, `${Object.keys(report.childTotals).length}`],
        theoreticalPensionAmount > 0 ? 
          [`Saldo Remanescente/Diferença`, `${formatCurrency(Math.abs(theoreticalPensionAmount - report.totalAmount))}`] : null
      ].filter(Boolean);
      
      // Desenhar tabela
      const tableStartY = yPosition;
      const colWidths = [100, 60];
      let currentY = tableStartY;
      
      summaryData.forEach((row, index) => {
        if (!row) return; // Add null check
        
        let xPos = margins.left;
        
        if (index === 0) {
          pdf.setFont("times", "bold");
        } else {
          pdf.setFont("times", "normal");
        }
        
        // Desenhar bordas
        pdf.rect(margins.left, currentY - 5, colWidths[0], 8);
        pdf.rect(margins.left + colWidths[0], currentY - 5, colWidths[1], 8);
        
        pdf.text(row[0], xPos + 2, currentY);
        pdf.text(row[1], xPos + colWidths[0] + 2, currentY);
        currentY += 8;
      });

      } // End block scope for Section 2

      // ===== 3. ANÁLISE FINANCEIRA DETALHADA =====
      updateProgress(60, "Analisando dados financeiros detalhadamente...");
      pdf.addPage();
      pageNumber++;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("3 ANÁLISE FINANCEIRA DETALHADA", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      { // Block scope for Section 3 variables
        const introText = "Esta seção apresenta a distribuição e análise das despesas, com foco na clareza e na relevância para o contexto judicial.";
        const introLines = pdf.splitTextToSize(introText, contentWidth);
        introLines.forEach((line: string) => {
          pdf.text(line, margins.left, yPosition);
          yPosition += 6;
        });
      } // End block scope for Section 3
      
      yPosition += 10;
      
      // 3.1 Distribuição por Categoria de Despesa (Judicial)
      pdf.setFont("times", "bold");
      pdf.text("3.1 Distribuição por Categoria de Despesa", margins.left, yPosition);
      
      yPosition += 8;
      pdf.setFont("times", "normal");
      pdf.text("As despesas foram categorizadas conforme as necessidades dos beneficiários:", margins.left, yPosition);
      yPosition += 8;
      
      // Criar tabela de categorias mais detalhada
      const categoryTableData = [[`Categoria`, `Valor (R$)`, `Percentual (%)`, `Observações`]];
      
      Object.entries(report.categoryTotals).forEach(([category, amount]) => {
        const percentage = ((amount as number / report.totalAmount) * 100).toFixed(1);
        let observation = '';
        
        // Adicionar observações contextuais para algumas categorias
        switch(category.toLowerCase()) {
          case 'educação':
          case 'educacao':
            observation = 'Necessidade essencial';
            break;
          case 'saúde':
          case 'saude':
            observation = 'Direito fundamental';
            break;
          case 'alimentação':
          case 'alimentacao':
            observation = 'Necessidade básica';
            break;
          case 'lazer':
            observation = 'Desenvolvimento social';
            break;
          case 'vestuário':
          case 'vestuario':
            observation = 'Necessidade básica';
            break;
          case 'moradia':
            observation = 'Proporcional à criança';
            break;
          default:
            observation = '';
        }
        
        categoryTableData.push([
          category.charAt(0).toUpperCase() + category.slice(1),
          formatCurrency(amount as number),
          `${percentage}%`,
          observation
        ]);
      });
      
      // Desenhar tabela de categorias
      const catColWidths = [40, 35, 25, 50];
      let catCurrentY = yPosition + 5;
      
      categoryTableData.forEach((row, index) => {
        let xPos = margins.left;
        
        if (index === 0) {
          pdf.setFont("times", "bold");
        } else {
          pdf.setFont("times", "normal");
        }
        
        // Verificar se precisa de nova página
        if (catCurrentY > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          pageNumber++;
          addPageNumber(pageNumber);
          catCurrentY = margins.top + 20;
        }
        
        // Desenhar bordas
        row.forEach((_, colIndex) => {
          pdf.rect(xPos, catCurrentY - 5, catColWidths[colIndex], 8);
          xPos += catColWidths[colIndex];
        });
        
        // Desenhar conteúdo
        xPos = margins.left;
        row.forEach((data, colIndex) => {
          pdf.text(data, xPos + 2, catCurrentY);
          xPos += catColWidths[colIndex];
        });
        catCurrentY += 8;
      });
      
      yPosition = catCurrentY + 5;
      
      // 3.2 Comparativo Mensal: Pensão vs Despesas (se dados disponíveis)
      if (theoreticalPensionAmount > 0 && periodInMonths > 0) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - margins.bottom - 60) {
          pdf.addPage();
          pageNumber++;
          addPageNumber(pageNumber);
          yPosition = margins.top + 20;
        }
        
        pdf.setFont("times", "bold");
        pdf.text("3.2 Comparativo Mensal: Pensão Recebida vs. Despesas Comprovadas", margins.left, yPosition);
        yPosition += 8;
        
        pdf.setFont("times", "normal");
        pdf.text("Esta tabela compara o valor da pensão alimentícia recebida com as despesas", margins.left, yPosition);
        yPosition += 6;
        pdf.text("efetivamente comprovadas, demonstrando a gestão dos recursos:", margins.left, yPosition);
        yPosition += 10;
        
        // Simular dados mensais para demonstração
        const monthlyPension = theoreticalPensionAmount / Math.max(periodInMonths, 1);
        const monthlyExpenses = report.totalAmount / Math.max(periodInMonths, 1);
        
        const compTableData = [
          [`Mês/Ano`, `Pensão Recebida (R$)`, `Despesas Comprovadas (R$)`, `Diferença (R$)`],
          [`Período Total`, formatCurrency(theoreticalPensionAmount), formatCurrency(report.totalAmount), formatCurrency(Math.abs(theoreticalPensionAmount - report.totalAmount))],
          [`Média Mensal`, formatCurrency(monthlyPension), formatCurrency(monthlyExpenses), formatCurrency(Math.abs(monthlyPension - monthlyExpenses))]
        ];
        
        // Desenhar tabela comparativa
        const compColWidths = [35, 45, 45, 35];
        let compCurrentY = yPosition;
        
        compTableData.forEach((row, index) => {
          let xPos = margins.left;
          
          if (index === 0) {
            pdf.setFont("times", "bold");
          } else {
            pdf.setFont("times", "normal");
          }
          
          // Desenhar bordas
          row.forEach((_, colIndex) => {
            pdf.rect(xPos, compCurrentY - 5, compColWidths[colIndex], 8);
            xPos += compColWidths[colIndex];
          });
          
          // Desenhar conteúdo
          xPos = margins.left;
          row.forEach((data, colIndex) => {
            pdf.text(data, xPos + 2, compCurrentY);
            xPos += compColWidths[colIndex];
          });
          compCurrentY += 8;
        });
        
        yPosition = compCurrentY + 10;
      }
      
      // 3.3 Distribuição por Status de Pagamento
      if (yPosition > pageHeight - margins.bottom - 40) {
        pdf.addPage();
        pageNumber++;
        addPageNumber(pageNumber);
        yPosition = margins.top + 20;
      }
      
      pdf.setFont("times", "bold");
      pdf.text("3.3 Distribuição por Status de Pagamento", margins.left, yPosition);
      
      yPosition += 10;
      pdf.setFont("times", "normal");
      
      Object.entries(report.statusTotals).forEach(([status, amount]) => {
        const percentage = ((amount as number / report.totalAmount) * 100).toFixed(1);
        const statusText = `${status.charAt(0).toUpperCase() + status.slice(1)}: ${formatCurrency(amount as number)} (${percentage}% do total)`;
        pdf.text(`• ${statusText}`, margins.left + 5, yPosition);
        yPosition += 6;
      });
      
      yPosition += 15;
      
      // 3.4 Análise de Conformidade Documental
      if (yPosition > pageHeight - margins.bottom - 40) {
        pdf.addPage();
        pageNumber++;
        addPageNumber(pageNumber);
        yPosition = margins.top + 20;
      }
      
      pdf.setFont("times", "bold");
      pdf.text("3.4 Análise de Conformidade Documental", margins.left, yPosition);
      
      yPosition += 10;
      pdf.setFont("times", "normal");
      
      const complianceScore = parseFloat(documentationRate);
      let complianceText = "";
      
      if (complianceScore >= 90) {
        complianceText = "EXCELENTE - A documentação apresenta-se de forma completa e organizada, atendendo plenamente aos requisitos de transparência e comprovação judicial. Todas as despesas possuem comprovação adequada.";
      } else if (complianceScore >= 70) {
        complianceText = "ADEQUADA - A documentação atende aos requisitos mínimos para análise judicial, porém recomenda-se a melhoria na organização dos comprovantes para fortalecer a prestação de contas.";
      } else if (complianceScore >= 50) {
        complianceText = "PARCIAL - A documentação apresenta algumas deficiências que podem comprometer a análise judicial. Recomenda-se a complementação dos comprovantes faltantes.";
      } else {
        complianceText = "INSUFICIENTE - A documentação apresenta deficiências significativas que comprometem a transparência da prestação de contas e podem prejudicar a análise judicial.";
      }
      
      const complianceLines = pdf.splitTextToSize(complianceText, contentWidth);
      complianceLines.forEach((line: string) => {
        pdf.text(line, margins.left, yPosition);
        yPosition += 6;
      });

      // ===== 4. GRÁFICOS E INSIGHTS =====
      updateProgress(65, "Gerando gráficos e insights...");
      pdf.addPage();
      pageNumber++;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("4 GRÁFICOS E INSIGHTS", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const insightsText = "Esta seção apresenta análises visuais das despesas para facilitar a compreensão dos padrões de gastos e tendências ao longo do período analisado.";
      const insightsLines = pdf.splitTextToSize(insightsText, contentWidth);
      insightsLines.forEach((line: string) => {
        pdf.text(line, margins.left, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
      
      // 3.1 Gráfico de Pizza - Distribuição por Categoria
      try {
        pdf.setFont("times", "bold");
        pdf.text("4.1 Distribuição por Categoria", margins.left, yPosition);
        yPosition += 10;
        
        const pieChartImage = await generatePieChart(report.categoryTotals);
        const pieChartWidth = 120;
        const pieChartHeight = 90;
        
        // Verificar se precisa de nova página
        if (yPosition + pieChartHeight > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          pageNumber++;
          addPageNumber(pageNumber);
          yPosition = margins.top + 20;
        }
        
        const pieChartX = margins.left + (contentWidth - pieChartWidth) / 2; // Centralizar
        pdf.addImage(pieChartImage, 'PNG', pieChartX, yPosition, pieChartWidth, pieChartHeight);
        yPosition += pieChartHeight + 15;
      } catch (error) {
        console.error("Erro ao gerar gráfico de pizza:", error);
        pdf.setFont("times", "italic");
        pdf.text("Erro ao gerar gráfico de distribuição por categoria", margins.left, yPosition);
        yPosition += 15;
      }
      
      // 3.2 Gráfico de Linha - Acumulado Anual
      try {
        // Verificar se precisa de nova página
        if (yPosition + 110 > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          pageNumber++;
          addPageNumber(pageNumber);
          yPosition = margins.top + 20;
        }
        
        pdf.setFont("times", "bold");
        pdf.text("4.2 Acumulado Anual de Despesas", margins.left, yPosition);
        yPosition += 10;
        
        const lineChartImage = await generateAccumulatedLineChart(report.filteredExpenses);
        const lineChartWidth = 140;
        const lineChartHeight = 84;
        
        const lineChartX = margins.left + (contentWidth - lineChartWidth) / 2; // Centralizar
        pdf.addImage(lineChartImage, 'PNG', lineChartX, yPosition, lineChartWidth, lineChartHeight);
        yPosition += lineChartHeight + 15;
      } catch (error) {
        console.error("Erro ao gerar gráfico de linha:", error);
        pdf.setFont("times", "italic");
        pdf.text("Erro ao gerar gráfico de acumulado anual", margins.left, yPosition);
        yPosition += 15;
      }
      
      // 3.3 Gráfico de Barras - Despesas por Mês
      try {
        // Verificar se precisa de nova página
        if (yPosition + 110 > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          pageNumber++;
          addPageNumber(pageNumber);
          yPosition = margins.top + 20;
        }
        
        pdf.setFont("times", "bold");
        pdf.text("4.3 Despesas por Mês", margins.left, yPosition);
        yPosition += 10;
        
        const barChartImage = await generateMonthlyBarChart(report.filteredExpenses);
        const barChartWidth = 140;
        const barChartHeight = 84;
        
        const barChartX = margins.left + (contentWidth - barChartWidth) / 2; // Centralizar
        pdf.addImage(barChartImage, 'PNG', barChartX, yPosition, barChartWidth, barChartHeight);
        yPosition += barChartHeight + 15;
      } catch (error) {
        console.error("Erro ao gerar gráfico de barras:", error);
        pdf.setFont("times", "italic");
        pdf.text("Erro ao gerar gráfico de despesas mensais", margins.left, yPosition);
        yPosition += 15;
      }
      
      // 3.4 Gráfico de Tendência
      try {
        // Verificar se precisa de nova página
        if (yPosition + 110 > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          pageNumber++;
          addPageNumber(pageNumber);
          yPosition = margins.top + 20;
        }
        
        pdf.setFont("times", "bold");
        pdf.text("4.4 Tendência de Gastos Mensais", margins.left, yPosition);
        yPosition += 10;
        
        const trendChartImage = await generateTrendChart(report.filteredExpenses);
        const trendChartWidth = 140;
        const trendChartHeight = 84;
        
        const trendChartX = margins.left + (contentWidth - trendChartWidth) / 2; // Centralizar
        pdf.addImage(trendChartImage, 'PNG', trendChartX, yPosition, trendChartWidth, trendChartHeight);
        yPosition += trendChartHeight + 15;
      } catch (error) {
        console.error("Erro ao gerar gráfico de tendência:", error);
        pdf.setFont("times", "italic");
        pdf.text("Erro ao gerar gráfico de tendência", margins.left, yPosition);
        yPosition += 15;
      }

      // ===== 5. DETALHAMENTO DAS DESPESAS =====
      updateProgress(70, "Detalhando despesas com observações...");
      pdf.addPage();
      pageNumber++;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("5 DETALHAMENTO DAS DESPESAS", margins.left, yPosition);
      
      yPosition += 8;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const detailIntro = "Esta seção lista cada despesa individualmente, com referência clara aos seus comprovantes, seguindo o padrão exigido para análise judicial.";
      const detailLines = pdf.splitTextToSize(detailIntro, contentWidth);
      detailLines.forEach((line: string) => {
        pdf.text(line, margins.left, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
      
      yPosition += 15;
      pdf.setFontSize(10);
      
      // Cabeçalho da tabela
      const tableHeaders = ["Data", "Descrição", "Beneficiário", "Categoria", "Valor", "Status", "Doc."];
      const tableColWidths = [18, 40, 30, 22, 24, 18, 13]; // Total: 165mm (dentro da margem de 160mm)
      let xPos = margins.left;
      
      pdf.setFont("times", "bold");
      tableHeaders.forEach((header, index) => {
        pdf.rect(xPos, yPosition - 5, tableColWidths[index], 8);
        pdf.text(header, xPos + 2, yPosition);
        xPos += tableColWidths[index];
      });
      
      yPosition += 8;
      
      // Dados da tabela
      const sortedExpenses = report.filteredExpenses.sort((a: any, b: any) => 
        new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
      );
      
      pdf.setFont("times", "normal");
      
      sortedExpenses.forEach((expense: any) => {
        if (yPosition > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          pageNumber++;
          addPageNumber(pageNumber);
          yPosition = margins.top + 20;
          
          // Recriar cabeçalho
          xPos = margins.left;
          pdf.setFont("times", "bold");
          tableHeaders.forEach((header, index) => {
            pdf.rect(xPos, yPosition - 5, tableColWidths[index], 8);
            pdf.text(header, xPos + 2, yPosition);
            xPos += tableColWidths[index];
          });
          yPosition += 8;
          pdf.setFont("times", "normal");
        }

        xPos = margins.left;
        
        // Desenhar bordas e dados
        const rowData = [
          format(new Date(expense.expenseDate), 'dd/MM/yy'),
          expense.description.length > 18 ? expense.description.substring(0, 15) + "..." : expense.description,
          expense.child.firstName.length > 12 ? expense.child.firstName.substring(0, 9) + "..." : expense.child.firstName,
          expense.category.length > 10 ? expense.category.substring(0, 7) + "..." : expense.category,
          formatCurrency(parseFloat(expense.amount)),
          expense.status.substring(0, 6),
          expense.receipts?.length ? `${expense.receipts.length}` : "0"
        ];
        
        rowData.forEach((data, index) => {
          pdf.rect(xPos, yPosition - 5, tableColWidths[index], 8);
          pdf.text(data, xPos + 2, yPosition);
          xPos += tableColWidths[index];
        });
        
        yPosition += 8;
      });

      // ===== 6. EXTRATO DE DESPESAS COM COMPROVANTES =====
      updateProgress(80, "Processando comprovantes...");
      pdf.addPage();
      pageNumber++;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("6 EXTRATO DE DESPESAS COM COMPROVANTES", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const extratoText = "Esta seção apresenta cada despesa de forma detalhada, incluindo todos os comprovantes anexados para fins de auditoria e transparência.";
      const extratoLines = pdf.splitTextToSize(extratoText, contentWidth);
      extratoLines.forEach((line: string) => {
        pdf.text(line, margins.left, yPosition);
        yPosition += 6;
      });
      
      yPosition += 15;

      // Processar cada despesa individualmente - cada uma em uma página separada para melhor visualização
      for (let index = 0; index < sortedExpenses.length; index++) {
        const expense = sortedExpenses[index];
        
        // Adicionar nova página para cada despesa (exceto a primeira)
        if (index > 0) {
          pdf.addPage();
          pageNumber++;
          addPageNumber(pageNumber);
          yPosition = margins.top + 20;
        }
        
        // Verificar se ainda precisa de nova página (por questões de espaço)
        if (yPosition > pageHeight - margins.bottom - 100) {
          pdf.addPage();
          pageNumber++;
          addPageNumber(pageNumber);
          yPosition = margins.top + 20;
        }

        // Cabeçalho da despesa
        pdf.setFontSize(12);
        pdf.setFont("times", "bold");
        pdf.text(`6.${index + 1} DESPESA #${index + 1}`, margins.left, yPosition);
        yPosition += 12;
        
        // Detalhes da despesa
        pdf.setFontSize(10);
        pdf.setFont("times", "normal");
        
        const expenseDetails = [
          `Data: ${format(new Date(expense.expenseDate), 'dd/MM/yyyy')}`,
          `Descrição: ${expense.description}`,
          `Beneficiário: ${expense.child.firstName} ${expense.child.lastName || ''}`,
          `Categoria: ${expense.category}`,
          `Valor: ${formatCurrency(parseFloat(expense.amount))}`,
          `Status: ${expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}`
        ];
        
        // Criar tabela de detalhes
        expenseDetails.forEach((detail) => {
          pdf.rect(margins.left, yPosition - 5, contentWidth, 8);
          pdf.text(detail, margins.left + 3, yPosition);
          yPosition += 8;
        });
        
        yPosition += 8;
        
        // Comprovantes
        if (expense.receipts && expense.receipts.length > 0) {
          pdf.setFont("times", "bold");
          pdf.text(`Comprovantes anexados: ${expense.receipts.length}`, margins.left, yPosition);
          yPosition += 10;
          
          pdf.setFont("times", "normal");
          
          for (let receiptIndex = 0; receiptIndex < expense.receipts.length; receiptIndex++) {
            const receipt = expense.receipts[receiptIndex];
            if (yPosition > pageHeight - margins.bottom - 20) {
              pdf.addPage();
              pageNumber++;
              addPageNumber(pageNumber);
              yPosition = margins.top + 20;
            }
            
            // Informações do comprovante
            pdf.text(`• Comprovante ${receiptIndex + 1}:`, margins.left + 5, yPosition);
            yPosition += 6;
            
            if (receipt.fileName) {
              pdf.text(`  Nome: ${receipt.fileName}`, margins.left + 10, yPosition);
              yPosition += 6;
            }
            
            if (receipt.fileType) {
              pdf.text(`  Tipo: ${receipt.fileType}`, margins.left + 10, yPosition);
              yPosition += 6;
            }
            
            if (receipt.uploadedAt) {
              pdf.text(`  Upload: ${format(new Date(receipt.uploadedAt), 'dd/MM/yyyy HH:mm')}`, margins.left + 10, yPosition);
              yPosition += 6;
            }
            
            // Carregar e inserir imagem real do comprovante
            // Agora que cada despesa tem sua própria página, podemos usar mais espaço para as imagens
            let imageHeight = 40;
            if (yPosition + 200 > pageHeight - margins.bottom - 10) {
              pdf.addPage();
              pageNumber++;
              addPageNumber(pageNumber);
              yPosition = margins.top + 20;
            }
            
            // Tentar carregar o arquivo real (imagem ou PDF)
            if (receipt.filePath) {
              try {
                const fileData = await loadFileFromStorage(receipt.filePath);
                
                if (fileData) {
                  const isImage = fileData.type.startsWith('image/');
                  
                  if (isImage) {
                    // Processar como imagem com alta qualidade para melhor legibilidade
                    const compressedImageData = await compressImage(fileData.data, 1200, 0.85);
                    
                    // Criar uma imagem temporária para obter as dimensões
                    const tempImg = new Image();
                    tempImg.src = compressedImageData;
                    
                    await new Promise((resolve) => {
                      tempImg.onload = resolve;
                      tempImg.onerror = resolve;
                    });
                    
                    // Calcular dimensões proporcionais
                    const originalWidth = tempImg.width || 600;
                    const originalHeight = tempImg.height || 400;
                    const aspectRatio = originalWidth / originalHeight;
                    
                    // Definir largura máxima e calcular altura proporcionalmente
                    // Aumentar significativamente o tamanho máximo para melhor legibilidade
                    const maxWidth = contentWidth - 20;
                    const maxHeight = 220; // Altura máxima aumentada para melhor visualização dos comprovantes
                    
                    let finalWidth = Math.min(maxWidth, originalWidth);
                    let finalHeight = finalWidth / aspectRatio;
                    
                    // Se a altura calculada exceder o máximo, recalcular baseado na altura
                    if (finalHeight > maxHeight) {
                      finalHeight = maxHeight;
                      finalWidth = maxHeight * aspectRatio;
                    }
                    
                    // Verificar se cabe na página
                    if (yPosition + finalHeight > pageHeight - margins.bottom - 10) {
                      pdf.addPage();
                      pageNumber++;
                      addPageNumber(pageNumber);
                      yPosition = margins.top + 20;
                    }
                    
                    // Centralizar a imagem se ela for menor que a largura máxima
                    const imageX = finalWidth < maxWidth ? 
                      margins.left + 10 + (maxWidth - finalWidth) / 2 : 
                      margins.left + 10;
                    
                    pdf.addImage(compressedImageData, 'JPEG', imageX, yPosition, finalWidth, finalHeight);
                    yPosition += finalHeight + 5;
                    
                  } else {
                    // Arquivo de tipo desconhecido
                    const fileHeight = 25;
                    
                    if (yPosition + fileHeight > pageHeight - margins.bottom - 10) {
                      pdf.addPage();
                      pageNumber++;
                      addPageNumber(pageNumber);
                      yPosition = margins.top + 20;
                    }
                    
                    pdf.setDrawColor(108, 117, 125);
                    pdf.setFillColor(248, 249, 250);
                    pdf.rect(margins.left + 10, yPosition, contentWidth - 20, fileHeight, 'FD');
                    
                    pdf.setFontSize(9);
                    pdf.setTextColor(108, 117, 125);
                    pdf.text(`📎 ARQUIVO: ${receipt.fileName || 'documento'}`, margins.left + 15, yPosition + 8);
                    pdf.text(`Tipo: ${fileData.type || 'desconhecido'}`, margins.left + 15, yPosition + 16);
                    
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(10);
                    yPosition += fileHeight + 5;
                  }
                } else {
                  // Fallback para placeholder se não conseguir carregar
                  pdf.setDrawColor(150, 150, 150);
                  pdf.setFillColor(245, 245, 245);
                  pdf.rect(margins.left + 10, yPosition, contentWidth - 20, imageHeight, 'FD');
                  
                  pdf.setFontSize(9);
                  pdf.setTextColor(150, 0, 0);
                  pdf.text(`[ERRO: Não foi possível carregar ${receipt.fileName || 'documento'}]`, 
                    margins.left + contentWidth/2, yPosition + imageHeight/2, { align: "center" });
                  
                  pdf.setTextColor(0, 0, 0);
                  pdf.setFontSize(10);
                  yPosition += imageHeight + 10;
                }
              } catch (error) {
                console.error("Erro ao processar arquivo:", error);
                // Fallback para placeholder em caso de erro
                pdf.setDrawColor(150, 150, 150);
                pdf.setFillColor(245, 245, 245);
                pdf.rect(margins.left + 10, yPosition, contentWidth - 20, imageHeight, 'FD');
                
                pdf.setFontSize(9);
                pdf.setTextColor(150, 0, 0);
                pdf.text(`[ERRO: ${receipt.fileName || 'documento'}]`, 
                  margins.left + contentWidth/2, yPosition + imageHeight/2, { align: "center" });
                
                pdf.setTextColor(0, 0, 0);
                pdf.setFontSize(10);
                yPosition += imageHeight + 10;
              }
            } else {
              // Placeholder quando não há filePath
              pdf.setDrawColor(150, 150, 150);
              pdf.setFillColor(245, 245, 245);
              pdf.rect(margins.left + 10, yPosition, contentWidth - 20, imageHeight, 'FD');
              
              pdf.setFontSize(9);
              pdf.setTextColor(100, 100, 100);
              pdf.text(`[SEM ARQUIVO: ${receipt.fileName || 'documento'}]`, 
                margins.left + contentWidth/2, yPosition + imageHeight/2, { align: "center" });
              
              pdf.setTextColor(0, 0, 0);
              pdf.setFontSize(10);
              yPosition += imageHeight + 15;
            }
          }
        } else {
          pdf.setFont("times", "italic");
          pdf.setTextColor(150, 0, 0);
          pdf.text("⚠ Nenhum comprovante anexado para esta despesa", margins.left, yPosition);
          pdf.setTextColor(0, 0, 0);
          pdf.setFont("times", "normal");
          yPosition += 10;
        }
        
        // Separador removido pois cada despesa agora está em página separada
      }

      // ===== 7. CONCLUSÕES E RECOMENDAÇÕES =====
      pdf.addPage();
      pageNumber++;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("7 CONCLUSÕES E RECOMENDAÇÕES", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      { // Block scope for Section 7 variables
        // Texto introdutório mais robusto
        const introConclusion = "Esta seção final resume as principais descobertas e oferece uma conclusão sobre a gestão financeira, reforçando a transparência e a adequação dos gastos para análise judicial.";
        const introLines = pdf.splitTextToSize(introConclusion, contentWidth);
        introLines.forEach((line: string) => {
          pdf.text(line, margins.left, yPosition);
          yPosition += 6;
        });
        
        yPosition += 10;
        
        const beneficiariesText = Object.keys(report.childTotals).length > 0 ? 
          Object.keys(report.childTotals).join(', ') : '[Nome do(s) Filho(s)]';
        
      const conclusions = [
        `7.1 CONCLUSÕES`,
        ``,
        `As informações apresentadas neste relatório demonstram a gestão transparente e diligente dos recursos da pensão alimentícia destinados ao(s) beneficiário(s) ${beneficiariesText} durante o período analisado. Todas as despesas foram devidamente registradas e, em sua maioria, comprovadas, refletindo o compromisso com o bem-estar e as necessidades do(s) menor(es).`,
        ``,
        `Durante o período de ${formatDate(report.period.start)} a ${formatDate(report.period.end)}, foram registradas ${report.expenseCount} despesas totalizando ${formatCurrency(report.totalAmount)}, com taxa de documentação de ${documentationRate}%. ${complianceScore >= 90 ? 'A documentação apresenta-se completa e organizada, atendendo plenamente aos requisitos judiciais.' : complianceScore >= 70 ? 'A documentação atende aos requisitos mínimos para análise judicial.' : 'Recomenda-se complementação da documentação para fortalecer a prestação de contas.'}`,
        ``,
        theoreticalPensionAmount > 0 ? 
          `A gestão dos recursos demonstra ${theoreticalPensionAmount >= report.totalAmount ? 'administração responsável com saldo remanescente para despesas futuras' : 'aplicação complementar além da pensão recebida, evidenciando o comprometimento com as necessidades dos beneficiários'}.` :
          `A aplicação dos recursos foi direcionada às necessidades essenciais dos beneficiários, conforme demonstrado nas análises apresentadas.`,
        ``,
        `Este relatório visa fornecer ao judiciário uma base sólida para a avaliação da prestação de contas, confirmando a correta aplicação dos valores em conformidade com as obrigações legais estabelecidas.`,
        ``,
        `7.2 RECOMENDAÇÕES`,
        ``
      ];
      
      conclusions.forEach((item) => {
        if (item === '') {
          yPosition += 6;
        } else if (item.startsWith('7.')) {
          pdf.setFont("times", "bold");
          pdf.text(item, margins.left, yPosition);
          pdf.setFont("times", "normal");
          yPosition += 10;
        } else {
          const lines = pdf.splitTextToSize(item, contentWidth);
          lines.forEach((line: string) => {
            pdf.text(line, margins.left, yPosition);
            yPosition += 6;
          });
          yPosition += 4;
        }
      });
      
      const recommendations = [
        "• Manter a organização cronológica e categórica das despesas conforme padrões judiciais;",
        "• Assegurar a guarda segura de todos os comprovantes de pagamento em formato físico e digital;",
        "• Documentar adequadamente despesas extraordinárias com justificativas claras;",
        "• Realizar prestação de contas periódica para manter transparência com o judiciário;",
        "• Categorizar despesas seguindo nomenclatura compatível com análise judicial;",
        "• Manter comunicação clara sobre alterações significativas nos padrões de gastos."
      ];
      
      if (complianceScore < 90) {
        recommendations.unshift("• Aprimorar a documentação anexando comprovantes faltantes para fortalecer a prestação de contas;");
      }
      
      if (complianceScore < 50) {
        recommendations.push("• Buscar orientação jurídica para adequação da prestação de contas aos padrões exigidos;");
      }
      
      recommendations.forEach((rec) => {
        const recLines = pdf.splitTextToSize(rec, contentWidth);
        recLines.forEach((line: string) => {
          pdf.text(line, margins.left, yPosition);
          yPosition += 6;
        });
        yPosition += 2;
      });
      
      } // End block scope for Section 7

      // ===== REFERÊNCIAS =====
      pdf.addPage();
      pageNumber++;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("REFERÊNCIAS", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const references = [
        "BRASIL. Constituição da República Federativa do Brasil de 1988. Brasília, DF: Senado Federal, 1988.",
        "",
        "BRASIL. Lei nº 8.069, de 13 de julho de 1990. Dispõe sobre o Estatuto da Criança e do Adolescente. Brasília, DF: Congresso Nacional, 1990.",
        "",
        "ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. ABNT NBR 14724: informação e documentação: trabalhos acadêmicos: apresentação. 3. ed. Rio de Janeiro: ABNT, 2011."
      ];
      
      references.forEach((ref) => {
        if (ref === '') {
          yPosition += 6;
        } else {
          const lines = pdf.splitTextToSize(ref, contentWidth);
          lines.forEach((line: string) => {
            pdf.text(line, margins.left, yPosition);
            yPosition += 6;
          });
          yPosition += 4;
        }
      });

      // ===== DADOS JURÍDICOS E LEGAIS =====
      pdf.addPage();
      pageNumber++;
      addPageNumber(pageNumber);
      yPosition = margins.top + 30;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("DADOS JURÍDICOS E LEGAIS", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 20;

      // 1. ADVOGADO RESPONSÁVEL
      pdf.setFontSize(12);
      pdf.setFont("times", "bold");
      pdf.text("1. ADVOGADO RESPONSÁVEL", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFont("times", "normal");
      
      if (lawyers && lawyers.length > 0) {
        const primaryLawyer = lawyers[0]; // Usar o primeiro advogado como principal
        
        const lawyerInfo = [
          `Nome: ${primaryLawyer.fullName}`,
          primaryLawyer.oabNumber ? `OAB: ${primaryLawyer.oabNumber}${primaryLawyer.oabState ? ` - ${primaryLawyer.oabState}` : ''}` : '',
          primaryLawyer.lawFirm ? `Escritório: ${primaryLawyer.lawFirm}` : '',
          primaryLawyer.phone || primaryLawyer.email ? `Contato: ${[primaryLawyer.phone, primaryLawyer.email].filter(Boolean).join(' - ')}` : '',
          primaryLawyer.specializations && primaryLawyer.specializations.length > 0 ? `Especialização: ${primaryLawyer.specializations.join(', ')}` : '',
          primaryLawyer.address ? `Endereço: ${primaryLawyer.address}` : ''
        ].filter(Boolean);
        
        lawyerInfo.forEach((info) => {
          pdf.text(info, margins.left + 5, yPosition);
          yPosition += 8;
        });
        
        if (primaryLawyer.notes) {
          yPosition += 5;
          pdf.setFont("times", "italic");
          pdf.text("Observações:", margins.left + 5, yPosition);
          yPosition += 8;
          
          const notesLines = pdf.splitTextToSize(primaryLawyer.notes, contentWidth - 10);
          notesLines.forEach((line: string) => {
            pdf.text(line, margins.left + 10, yPosition);
            yPosition += 6;
          });
          pdf.setFont("times", "normal");
        }
      } else {
        pdf.setFont("times", "italic");
        pdf.text("Nenhum advogado cadastrado no sistema.", margins.left + 5, yPosition);
        yPosition += 8;
        pdf.setFont("times", "normal");
      }
      
      yPosition += 15;

      // 2. PROCESSO JUDICIAL
      pdf.setFont("times", "bold");
      pdf.text("2. PROCESSO JUDICIAL", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFont("times", "normal");
      
      if (legalCases && legalCases.length > 0) {
        const activeCases = legalCases.filter(legalCase => legalCase.status !== 'concluído');
        const primaryCase = activeCases.length > 0 ? activeCases[0] : legalCases[0];
        
        const caseInfo = [
          `Tipo: ${primaryCase.caseType}`,
          primaryCase.caseNumber ? `Número: ${primaryCase.caseNumber}` : '',
          primaryCase.courtName ? `Vara: ${primaryCase.courtName}` : '',
          primaryCase.judgeName ? `Juiz: ${primaryCase.judgeName}` : '',
          `Status: ${primaryCase.status ? primaryCase.status.charAt(0).toUpperCase() + primaryCase.status.slice(1) : 'Não informado'}`,
          primaryCase.startDate ? `Data de Início: ${format(new Date(primaryCase.startDate), 'dd/MM/yyyy')}` : '',
          primaryCase.expectedEndDate ? `Previsão de Conclusão: ${format(new Date(primaryCase.expectedEndDate), 'dd/MM/yyyy')}` : '',
          primaryCase.custodyType ? `Tipo de Guarda: ${primaryCase.custodyType}` : '',
          primaryCase.alimonyAmount ? `Valor da Pensão: ${formatCurrency(parseFloat(primaryCase.alimonyAmount))}` : ''
        ].filter(Boolean);
        
        caseInfo.forEach((info) => {
          pdf.text(info, margins.left + 5, yPosition);
          yPosition += 8;
        });
        
        if (primaryCase.childrenInvolved && primaryCase.childrenInvolved.length > 0) {
          yPosition += 5;
          pdf.text("Filhos Envolvidos:", margins.left + 5, yPosition);
          yPosition += 8;
          
          primaryCase.childrenInvolved.forEach((childId: string) => {
            const child = children.find(c => c.id === childId);
            if (child) {
              pdf.text(`• ${child.firstName} ${child.lastName || ''}`, margins.left + 10, yPosition);
              yPosition += 6;
            }
          });
        }
        
        if (primaryCase.visitationSchedule) {
          yPosition += 5;
          pdf.text("Cronograma de Visitas:", margins.left + 5, yPosition);
          yPosition += 8;
          
          const scheduleLines = pdf.splitTextToSize(primaryCase.visitationSchedule, contentWidth - 15);
          scheduleLines.forEach((line: string) => {
            pdf.text(line, margins.left + 10, yPosition);
            yPosition += 6;
          });
        }
        
        if (primaryCase.notes) {
          yPosition += 5;
          pdf.setFont("times", "italic");
          pdf.text("Observações do Processo:", margins.left + 5, yPosition);
          yPosition += 8;
          
          const notesLines = pdf.splitTextToSize(primaryCase.notes, contentWidth - 10);
          notesLines.forEach((line: string) => {
            pdf.text(line, margins.left + 10, yPosition);
            yPosition += 6;
          });
          pdf.setFont("times", "normal");
        }
      } else {
        pdf.setFont("times", "italic");
        pdf.text("Nenhum processo judicial cadastrado no sistema.", margins.left + 5, yPosition);
        yPosition += 8;
        pdf.setFont("times", "normal");
      }
      
      yPosition += 15;

      // 3. OBSERVAÇÕES LEGAIS
      pdf.setFont("times", "bold");
      pdf.text("3. OBSERVAÇÕES LEGAIS", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFont("times", "normal");
      
      const legalObservations = [
        "Este relatório de prestação de contas foi elaborado em conformidade com as normas jurídicas brasileiras e destina-se a:",
        "",
        "• Documentar despesas relacionadas aos filhos em processos de divórcio e separação;",
        "• Comprovar o cumprimento das obrigações alimentares estabelecidas judicialmente;",
        "• Fornecer transparência na aplicação de recursos destinados ao bem-estar dos menores;",
        "• Subsidiar decisões judiciais em ações de guarda, visitação e pensão alimentícia.",
        "",
        "A documentação apresentada neste relatório possui valor probatório e pode ser utilizada como meio de prova em procedimentos judiciais, conforme estabelece o Código de Processo Civil brasileiro.",
        "",
        "Todos os comprovantes anexados foram organizados seguindo critérios de autenticidade e relevância para a prestação de contas, observando-se os princípios da transparência e boa-fé processual.",
        "",
        "Este documento foi gerado automaticamente pelo sistema em " + format(new Date(), 'dd/MM/yyyy \'às\' HH:mm', { locale: ptBR }) + " e reflete fielmente os dados cadastrados na plataforma."
      ];
      
      legalObservations.forEach((observation) => {
        if (observation === '') {
          yPosition += 6;
        } else {
          const lines = pdf.splitTextToSize(observation, contentWidth);
          lines.forEach((line: string) => {
            // Verificar se precisa de nova página
            if (yPosition > pageHeight - margins.bottom - 15) {
              pdf.addPage();
              pageNumber++;
              addPageNumber(pageNumber);
              yPosition = margins.top + 20;
            }
            
            pdf.text(line, margins.left, yPosition);
            yPosition += 6;
          });
          yPosition += 3;
        }
      });
      
      // Assinatura digital
      yPosition += 15;
      
      if (yPosition > pageHeight - margins.bottom - 30) {
        pdf.addPage();
        pageNumber++;
        addPageNumber(pageNumber);
        yPosition = margins.top + 20;
      }
      
      pdf.setFont("times", "italic");
      pdf.text("Documento gerado eletronicamente pelo Sistema de Gestão Financeira", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;
      pdf.text("para Filhos de Pais Divorciados", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;
      pdf.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy \'às\' HH:mm \'h\'', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: "center" });

      // Gerar o PDF como blob
      updateProgress(90, "Finalizando documento...");
      const fileName = `relatorio-prestacao-contas-abnt-${format(new Date(), 'yyyy-MM-dd')}`;
      
      updateProgress(95, "Preparando download...");
      await new Promise(resolve => setTimeout(resolve, 500)); // Simular processamento final
      
      // Gerar blob do PDF ao invés de salvar diretamente
      const pdfBlob = pdf.output('blob');
      
      // Configurar estatísticas para o modal
      const stats = {
        totalAmount: report.totalAmount,
        expenseCount: report.expenseCount,
        receiptCount: report.receiptCount,
        period: report.period
      };
      
      updateProgress(100, "Relatório PDF gerado com sucesso!");
      
      // Esperar um pouco para mostrar 100% e então finalizar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Esconder progresso imediatamente
      hideProgress(true);
      
      // Configurar estados e abrir modal
      setPdfBlob(pdfBlob);
      setReportStats(stats);
      setShowPdfModal(true);
      
    } catch (error) {
      hideProgress(true);
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Verifique o console para mais detalhes.");
    } finally {
      // Garantir que o progresso seja escondido em qualquer situação
      hideProgress(true);
      // Cleanup all timeouts to prevent memory leaks
      timeoutIds.forEach(id => clearTimeout(id));
      timeoutIds.length = 0; // Limpar o array
    }
  };

  const handleExportCSV = () => {
    const report = generateReport();
    const csvContent = [
      ["Data", "Descrição", "Filho", "Categoria", "Valor", "Status", "Comprovantes"].join(";"),
      ...report.filteredExpenses.map((exp: any) => [
        formatDate(new Date(exp.expenseDate)),
        exp.description,
        exp.child.firstName,
        exp.category,
        parseFloat(exp.amount).toFixed(2).replace('.', ','),
        exp.status,
        exp.receipts?.length || 0
      ].join(";"))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio-despesas-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const report = generateReport();

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Page Header */}
      <div className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="title-reports">Relatórios</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Gere relatórios profissionais das despesas</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-2">
            <Button variant="outline" size="sm" className="sm:size-default" onClick={handleExportCSV} data-testid="button-export-csv">
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
            <Button size="sm" className="sm:size-default" onClick={handleGeneratePDF} data-testid="button-generate-pdf">
              <FileText className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Gerar PDF</span>
            </Button>
          </div>
        </div>
      </div>

      <main className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="mr-2 w-5 h-5" />
                  Configuração do Relatório
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Report Type */}
                <div className="space-y-2">
                  <Label>Tipo de Relatório</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger data-testid="select-report-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {reportTypes.find(t => t.value === reportType)?.description}
                  </p>
                </div>

                <Separator />

                {/* Date Range */}
                <div className="space-y-3">
                  <Label>Período</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger data-testid="select-date-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dateRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {dateRange === "custom" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Data inicial</Label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          data-testid="input-start-date"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Data final</Label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          data-testid="input-end-date"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Categories Filter */}
                <div className="space-y-3">
                  <Label>Categorias</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {categories.map((category) => (
                      <div key={category.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.value}`}
                          checked={selectedCategories.includes(category.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, category.value]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== category.value));
                            }
                          }}
                          data-testid={`checkbox-category-${category.value}`}
                        />
                        <Label htmlFor={`category-${category.value}`} className="text-sm">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Children Filter */}
                <div className="space-y-3">
                  <Label>Filhos</Label>
                  <div className="space-y-2">
                    {children?.map((child: any) => (
                      <div key={child.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`child-${child.id}`}
                          checked={selectedChildren.includes(child.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedChildren([...selectedChildren, child.id]);
                            } else {
                              setSelectedChildren(selectedChildren.filter(c => c !== child.id));
                            }
                          }}
                          data-testid={`checkbox-child-${child.id}`}
                        />
                        <Label htmlFor={`child-${child.id}`} className="text-sm">
                          {child.firstName} {child.lastName || ""}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Status Filter */}
                <div className="space-y-3">
                  <Label>Status</Label>
                  <div className="space-y-2">
                    {statusOptions.map((status) => (
                      <div key={status.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status.value}`}
                          checked={selectedStatus.includes(status.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStatus([...selectedStatus, status.value]);
                            } else {
                              setSelectedStatus(selectedStatus.filter(s => s !== status.value));
                            }
                          }}
                          data-testid={`checkbox-status-${status.value}`}
                        />
                        <Label htmlFor={`status-${status.value}`} className="text-sm">
                          {status.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Report Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 w-5 h-5" />
                  Preview do Relatório
                </CardTitle>
                <CardDescription>
                  Período: {formatDate(report.period.start)} até {formatDate(report.period.end)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary" data-testid="text-report-total-amount">
                      {formatCurrency(report.totalAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Gasto</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground" data-testid="text-report-expense-count">
                      {report.expenseCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Despesas</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-foreground" data-testid="text-report-receipt-count">
                      {report.receiptCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Comprovantes</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {((report.receiptCount / Math.max(report.expenseCount, 1)) * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Documentado</div>
                  </div>
                </div>

                {/* Category Breakdown */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <PieChart className="mr-2 w-4 h-4" />
                    Por Categoria
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(report.categoryTotals).map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between p-2 bg-muted/80 rounded">
                        <span className="capitalize font-medium">{category}</span>
                        <span className="font-semibold" data-testid={`text-category-total-${category}`}>
                          {formatCurrency(amount as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Child Breakdown */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <TrendingUp className="mr-2 w-4 h-4" />
                    Por Filho
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(report.childTotals).map(([child, amount]) => (
                      <div key={child} className="flex items-center justify-between p-2 bg-muted/80 rounded">
                        <span className="font-medium">{child}</span>
                        <span className="font-semibold" data-testid={`text-child-total-${child}`}>
                          {formatCurrency(amount as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Breakdown */}
                <div>
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <Calendar className="mr-2 w-4 h-4" />
                    Por Status
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(report.statusTotals).map(([status, amount]) => (
                      <div key={status} className="flex items-center justify-between p-2 bg-muted/80 rounded">
                        <span className="capitalize font-medium">{status}</span>
                        <span className="font-semibold" data-testid={`text-status-total-${status}`}>
                          {formatCurrency(amount as number)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modal de Download do PDF */}
      <PdfDownloadModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        pdfBlob={pdfBlob}
        reportStats={reportStats || {
          totalAmount: 0,
          expenseCount: 0,
          receiptCount: 0,
          period: { start: new Date(), end: new Date() }
        }}
        defaultFileName={`relatorio-prestacao-contas-abnt-${format(new Date(), 'yyyy-MM-dd')}`}
      />
    </div>
  );
}
