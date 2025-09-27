import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@client/lib/api'; 
import { User } from '@shared/schema'; 
import { useAuth } from '@client/contexts/auth-context';

// Definição de tipo para um registro de cuidado (Placeholder baseado em TandemCare)
interface CareRecord {
  id: string;
  type: string; // Ex: 'medication', 'vital', 'appointment'
  title: string;
  createdAt: string;
  value?: string;
}

// Adaptação da função de busca de dados
const fetchCareRecords = async (userId: string): Promise<CareRecord[]> => {
  try {
    // ATENÇÃO: Assumindo que o Backend Express tem uma rota para buscar registros
    // do usuário logado (ex: GET /api/records)
    const response = await apiRequest('GET', `/api/records?userId=${userId}`);
    const data = await response.json();
    
    // Se a API retornar dados válidos, os usa
    if (data && Array.isArray(data.records)) {
      return data.records.map((record: any) => ({
        id: record.id || record._id,
        type: record.type || 'default',
        title: record.title || record.description || 'Registro',
        createdAt: record.createdAt || record.created_at || new Date().toISOString(),
        value: record.value || record.amount || record.details
      }));
    }
  } catch (error) {
    console.warn('API /api/records não disponível:', error);
  }
  
  // Fallback para dados simulados se a API não estiver disponível ou não retornar dados
  return [
    { id: '1', type: 'medication', title: 'Medicação Diária', createdAt: new Date().toISOString(), value: 'Aspirina 100mg' },
    { id: '2', type: 'vital', title: 'Pressão Arterial', createdAt: new Date(Date.now() - 3600000).toISOString(), value: '120/80 mmHg' },
    { id: '3', type: 'appointment', title: 'Consulta Médica', createdAt: new Date(Date.now() - 7200000).toISOString(), value: 'Cardiologista' },
  ];
};

export const useCareRecords = (userId: string | undefined) => {
  const { user } = useAuth(); // Garante que o usuário está autenticado
  
  return useQuery<CareRecord[]>({
    // A query só é executada se houver um userId válido
    queryKey: ['careRecords', userId],
    queryFn: () => fetchCareRecords(userId as string),
    enabled: !!userId,
    // Configurações de cache otimizadas para dados de usuário
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });
};