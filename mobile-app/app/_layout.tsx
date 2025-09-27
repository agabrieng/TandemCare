import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
// Reutiliza a configuração do query client do frontend web
import { queryClient } from '@client/lib/queryClient'; 
import { View, Text, StyleSheet } from 'react-native';

// Placeholder para o AuthProvider, que será adaptado na Fase 2
const AuthPlaceholder = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.authContainer}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthPlaceholder> 
          <Stack>
            {/* index.tsx será a tela de Autenticação */}
            <Stack.Screen name="index" options={{ title: 'Login', headerShown: false }} /> 
            {/* (tabs) é a navegação principal (Dashboard) */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> 
          </Stack>
        </AuthPlaceholder>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}