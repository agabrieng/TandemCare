import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Card } from '@mobile/components/Card'; 
import { Home, Clipboard, Activity, Plus, Trash2, Heart, Clock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCareRecords } from '@mobile/hooks/use-care-records';
import { useAuth } from '@client/contexts/auth-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mapeamento de cores para tipos de registro
const RECORD_TYPE_COLORS: { [key: string]: { iconBg: string; iconColor: string; label: string } } = {
  medication: { iconBg: '#fef3c7', iconColor: '#d97706', label: 'Medicação' },
  vital: { iconBg: '#d1fae5', iconColor: '#059669', label: 'Vital' },
  appointment: { iconBg: '#e0f2fe', iconColor: '#2563eb', label: 'Compromisso' },
  default: { iconBg: '#f3f4f6', iconColor: '#6b7280', label: 'Registro' },
};

export default function DashboardScreen() {
  const { user } = useAuth();
  
  // Usa o hook customizado para buscar dados do usuário logado
  const { data: records = [], isLoading, error } = useCareRecords(user?.id);

  // Calcula estatísticas básicas (simuladas por enquanto)
  const totalRecords = records.length;
  // Pega o último registro, se houver
  const lastRecordDate = records.length > 0 ? new Date(records[0].createdAt) : null;
  const healthStatus = 'Estável'; // Mock - Implementação complexa viria da API

  // Estatísticas para os cards principais
  const stats = [
    { title: 'Total de Registros', value: totalRecords.toString(), icon: Clipboard, color: '#1d4ed8' },
    { title: 'Status de Saúde', value: healthStatus, icon: Heart, color: '#dc2626' },
    { title: 'Último Check', value: lastRecordDate ? format(lastRecordDate, 'HH:mm', { locale: ptBR }) : '--', icon: Clock, color: '#059669' },
  ];
  
  const handleNewRecord = () => {
    // TODO: Implementar navegação para a tela de criação de novo registro
    Alert.alert('Nova Ação', 'Implementar navegação para a tela de Novo Registro.');
  };

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Olá, {user?.firstName || 'Usuário'}</Text>
        <Text style={styles.subtitle}>Visão geral dos seus registros de cuidado.</Text>

        {/* Grade de Estatísticas */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <View style={styles.statContent}>
                <View>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                </View>
                <View style={[styles.iconWrapper, { backgroundColor: `${stat.color}15` }]}>
                  <stat.icon size={28} color={stat.color} />
                </View>
              </View>
            </Card>
          ))}
        </View>
        
        {/* Ação Rápida */}
        <TouchableOpacity onPress={handleNewRecord} style={styles.newRecordButton}>
          <Plus size={24} color="#fff" />
          <Text style={styles.newRecordButtonText}>Adicionar Novo Registro</Text>
        </TouchableOpacity>

        {/* Últimos Registros */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Registros Recentes</Text>

          {isLoading && <ActivityIndicator size="large" color="#1d4ed8" style={{ padding: 30 }} />}
          
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Erro ao carregar registros: {error.message}</Text>
              <Text style={styles.errorText}>Verifique se o seu Backend está rodando no Replit.</Text>
            </View>
          )}

          {!isLoading && records.length === 0 && (
            <Text style={styles.placeholderText}>Nenhum registro encontrado.</Text>
          )}

          {records.slice(0, 5).map((record, index) => {
            const colors = RECORD_TYPE_COLORS[record.type] || RECORD_TYPE_COLORS.default;
            return (
              <View key={record.id} style={styles.recordItem}>
                <View style={[styles.recordIcon, { backgroundColor: colors.iconBg }]}>
                  {record.type === 'medication' ? <Home size={20} color={colors.iconColor} /> : 
                   record.type === 'vital' ? <Heart size={20} color={colors.iconColor} /> : 
                   <Clock size={20} color={colors.iconColor} />
                  }
                </View>
                <View style={styles.recordDetails}>
                  <Text style={styles.recordTitle}>{record.title}</Text>
                  <Text style={styles.recordSubtitle}>
                    {colors.label} • {format(new Date(record.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </Text>
                  {record.value && <Text style={styles.recordValue}>{record.value}</Text>}
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Ação', `Detalhes do registro: ${record.title}`)}>
                  <Text style={styles.viewDetailsText}>Ver</Text>
                </TouchableOpacity>
              </View>
            );
          })}
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
  contentContainer: {
    paddingBottom: 40,
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
    gap: 10,
  },
  statCard: {
    width: '32%', 
    padding: 15,
  },
  statContent: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statTitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  iconWrapper: {
    width: 35,
    height: 35,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  newRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1d4ed8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
    elevation: 3,
  },
  newRecordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  sectionCard: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#9ca3af',
    paddingVertical: 30,
  },
  errorBox: {
    padding: 15,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: 20,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recordIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  recordDetails: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  recordSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  recordValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginTop: 4,
  },
  viewDetailsText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 14,
  }
});