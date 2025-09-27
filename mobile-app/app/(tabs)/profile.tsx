import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meu Perfil</Text>
      <Text style={styles.note}>Esta tela exibirá e permitirá editar as informações do usuário.</Text>
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
  }
});