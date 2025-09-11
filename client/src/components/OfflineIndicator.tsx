import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const { isOnline, isOffline } = useOfflineStatus();
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
      setShowOnlineMessage(false);
    } else if (isOnline && wasOffline) {
      // Show "back online" message briefly
      setShowOnlineMessage(true);
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isOffline, wasOffline]);

  // Show offline indicator
  if (isOffline) {
    return (
      <Alert className="fixed top-4 right-4 w-80 shadow-lg border-destructive z-50 bg-destructive/5" data-testid="alert-offline">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Você está offline</strong>
          <br />
          <span className="text-xs text-muted-foreground">
            Algumas funcionalidades podem estar limitadas.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  // Show "back online" message briefly
  if (showOnlineMessage) {
    return (
      <Alert className="fixed top-4 right-4 w-80 shadow-lg border-green-500 z-50 bg-green-50 dark:bg-green-900/20" data-testid="alert-online">
        <Wifi className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm">
          <strong className="text-green-700 dark:text-green-400">Conexão restaurada</strong>
          <br />
          <span className="text-xs text-green-600 dark:text-green-500">
            Todas as funcionalidades estão disponíveis.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}