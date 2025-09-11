import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { BarChart3, Download, FileText, Filter, Calendar, TrendingUp, PieChart } from "lucide-react";
import { format, subDays, subMonths, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

interface DashboardStats {
  totalSpent: number;
  pendingAmount: number;
  childrenCount: number;
  receiptsCount: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  recentExpenses: any[];
}

interface Lawyer {
  id: string;
  fullName: string;
  oabNumber?: string;
  oabState?: string;
  lawFirm?: string;
  phone?: string;
  email?: string;
  address?: string;
  specializations: string[];
  notes?: string;
}

interface LegalCase {
  id: string;
  lawyerId?: string;
  caseType: string;
  caseNumber?: string;
  courtName?: string;
  judgeName?: string;
  startDate?: string;
  expectedEndDate?: string;
  status: string;
  childrenInvolved: string[];
  custodyType?: string;
  alimonyAmount?: string;
  visitationSchedule?: string;
  importantDates?: any;
  documents: string[];
  notes?: string;
  lawyer?: Lawyer;
}

// Função auxiliar para carregar imagem do object storage via API
const loadImageFromStorage = async (filePath: string): Promise<string | null> => {
  try {
    const response = await fetch(`/api/object-storage/image?path=${encodeURIComponent(filePath)}`);
    
    if (!response.ok) {
      console.warn(`Erro ao buscar imagem: ${response.status} - ${response.statusText}`);
      return null;
    }
    
    const blob = await response.blob();
    
    // Converter blob para base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Erro ao carregar imagem ${filePath}:`, error);
    return null;
  }
};

export default function Reports() {
  const [reportType, setReportType] = useState("detailed");
  const [dateRange, setDateRange] = useState("last30");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
    retry: false,
  });

  const { data: children = [] } = useQuery<Child[]>({
    queryKey: ["/api/children"],
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
      const childMatch = selectedChildren.length === 0 || selectedChildren.includes(expense.childId);
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
    try {
      const report = generateReport();
      const pdf = new jsPDF('p', 'mm', 'A4'); // Formato A4 - norma ABNT
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Margens ABNT: Superior 3cm, Inferior 2cm, Esquerda 3cm, Direita 2cm
      const margins = { top: 30, bottom: 20, left: 30, right: 20 };
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
      pdf.setFont("times", "bold");
      pdf.setFontSize(14);
      
      // Nome da Instituição/Sistema (centralizado)
      yPosition = 50;
      pdf.text("SISTEMA DE GESTÃO FINANCEIRA", pageWidth / 2, yPosition, { align: "center" });
      pdf.text("PARA FILHOS DE PAIS DIVORCIADOS", pageWidth / 2, yPosition + 7, { align: "center" });
      
      // Título principal (centralizado, maiúsculo, negrito)
      yPosition = 120;
      pdf.setFontSize(16);
      pdf.text("RELATÓRIO DE PRESTAÇÃO DE CONTAS", pageWidth / 2, yPosition, { align: "center" });
      pdf.text("DE DESPESAS INFANTIS", pageWidth / 2, yPosition + 10, { align: "center" });
      
      // Período de análise
      yPosition = 160;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      pdf.text(`Período analisado: ${formatDate(report.period.start)} a ${formatDate(report.period.end)}`, pageWidth / 2, yPosition, { align: "center" });
      
      // Informações do rodapé da capa
      yPosition = 250;
      pdf.text("Local: Brasil", pageWidth / 2, yPosition, { align: "center" });
      pdf.text(`Data: ${format(new Date(), 'MMMM \'de\' yyyy', { locale: ptBR })}`, pageWidth / 2, yPosition + 10, { align: "center" });

      // ===== SUMÁRIO (ABNT) =====
      pdf.addPage();
      pageNumber = 2;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("SUMÁRIO", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const summaryItems = [
        { text: "1 RESUMO EXECUTIVO", page: "3" },
        { text: "2 ANÁLISE FINANCEIRA", page: "4" },
        { text: "2.1 Distribuição por categoria", page: "4" },
        { text: "2.2 Distribuição por status", page: "4" },
        { text: "2.3 Análise de conformidade documental", page: "4" },
        { text: "3 DETALHAMENTO DAS DESPESAS", page: "5" },
        { text: "4 EXTRATO DE DESPESAS COM COMPROVANTES", page: "6" },
        { text: "5 CONCLUSÕES E RECOMENDAÇÕES", page: "7" },
        { text: "REFERÊNCIAS", page: "8" }
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

      // ===== 1. RESUMO EXECUTIVO =====
      pdf.addPage();
      pageNumber = 3;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("1 RESUMO EXECUTIVO", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const documentationRate = ((report.receiptCount / Math.max(report.expenseCount, 1)) * 100).toFixed(1);
      
      const executiveSummary = [
        `Este relatório apresenta a prestação de contas das despesas relacionadas aos filhos no período de ${formatDate(report.period.start)} a ${formatDate(report.period.end)}, conforme estabelecido pela legislação brasileira sobre direitos e deveres dos pais divorciados.`,
        ``,
        `No período analisado, foram registradas ${report.expenseCount} despesas, totalizando o valor de ${formatCurrency(report.totalAmount)}. Dessas despesas, ${report.receiptCount} possuem comprovantes anexados, representando uma taxa de documentação de ${documentationRate}%.`,
        ``,
        `O presente documento foi elaborado seguindo as normas da Associação Brasileira de Normas Técnicas (ABNT) para garantir a transparência e adequação legal da prestação de contas.`
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

      // Tabela resumo
      yPosition += 10;
      pdf.setFont("times", "bold");
      pdf.text("1.1 Dados consolidados", margins.left, yPosition);
      
      yPosition += 10;
      pdf.setFont("times", "normal");
      const summaryData = [
        [`Indicador`, `Valor`],
        [`Total de despesas registradas`, `${report.expenseCount}`],
        [`Valor total investido`, `${formatCurrency(report.totalAmount)}`],
        [`Comprovantes anexados`, `${report.receiptCount}`],
        [`Taxa de documentação`, `${documentationRate}%`],
        [`Número de beneficiários`, `${Object.keys(report.childTotals).length}`]
      ];
      
      // Desenhar tabela
      const tableStartY = yPosition;
      const colWidths = [100, 60];
      let currentY = tableStartY;
      
      summaryData.forEach((row, index) => {
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

      // ===== 2. ANÁLISE FINANCEIRA =====
      pdf.addPage();
      pageNumber = 4;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("2 ANÁLISE FINANCEIRA", margins.left, yPosition);
      
      yPosition += 15;
      
      // 2.1 Distribuição por categoria
      pdf.setFontSize(12);
      pdf.setFont("times", "bold");
      pdf.text("2.1 Distribuição por categoria", margins.left, yPosition);
      
      yPosition += 10;
      pdf.setFont("times", "normal");
      
      Object.entries(report.categoryTotals).forEach(([category, amount]) => {
        const percentage = ((amount as number / report.totalAmount) * 100).toFixed(1);
        const categoryText = `${category.charAt(0).toUpperCase() + category.slice(1)}: ${formatCurrency(amount as number)} (${percentage}% do total)`;
        pdf.text(`• ${categoryText}`, margins.left + 5, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
      
      // 2.2 Distribuição por status
      pdf.setFont("times", "bold");
      pdf.text("2.2 Distribuição por status", margins.left, yPosition);
      
      yPosition += 10;
      pdf.setFont("times", "normal");
      
      Object.entries(report.statusTotals).forEach(([status, amount]) => {
        const percentage = ((amount as number / report.totalAmount) * 100).toFixed(1);
        const statusText = `${status.charAt(0).toUpperCase() + status.slice(1)}: ${formatCurrency(amount as number)} (${percentage}% do total)`;
        pdf.text(`• ${statusText}`, margins.left + 5, yPosition);
        yPosition += 6;
      });
      
      yPosition += 15;
      
      // 2.3 Análise de conformidade documental
      pdf.setFont("times", "bold");
      pdf.text("2.3 Análise de conformidade documental", margins.left, yPosition);
      
      yPosition += 10;
      pdf.setFont("times", "normal");
      
      const complianceScore = parseFloat(documentationRate);
      let complianceText = "";
      
      if (complianceScore >= 90) {
        complianceText = "EXCELENTE - A documentação apresenta-se de forma completa e organizada, atendendo plenamente aos requisitos de transparência.";
      } else if (complianceScore >= 70) {
        complianceText = "ADEQUADA - A documentação atende aos requisitos mínimos, porém recomenda-se a melhoria na organização dos comprovantes.";
      } else {
        complianceText = "INSUFICIENTE - A documentação apresenta deficiências que comprometem a transparência da prestação de contas.";
      }
      
      const complianceLines = pdf.splitTextToSize(complianceText, contentWidth);
      complianceLines.forEach((line: string) => {
        pdf.text(line, margins.left, yPosition);
        yPosition += 6;
      });

      // ===== 3. DETALHAMENTO DAS DESPESAS =====
      pdf.addPage();
      pageNumber = 5;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("3 DETALHAMENTO DAS DESPESAS", margins.left, yPosition);
      
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

      // ===== 4. EXTRATO DE DESPESAS COM COMPROVANTES =====
      pdf.addPage();
      pageNumber++;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("4 EXTRATO DE DESPESAS COM COMPROVANTES", margins.left, yPosition);
      
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

      // Processar cada despesa individualmente
      for (let index = 0; index < sortedExpenses.length; index++) {
        const expense = sortedExpenses[index];
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - margins.bottom - 60) {
          pdf.addPage();
          pageNumber++;
          addPageNumber(pageNumber);
          yPosition = margins.top + 20;
        }

        // Cabeçalho da despesa
        pdf.setFontSize(12);
        pdf.setFont("times", "bold");
        pdf.text(`4.${index + 1} DESPESA #${index + 1}`, margins.left, yPosition);
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
            let imageHeight = 40;
            if (yPosition + imageHeight > pageHeight - margins.bottom - 10) {
              pdf.addPage();
              pageNumber++;
              addPageNumber(pageNumber);
              yPosition = margins.top + 20;
            }
            
            // Tentar carregar a imagem real
            if (receipt.filePath) {
              try {
                const imageData = await loadImageFromStorage(receipt.filePath);
                
                if (imageData) {
                  // Criar uma imagem temporária para obter as dimensões originais
                  const tempImg = new Image();
                  tempImg.src = imageData;
                  
                  await new Promise((resolve) => {
                    tempImg.onload = resolve;
                    tempImg.onerror = resolve;
                  });
                  
                  // Calcular dimensões proporcionais
                  const originalWidth = tempImg.width || 800;
                  const originalHeight = tempImg.height || 600;
                  const aspectRatio = originalWidth / originalHeight;
                  
                  // Definir largura máxima e calcular altura proporcionalmente
                  const maxWidth = contentWidth - 20;
                  const maxHeight = 80; // Altura máxima para não ocupar muito espaço
                  
                  let finalWidth = maxWidth;
                  let finalHeight = maxWidth / aspectRatio;
                  
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
                  
                  pdf.addImage(imageData, 'JPEG', imageX, yPosition, finalWidth, finalHeight);
                  yPosition += finalHeight + 10;
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
                  yPosition += imageHeight + 15;
                }
              } catch (error) {
                console.error("Erro ao processar imagem:", error);
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
                yPosition += imageHeight + 15;
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
        
        // Separador entre despesas
        if (index < sortedExpenses.length - 1) {
          yPosition += 5;
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margins.left, yPosition, margins.left + contentWidth, yPosition);
          pdf.setDrawColor(0, 0, 0);
          yPosition += 15;
        }
      }

      // ===== 5. CONCLUSÕES E RECOMENDAÇÕES =====
      pdf.addPage();
      pageNumber++;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("5 CONCLUSÕES E RECOMENDAÇÕES", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const conclusions = [
        `5.1 CONCLUSÕES`,
        ``,
        `Com base na análise dos dados apresentados, conclui-se que no período de ${formatDate(report.period.start)} a ${formatDate(report.period.end)}, foram investidos ${formatCurrency(report.totalAmount)} em despesas relacionadas aos ${Object.keys(report.childTotals).length} beneficiário(s), demonstrando o cumprimento das obrigações parentais.`,
        ``,
        `A taxa de documentação de ${documentationRate}% ${complianceScore >= 70 ? 'atende aos padrões de transparência exigidos' : 'necessita de melhorias para adequação aos padrões de transparência'}.`,
        ``,
        `5.2 RECOMENDAÇÕES`,
        ``
      ];
      
      conclusions.forEach((item) => {
        if (item === '') {
          yPosition += 6;
        } else if (item.startsWith('5.')) {
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
        "• Manter a organização cronológica e categórica das despesas;",
        "• Assegurar a guarda de todos os comprovantes de pagamento;",
        "• Atualizar regularmente o status das despesas no sistema;",
        "• Realizar prestação de contas periódica para transparência."
      ];
      
      if (complianceScore < 90) {
        recommendations.unshift("• Aprimorar a documentação anexando comprovantes faltantes;");
      }
      
      recommendations.forEach((rec) => {
        pdf.text(rec, margins.left, yPosition);
        yPosition += 8;
      });

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

      // ===== CONTRACAPA =====
      pdf.addPage();
      pageNumber++;
      addPageNumber(pageNumber);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("CONTRACAPA", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 20;
      pdf.setFontSize(12);
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
          `Status: ${primaryCase.status.charAt(0).toUpperCase() + primaryCase.status.slice(1)}`,
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

      // Salvar o PDF
      const fileName = `relatorio-prestacao-contas-abnt-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      alert("PDF no padrão ABNT gerado com sucesso! O relatório foi baixado.");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF. Verifique o console para mais detalhes.");
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
    </div>
  );
}
