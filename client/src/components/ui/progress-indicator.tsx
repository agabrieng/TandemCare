import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

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
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center" data-testid="fullscreen-progress">
      <div className="bg-card border border-border rounded-lg p-8 shadow-lg min-w-[400px]">
        <div className="text-center space-y-6">
          <h3 className="text-lg font-semibold text-foreground" data-testid="progress-title">
            {title}
          </h3>
          
          <ProgressIndicator 
            progress={progress} 
            message={message} 
            showPercentage={true}
          />
          
          <p className="text-xs text-muted-foreground">
            Por favor, aguarde enquanto processamos sua solicitação.
          </p>
        </div>
      </div>
    </div>
  );
}