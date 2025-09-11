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
  // HARDCODE FIX: Force correct date format
  if (!dateString) return '';
  
  // Log for debugging (remove this after fix)
  // console.log('formatDateForBrazil received:', dateString, typeof dateString);
  
  // Convert to string if needed
  const dateStr = String(dateString);
  
  // Extract just the date part if it's an ISO timestamp
  let cleanDate = dateStr;
  if (dateStr.includes('T')) {
    cleanDate = dateStr.split('T')[0];
  }
  
  // For YYYY-MM-DD format, directly convert to DD/MM/YYYY
  const dateMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    const result = `${day}/${month}/${year}`;
    // console.log('formatDateForBrazil result:', result);
    return result;
  }
  
  // Last resort: try parsing the date
  try {
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); 
      const year = date.getFullYear();
      const result = `${day}/${month}/${year}`;
      // console.log('formatDateForBrazil fallback result:', result);
      return result;
    }
  } catch (error) {
    console.error('Date formatting error:', error);
  }
  
  // console.log('formatDateForBrazil fallback to original:', dateStr);
  return dateStr;
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