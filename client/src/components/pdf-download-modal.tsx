import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, Check, Calendar, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PdfDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBlob: Blob | null;
  reportStats: {
    totalAmount: number;
    expenseCount: number;
    receiptCount: number;
    period: { start: Date; end: Date };
  };
  defaultFileName: string;
}

export function PdfDownloadModal({ 
  isOpen, 
  onClose, 
  pdfBlob, 
  reportStats, 
  defaultFileName 
}: PdfDownloadModalProps) {
  const [fileName, setFileName] = useState(defaultFileName);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleDownload = () => {
    if (!pdfBlob) return;

    setIsDownloading(true);

    try {
      // Criar URL do blob
      const url = URL.createObjectURL(pdfBlob);
      
      // Criar elemento de link temporário
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      link.style.display = "none";
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL do blob
      URL.revokeObjectURL(url);
      
      // Marcar como baixado
      setIsDownloaded(true);
      
      // Resetar estado após um tempo
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Erro ao fazer download:", error);
      setIsDownloading(false);
    }
  };

  const handleClose = () => {
    setIsDownloaded(false);
    setIsDownloading(false);
    onClose();
  };

  const fileSizeInMB = pdfBlob ? (pdfBlob.size / (1024 * 1024)).toFixed(2) : "0";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md sm:max-w-lg p-0 overflow-hidden" data-testid="modal-pdf-download">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-center space-x-3">
            <FileText className="h-8 w-8" />
            <h3 className="text-xl font-bold">Relatório PDF Gerado</h3>
          </div>
        </div>

        {/* Corpo da modal */}
        <div className="p-6 space-y-6">
          {/* Mensagem de sucesso */}
          <div className="text-center">
            <p className="text-base font-medium text-foreground">
              Seu relatório foi gerado com sucesso no padrão ABNT. Revise as informações e faça o download.
            </p>
          </div>

          {/* Informações do Relatório */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Período
                </span>
                <span className="font-medium" data-testid="text-period">
                  {formatDate(reportStats.period.start)} até {formatDate(reportStats.period.end)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary" data-testid="text-modal-total-amount">
                    {formatCurrency(reportStats.totalAmount)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Gasto</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold" data-testid="text-modal-expense-count">
                    {reportStats.expenseCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Despesas</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Documentação</span>
                <span className="font-medium text-green-600 dark:text-green-400" data-testid="text-modal-documentation-rate">
                  {((reportStats.receiptCount / Math.max(reportStats.expenseCount, 1)) * 100).toFixed(0)}% 
                  ({reportStats.receiptCount} comprovantes)
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tamanho do arquivo</span>
                <span className="font-medium" data-testid="text-file-size">{fileSizeInMB} MB</span>
              </div>
            </div>
          </div>

          {/* Nome do Arquivo */}
          <div className="space-y-2">
            <Label htmlFor="fileName" className="text-sm font-medium">
              Nome do arquivo
            </Label>
            <Input
              id="fileName"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Digite o nome do arquivo"
              data-testid="input-file-name"
            />
            <p className="text-xs text-muted-foreground">
              O arquivo será salvo como PDF automaticamente
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <Button variant="outline" onClick={handleClose} data-testid="button-close-modal" className="w-full sm:w-auto">
              Fechar
            </Button>
            <Button 
              onClick={handleDownload}
              disabled={isDownloading || !pdfBlob}
              data-testid="button-download-pdf"
              className="min-w-[120px] w-full sm:w-auto"
            >
              {isDownloading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Baixando...
                </div>
              ) : isDownloaded ? (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Baixado!
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Baixar PDF
                </div>
              )}
            </Button>
          </div>

          {/* Rodapé com status do sistema */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground font-medium">Sistema ativo</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}