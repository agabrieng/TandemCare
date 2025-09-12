import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, FileText } from "lucide-react";

interface ProgressIndicatorProps {
  progress: number;
  message?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressIndicator({ 
  progress, 
  message = "Carregando...", 
  showPercentage = true,
  className = ""
}: ProgressIndicatorProps) {
  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`} data-testid="progress-indicator">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" data-testid="loading-spinner" />
        <span className="text-sm font-medium text-foreground" data-testid="progress-message">
          {message}
        </span>
      </div>
      
      <div className="w-full max-w-md space-y-2">
        <Progress value={progress} className="h-2" data-testid="progress-bar" />
        {showPercentage && (
          <div className="text-center">
            <span className="text-sm text-muted-foreground" data-testid="progress-percentage">
              {Math.round(progress)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface FullScreenProgressProps {
  progress: number;
  message?: string;
  title?: string;
}

export function FullScreenProgress({ 
  progress, 
  message = "Carregando...",
  title = "Aguarde"
}: FullScreenProgressProps) {
  const isComplete = progress >= 100;
  const isGeneratingPDF = title.toLowerCase().includes('pdf') || message.toLowerCase().includes('pdf');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4" data-testid="fullscreen-progress">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-center space-x-3">
            {isComplete ? (
              <CheckCircle className="h-8 w-8 animate-pulse" />
            ) : isGeneratingPDF ? (
              <FileText className="h-8 w-8 animate-bounce" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin" />
            )}
            <h3 className="text-xl font-bold" data-testid="progress-title">
              {title}
            </h3>
          </div>
        </div>

        {/* Corpo da modal */}
        <div className="p-8 space-y-6">
          {/* Mensagem principal */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-800 dark:text-gray-200" data-testid="progress-message">
              {message}
            </p>
          </div>

          {/* Barra de progresso moderna */}
          <div className="space-y-4">
            <div className="relative">
              <Progress 
                value={progress} 
                className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" 
                data-testid="progress-bar"
              />
              {/* Percentual sobre a barra */}
              <div className="flex justify-between mt-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">0%</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400" data-testid="progress-percentage">
                  {Math.round(progress)}%
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">100%</span>
              </div>
            </div>

            {/* Animação de pontos */}
            {!isComplete && (
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            )}
          </div>

          {/* Mensagem de rodapé */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isComplete 
                ? "Processo concluído com sucesso!" 
                : "Por favor, aguarde enquanto processamos sua solicitação..."
              }
            </p>
          </div>
        </div>

        {/* Rodapé com gradiente sutil */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 px-6 py-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Sistema ativo</span>
          </div>
        </div>
      </div>
    </div>
  );
}