import { format, parseISO, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Timezone do Brasil (UTC-3)
const BRAZIL_TIMEZONE_OFFSET = -3;

/**
 * Converte uma data string para timezone do Brasil
 * @param dateString - Data no formato YYYY-MM-DD ou ISO string
 * @returns Data ajustada para timezone do Brasil
 */
export function dateStringToBrazilTimezone(dateString: string): Date {
  try {
    // Se a string está no formato YYYY-MM-DD, assumimos que é local do usuário
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Cria a data como local (assumindo Brasil timezone)
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    // Para strings ISO, parseia e ajusta para timezone do Brasil
    const date = parseISO(dateString);
    return date;
  } catch (error) {
    console.warn('Erro ao converter data:', error);
    return new Date();
  }
}

/**
 * Formata uma data para exibição no Brasil
 * @param dateString - Data string a ser formatada
 * @returns Data formatada em dd/MM/yyyy
 */
export function formatDateForBrazil(dateString: string): string {
  try {
    const date = dateStringToBrazilTimezone(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.warn('Erro ao formatar data:', error);
    return dateString;
  }
}

/**
 * Obtém a data atual no timezone do Brasil no formato YYYY-MM-DD
 * @returns Data atual formatada para input type="date"
 */
export function getTodayInBrazilTimezone(): string {
  const now = new Date();
  // Ajusta para timezone do Brasil (UTC-3)
  const brazilDate = new Date(now.getTime() + (BRAZIL_TIMEZONE_OFFSET * 60 * 60 * 1000));
  return format(brazilDate, 'yyyy-MM-dd');
}

/**
 * Converte data local do Brasil para formato ISO que será salvo no banco
 * @param localDateString - Data no formato YYYY-MM-DD do input
 * @returns Data formatada para armazenamento
 */
export function brazilDateToStorage(localDateString: string): string {
  // Como o input type="date" já retorna YYYY-MM-DD no timezone local,
  // só precisamos garantir que ela seja tratada como date local
  return localDateString;
}

/**
 * Cria filtros de data considerando timezone do Brasil
 * @param startDate - Data de início (YYYY-MM-DD)
 * @param endDate - Data de fim (YYYY-MM-DD)
 */
export function createBrazilDateFilters(startDate?: string, endDate?: string) {
  const filters: { startDate?: Date; endDate?: Date } = {};
  
  if (startDate) {
    // Para início do dia no Brasil
    const [year, month, day] = startDate.split('-').map(Number);
    filters.startDate = new Date(year, month - 1, day, 0, 0, 0);
  }
  
  if (endDate) {
    // Para fim do dia no Brasil
    const [year, month, day] = endDate.split('-').map(Number);
    filters.endDate = new Date(year, month - 1, day, 23, 59, 59);
  }
  
  return filters;
}