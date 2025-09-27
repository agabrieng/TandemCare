import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/api";
import { User } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

// Importa bibliotecas para React Native/Mobile
let AsyncStorage: any = null;
if (typeof window === 'undefined' || navigator.product === 'ReactNative') {
  // Carrega o AsyncStorage dinamicamente apenas se estivermos em ambiente Node ou React Native
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (e) {
    console.warn("AsyncStorage não disponível. Assumindo ambiente Web (cookies).");
  }
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: { name: string; email: string; password: string; role: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Chaves para AsyncStorage
const TOKEN_KEY = 'auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // O hook useLocation só funciona no ambiente web
  const [, setLocation] = useLocation(); 

  // Função utilitária para armazenar token
  const saveToken = async (token: string) => {
    if (AsyncStorage) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  };

  // Função utilitária para remover token
  const removeToken = async () => {
    if (AsyncStorage) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  };

  // Funções de Autenticação/Status
  const refreshUser = async () => {
    try {
      // Se for ambiente Mobile, tenta carregar o token antes de fazer a requisição 'me'
      if (AsyncStorage) {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
           // Define o token no cabeçalho Auth da requisição 'me' (tratado em lib/api.ts)
           // Na verdade, lib/api.ts já tenta ler AsyncStorage. Se o token existir, ele será usado.
        } else {
          setIsLoading(false);
          return;
        }
      }

      const response = await apiRequest("GET", "/api/auth/me");
      const data = await response.json();
      
      // Se a API retornar um novo token (ou o ID do usuário), podemos salvá-lo aqui
      if (data.token) {
          await saveToken(data.token);
      }
      
      setUser(data.user);
    } catch (error) {
      console.error('Refresh user failed:', error);
      setUser(null);
      await removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleAuthSuccess = async (data: any) => {
    // 1. Salva o token se a API de login o retornar (Para Mobile App)
    if (data.token) {
        await saveToken(data.token);
    }
    
    // 2. Define o usuário no estado
    setUser(data.user);
    
    // 3. Redireciona (Apenas para Web App)
    if (typeof window !== 'undefined' && setLocation) {
        switch (data.user.role) {
            case "admin":
                setLocation("/admin-dashboard");
                break;
            case "manager":
                setLocation("/manager-dashboard");
                break;
            default:
                setLocation("/dashboard");
        }
    } else if (navigator.product === 'ReactNative') {
        // Redirecionamento no Mobile deve ser tratado pelo componente de autenticação (mobile-app/app/index.tsx)
        console.log('Mobile App: Login successful, ready to redirect via Expo Router.');
    }
  };

  const login = async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    const data = await response.json();
    await handleAuthSuccess(data);
  };

  const register = async (userData: { name: string; email: string; password: string; role: string }) => {
    const response = await apiRequest("POST", "/api/auth/register", userData);
    const data = await response.json();
    await handleAuthSuccess(data);
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      // Permite que o logout continue mesmo se a requisição falhar (limpa o estado local)
      console.error("Logout request failed:", error);
    } finally {
      // 1. Remove o token do AsyncStorage (Mobile) ou limpa cookies (Web - implícito pelo backend)
      await removeToken(); 
      
      // 2. Limpa estado e cache
      setUser(null);
      queryClient.clear(); 
      
      // 3. Redireciona (Apenas Web)
      if (typeof window !== 'undefined' && setLocation) {
        setLocation("/");
        window.location.href = "/"; // Recarregar para garantir o estado limpo
      } else if (navigator.product === 'ReactNative') {
         // Mobile App: O componente de autenticação deve lidar com o reset da navegação
         console.log('Mobile App: Logout successful, ready to reset navigation.');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // throw new Error("useAuth must be used within an AuthProvider");
    // Adicionado tratamento para não quebrar no build do React Native
    return { 
        user: null, 
        isLoading: true, 
        login: async () => {}, 
        register: async () => {}, 
        logout: async () => {}, 
        refreshUser: async () => {} 
    } as AuthContextType;
  }
  return context;
}