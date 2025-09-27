// Função utilitária para detectar ambiente de produção
export const isProductionEnvironment = () => {
  return process.env.NODE_ENV === 'production';
};

// URL base da API TandemCare no Replit. Esta URL será usada pelo app Mobile.
const PRODUCTION_URL = 'https://tandemcare.replit.app';

export const API_BASE_URL = isProductionEnvironment() 
  ? PRODUCTION_URL 
  : PRODUCTION_URL; // Usamos a URL de produção/deployment para testes mobile também

// Adicionando um console.log para fins de depuração
console.log('Mobile API Base URL:', API_BASE_URL);