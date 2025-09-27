import { API_BASE_URL } from '@mobile/lib/environment'; // Importa a URL base

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
  try {
    // Tenta usar AsyncStorage (se disponível, ambiente mobile)
    const AsyncStorage = await import('@react-native-async-storage/async-storage').then(m => m.default).catch(() => null);
    if (AsyncStorage) {
      authToken = await AsyncStorage.getItem('auth_token');
    }
  } catch(e) {
    // Não é um erro crítico se AsyncStorage falhar na web
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