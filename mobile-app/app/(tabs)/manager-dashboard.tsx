import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@client/contexts/auth-context';

export default function ManagerDashboardScreen() {
  const { logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard do Gerente</Text>
      <Text style={styles.note}>
        Esta tela deve ser implementada com a visão geral e aprovações do gerente.
      </Text>
      <Button 
        title="Logout" 
        onPress={handleLogout} 
        color="#dc2626"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  note: {
    fontSize: 14,
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1,
    borderRadius: 8,
    color: '#0369a1',
    textAlign: 'center',
    marginBottom: 20,
  }
});