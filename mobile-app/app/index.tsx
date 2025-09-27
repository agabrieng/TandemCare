import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, ActivityIndicator, Image, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
// Importa o AuthContext adaptado
import { useAuth } from '@client/contexts/auth-context'; 
// Importa o hook de toast (usaremos Alert no mobile, mas mantemos a importação para compatibilidade)
import { useToast } from '@client/hooks/use-toast'; 

// Use o logo da empresa (Tandem app icon) como placeholder visual
const logoImage = require('../assets/icon.png'); 

export default function AuthScreen() {
  const [email, setEmail] = useState('user@tandemcare.com'); 
  const [password, setPassword] = useState('password'); 
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Usando o useAuth adaptado do monorepo
  const { user, login, register } = useAuth();

  // Redireciona se o usuário já estiver logado (pós-refresh ou login/register)
  React.useEffect(() => {
    if (user && user.role) {
      // Baseado nas rotas do TandemCare, assumimos 'user', 'manager' e 'admin'
      const roleRouteMap: { [key: string]: string } = {
        'admin': '/(tabs)/admin-dashboard', 
        'manager': '/(tabs)/manager-dashboard', 
        'user': '/(tabs)/dashboard',
      };
      const path = roleRouteMap[user.role] || '/(tabs)/dashboard';
      router.replace(path);
    }
  }, [user]);
  
  const handleAuth = async () => {
    setError(null);
    setLoading(true);
    
    try {
        if (isLogin) {
            await login(email, password);
            Alert.alert("Sucesso", "Login realizado com sucesso!");
        } else {
            // No registro, forçamos o role 'user' se o campo não for usado
            const userData = { name, email, password, role: 'user' };
            await register(userData); 
            Alert.alert("Sucesso", "Conta criada com sucesso! Redirecionando...");
        }
        
    } catch (err: any) {
        // As mensagens de erro da API são passadas via a exceção (err.message)
        let message = err.message || 'Erro desconhecido de autenticação.';
        
        // Tenta extrair a mensagem de erro da API (se for um JSON de erro)
        if (message.includes('400') || message.includes('401')) {
             try {
                 const jsonError = JSON.parse(message.substring(message.indexOf(':') + 1));
                 message = jsonError.message || message;
             } catch (e) {
                 // Mantém a mensagem original se não for JSON
             }
        }
        
        setError(message);
        Alert.alert("Erro de Autenticação", message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image source={logoImage} style={styles.logo} />
          <Text style={styles.title}>TandemCare</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, isLogin && styles.tabButtonActive]}
            onPress={() => { setIsLogin(true); setError(null); }}
            disabled={loading}
          >
            <Text style={styles.tabText}>Entrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, !isLogin && styles.tabButtonActive]}
            onPress={() => { setIsLogin(false); setError(null); }}
            disabled={loading}
          >
            <Text style={styles.tabText}>Cadastrar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                editable={!loading}
              />
            </View>
          )}
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="seu-email@exemplo.com"
              editable={!loading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              editable={!loading}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={isLogin ? "Entrar" : "Criar Conta"}
              onPress={handleAuth}
              disabled={loading || (isLogin ? false : !name.trim())}
              color="#1d4ed8"
            />
          </View>
          
          {loading && <ActivityIndicator size="small" color="#1d4ed8" style={styles.loading} />}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8f8f8',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1d4ed8',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 1,
  },
  tabText: {
    fontWeight: '600',
    color: '#374151',
  },
  formContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    height: 44,
    borderColor: '#d1d5db',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  loading: {
    marginTop: 20,
  },
  link: {
    marginTop: 20,
    alignSelf: 'center',
  },
});