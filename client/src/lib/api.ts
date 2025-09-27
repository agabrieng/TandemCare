// Função local para detectar ambiente de produção (evita dependência circular)
const isProductionEnvironment = () => {
  return process.env.NODE_ENV === 'production';
};

// URL base da API TandemCare no Replit
const PRODUCTION_URL = 'https://tandemcare.replit.app';

const API_BASE_URL = isProductionEnvironment() 
  ? PRODUCTION_URL 
  : PRODUCTION_URL; // Usamos a URL de produção/deployment para testes também

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  // Constrói a URL completa para chamadas não-relativas (Mobile) e relativas (Web)
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const isFormData = data instanceof FormData;
  
  // No React Native, não usamos 'credentials: "include"' por causa do AsyncStorage.
  // Em vez disso, enviaremos o token no cabeçalho 'Authorization'. 
  // Isso será tratado pelo AuthContext (próximo passo).

  const headers: HeadersInit = data && !isFormData ? { 
    "Content-Type": "application/json" 
  } : {};
  
  // Tenta obter o token do AsyncStorage (para mobile) ou assume cookie (para web)
  let authToken = null;
  if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && navigator.product === 'ReactNative')) {
    // Ambiente Node.js ou React Native - tenta carregar AsyncStorage
    try {
      // Usa require para evitar que o bundler (Vite) tente resolver o módulo
      const AsyncStorage = eval('require("@react-native-async-storage/async-storage")').default;
      if (AsyncStorage) {
        authToken = await AsyncStorage.getItem('auth_token');
      }
    } catch(e) {
      // Não é um erro crítico se AsyncStorage falhar - provavelmente estamos em ambiente web
      console.log('AsyncStorage not available - running in web environment');
    }
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    // REMOVIDO: credentials: "include", // Substituído por Token/Bearer Header para Mobile
  });

  if (!res.ok) {
    const error = await res.text();
    // Se for 401, o AuthContext irá tratar, mas garantimos que a exceção seja clara
    throw new Error(error || res.statusText);
  }

  return res;
}