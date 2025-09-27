import React from 'react';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import { Card } from '@mobile/components/Card'; 
import { Home, Clipboard, Activity } from 'lucide-react-native';

// Esta tela substitui client/src/pages/dashboard.tsx 

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Dashboard TandemCare</Text>
        <Text style={styles.subtitle}>Visão geral dos seus registros de cuidado.</Text>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <View>
                <Text style={styles.statTitle}>Total de Registros</Text>
                <Text style={styles.statValue}>12</Text>
              </View>
              <View style={[styles.iconWrapper, { backgroundColor: '#bfdbfe' }]}>
                <Clipboard size={28} color="#1d4ed8" />
              </View>
            </View>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <View>
                <Text style={styles.statTitle}>Última Atualização</Text>
                <Text style={styles.statValue}>Hoje</Text>
              </View>
              <View style={[styles.iconWrapper, { backgroundColor: '#d1fae5' }]}>
                <Activity size={28} color="#059669" />
              </View>
            </View>
          </Card>
        </View>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          <Button title="Novo Registro" color="#1d4ed8" onPress={() => { /* Navegar para nova tela */ }} />
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Monitoramento</Text>
          <Text style={styles.placeholderText}>Gráficos de atividade virão aqui.</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  statCard: {
    width: '48%', 
    padding: 15,
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1f2937',
  },
  placeholderText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 30,
  },
});