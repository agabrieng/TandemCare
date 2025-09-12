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
    <div>
      {/* Estilo customizado para garantir backdrop opaco */}
      <style>
        {`
          [data-state="open"][data-radix-dialog-overlay] {
            background-color: rgba(0, 0, 0, 0.75) !important;
            backdrop-filter: blur(4px) !important;
          }
          [data-radix-collection-item][data-radix-dialog-overlay] {
            background-color: rgba(0, 0, 0, 0.75) !important;
            backdrop-filter: blur(4px) !important;
          }
          .fixed.inset-0.z-50.bg-black\\/80 {
            background-color: rgba(0, 0, 0, 0.75) !important;
            backdrop-filter: blur(4px) !important;
          }
        `}
      </style>
      
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md sm:max-w-lg" data-testid="modal-pdf-download">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            Relatório PDF Gerado com Sucesso!
          </DialogTitle>
          <DialogDescription>
            Seu relatório foi gerado com sucesso no padrão ABNT. Revise as informações e faça o download.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Relatório */}
          <Card>
            <CardContent className="pt-4">
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
                  <span className="font-medium text-green-600" data-testid="text-modal-documentation-rate">
                    {((reportStats.receiptCount / Math.max(reportStats.expenseCount, 1)) * 100).toFixed(0)}% 
                    ({reportStats.receiptCount} comprovantes)
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tamanho do arquivo</span>
                  <span className="font-medium" data-testid="text-file-size">{fileSizeInMB} MB</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} data-testid="button-close-modal">
            Fechar
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={isDownloading || !pdfBlob}
            data-testid="button-download-pdf"
            className="min-w-[120px]"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
  );
}