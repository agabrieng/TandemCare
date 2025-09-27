// Função utilitária para detectar ambiente de produção
export const isProductionEnvironment = () => {
  return process.env.NODE_ENV === 'production';
};

// URLs para desenvolvimento e produção
const DEVELOPMENT_URL = 'http://172.31.74.130:5000'; // IP local da rede Replit
const PRODUCTION_URL = 'https://tandemcare.replit.app';

export const API_BASE_URL = isProductionEnvironment() 
  ? PRODUCTION_URL 
  : DEVELOPMENT_URL; // Usa IP local para desenvolvimento mobile

// Adicionando um console.log para fins de depuração
console.log('Mobile API Base URL:', API_BASE_URL);