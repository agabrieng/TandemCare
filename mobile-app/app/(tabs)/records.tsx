import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function RecordsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Meus Registros</Text>
      <Text style={styles.note}>Esta tela listará seus registros de saúde e cuidado.</Text>
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