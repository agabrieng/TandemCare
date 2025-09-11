// Brazil timezone: America/Sao_Paulo (handles DST automatically)
const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma data string para timezone do Brasil e a formata para exibição
 * @param dateString - Data no formato YYYY-MM-DD, ISO string ou timestamp
 * @returns Data ajustada para timezone do Brasil
 */
export function dateStringToBrazilTimezone(dateString: string): Date {
  try {
    // Se a string está no formato YYYY-MM-DD, assumimos que é uma data pura
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Para datas YYYY-MM-DD, interpretamos como meia-noite no timezone do Brasil
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    
    // Para strings ISO com tempo, parseia normalmente
    return new Date(dateString);
  } catch (error) {
    console.warn('Erro ao converter data:', error);
    return new Date();
  }
}

/**
 * Formata uma data para exibição no Brasil
 * Para datas YYYY-MM-DD: reformata diretamente sem conversão de timezone
 * Para ISO timestamps: formata no timezone brasileiro
 * @param dateString - Data string a ser formatada
 * @returns Data formatada em dd/MM/yyyy
 */
export function formatDateForBrazil(dateString: string): string {
  try {
    // Defensive guard: if string contains ISO timestamp, extract just the date part
    if (dateString.includes('T') && dateString.includes('Z')) {
      dateString = dateString.slice(0, 10);
    }
    
    // Para datas no formato YYYY-MM-DD (apenas data, sem horário)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Para timestamps ISO com horário, usa timezone brasileiro
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: BRAZIL_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch (error) {
    console.warn('Erro ao formatar data:', error);
    return dateString;
  }
}

/**
 * Obtém a data atual no timezone do Brasil no formato YYYY-MM-DD
 * @returns Data atual formatada para input type="date" no timezone brasileiro
 */
export function getTodayInBrazilTimezone(): string {
  try {
    // Usa Intl.DateTimeFormat para obter a data atual no timezone brasileiro
    const now = new Date();
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: BRAZIL_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);
  } catch (error) {
    console.warn('Erro ao obter data atual:', error);
    return new Date().toISOString().split('T')[0]; // Fallback
  }
}

/**
 * Converte data local do Brasil para formato ISO que será salvo no banco
 * @param localDateString - Data no formato YYYY-MM-DD do input
 * @returns Data formatada para armazenamento (YYYY-MM-DD)
 */
export function brazilDateToStorage(localDateString: string): string {
  // O input type="date" já retorna YYYY-MM-DD que é o formato correto para armazenamento
  return localDateString;
}