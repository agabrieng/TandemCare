import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isInstallable || isDismissed) {
    return null;
  }

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (!installed) {
      // If user declined, don't show again in this session
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg border-primary z-50" data-testid="card-pwa-install">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Instalar Tandem</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 sm:h-6 sm:w-6"
            onClick={handleDismiss}
            data-testid="button-dismiss-install"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <CardDescription className="text-xs">
          Instale o app Tandem em seu dispositivo para acesso rápido e funcionalidades offline.
        </CardDescription>
        <div className="flex gap-2">
          <Button 
            onClick={handleInstall} 
            className="flex-1 text-base sm:text-xs min-h-11 sm:min-h-8"
            data-testid="button-install-pwa"
          >
            <Download className="h-4 w-4 sm:h-3 sm:w-3 mr-1" />
            Instalar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDismiss}
            className="text-base sm:text-xs min-h-11 sm:min-h-8 px-4"
            data-testid="button-not-now"
          >
            Agora não
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}