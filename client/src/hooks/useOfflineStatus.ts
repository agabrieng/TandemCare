import { useState, useEffect } from 'react';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connection lost');
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Also listen for network changes through connection API if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const handleConnectionChange = () => {
        // Check if we have a viable connection
        const hasConnection = connection.effectiveType !== 'slow-2g' && 
                            connection.downlink > 0.1;
        setIsOnline(hasConnection && navigator.onLine);
      };

      connection.addEventListener('change', handleConnectionChange);
      
      // Cleanup function for connection listener
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    // Regular cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline
  };
}