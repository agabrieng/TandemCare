import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { apiRequest } from '@client/lib/api'; 
// TODO: Substituir o useToast simulado por uma adaptação React Native
import { useToast } from '@client/hooks/use-toast'; 

// Use o logo da empresa (Tandem app icon) como placeholder visual
const logoImage = require('../assets/icon.png'); 

export default function AuthScreen() {
  const [email, setEmail] = useState('user@tandemcare.com'); 
  const [password, setPassword] = useState('password'); 
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast(); // Usando o hook do web por enquanto

  const handleAuth = async () => {
    setError(null);
    setLoading(true);
    
    // ATENÇÃO: As chamadas de API DEVEM ser adaptadas para usar a URL absoluta do Replit.
    // Isso será corrigido na Fase 2. Por enquanto, a navegação é simulada.
    
    try {
        // Simulação de login/registro
        // A lógica real de API será adicionada na próxima fase.
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        
        // Simula sucesso de login e redireciona para a aba principal
        router.replace('/(tabs)/dashboard'); 
    } catch (err: any) {
        setError(err.message || 'Erro de autenticação.');
        toast({ title: "Erro", description: err.message || "Erro de autenticação.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={logoImage} style={styles.logo} />
        <Text style={styles.title}>TandemCare</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, isLogin && styles.tabButtonActive]}
          onPress={() => setIsLogin(true)}
          disabled={loading}
        >
          <Text style={styles.tabText}>Entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, !isLogin && styles.tabButtonActive]}
          onPress={() => setIsLogin(false)}
          disabled={loading}
        >
          <Text style={styles.tabText}>Cadastrar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
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

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttonContainer}>
          <Button
            title={isLogin ? "Entrar" : "Criar Conta"}
            onPress={handleAuth}
            disabled={loading}
            color="#1d4ed8" // Cor primária TandemCare (Azul)
          />
        </View>
        
        {loading && <ActivityIndicator size="small" color="#1d4ed8" style={styles.loading} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
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