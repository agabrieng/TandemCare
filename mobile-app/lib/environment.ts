// Função utilitária para detectar ambiente de produção
export const isProductionEnvironment = () => {
  return process.env.NODE_ENV === 'production';
};

// Este deve ser substituído pela URL de produção do seu Replit App quando estiver pronto para o deploy.
// Se estiver no ambiente de desenvolvimento do Replit, ele tentará construir a URL.
export const API_BASE_URL = isProductionEnvironment() 
  ? 'https://[URL_DE_PRODUCAO_AQUI]' 
  : `https://${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.repl.co`;