import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { FullScreenProgress } from '@/components/ui/progress-indicator';

interface ProgressContextType {
  showProgress: (message?: string, title?: string) => void;
  updateProgress: (progress: number, message?: string) => void;
  hideProgress: () => void;
  isVisible: boolean;
  progress: number;
  message: string;
  title: string;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

interface ProgressProviderProps {
  children: ReactNode;
}

export function ProgressProvider({ children }: ProgressProviderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Carregando...');
  const [title, setTitle] = useState('Aguarde');

  const showProgress = useCallback((msg: string = 'Carregando...', titleText: string = 'Aguarde') => {
    setMessage(msg);
    setTitle(titleText);
    setProgress(0);
    setIsVisible(true);
  }, []);

  const updateProgress = useCallback((newProgress: number, newMessage?: string) => {
    setProgress(Math.min(Math.max(newProgress, 0), 100));
    if (newMessage) {
      setMessage(newMessage);
    }
  }, []);

  const hideProgress = useCallback(() => {
    // Primeiro completar a barra de progresso
    setProgress(100);
    
    // Depois esconder após um breve delay
    setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
      setMessage('Carregando...');
      setTitle('Aguarde');
    }, 300);
  }, []);

  const value = {
    showProgress,
    updateProgress,
    hideProgress,
    isVisible,
    progress,
    message,
    title,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
      {isVisible && (
        <FullScreenProgress
          progress={progress}
          message={message}
          title={title}
        />
      )}
    </ProgressContext.Provider>
  );
}

export function useGlobalProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useGlobalProgress deve ser usado dentro de um ProgressProvider');
  }
  return context;
}