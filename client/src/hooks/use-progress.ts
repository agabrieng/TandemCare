import { useState, useCallback } from 'react';

export interface ProgressState {
  isLoading: boolean;
  progress: number;
  message: string;
  title?: string;
}

export function useProgress() {
  const [progressState, setProgressState] = useState<ProgressState>({
    isLoading: false,
    progress: 0,
    message: 'Carregando...',
  });

  const startProgress = useCallback((message: string = 'Carregando...', title?: string) => {
    setProgressState({
      isLoading: true,
      progress: 0,
      message,
      title,
    });
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setProgressState(prev => ({
      ...prev,
      progress: Math.min(Math.max(progress, 0), 100),
      message: message || prev.message,
    }));
  }, []);

  const finishProgress = useCallback(() => {
    setProgressState(prev => ({
      ...prev,
      progress: 100,
    }));
    
    setTimeout(() => {
      setProgressState({
        isLoading: false,
        progress: 0,
        message: 'Carregando...',
      });
    }, 500);
  }, []);

  const resetProgress = useCallback(() => {
    setProgressState({
      isLoading: false,
      progress: 0,
      message: 'Carregando...',
    });
  }, []);

  return {
    progressState,
    startProgress,
    updateProgress,
    finishProgress,
    resetProgress,
  };
}

// Hook específico para simulação de progresso em carregamentos
export function useLoadingProgress() {
  const { progressState, startProgress, updateProgress, finishProgress, resetProgress } = useProgress();

  const simulateProgress = useCallback(async (
    duration: number = 2000,
    message: string = 'Carregando dados...',
    title?: string
  ) => {
    startProgress(message, title);
    
    const steps = 20;
    const stepDuration = duration / steps;
    
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      const progress = (i / steps) * 90; // Para a 90% para dar sensação de carregamento real
      updateProgress(progress);
    }
    
    // Finalizar nos últimos 10%
    updateProgress(100);
    finishProgress();
  }, [startProgress, updateProgress, finishProgress]);

  return {
    progressState,
    simulateProgress,
    startProgress,
    updateProgress,
    finishProgress,
    resetProgress,
  };
}

// Hook para progresso de geração de PDF
export function usePDFProgress() {
  const { progressState, startProgress, updateProgress, finishProgress, resetProgress } = useProgress();

  const startPDFGeneration = useCallback((message: string = 'Gerando relatório PDF...') => {
    startProgress(message, 'Preparando Relatório');
  }, [startProgress]);

  const updatePDFProgress = useCallback((step: string, progress: number) => {
    updateProgress(progress, step);
  }, [updateProgress]);

  return {
    progressState,
    startPDFGeneration,
    updatePDFProgress,
    finishProgress,
    resetProgress,
  };
}