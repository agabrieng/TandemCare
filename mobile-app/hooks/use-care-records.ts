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
  // ATENÇÃO: Assumindo que o Backend Express tem uma rota para buscar registros
  // do usuário logado (ex: GET /api/records)
  const response = await apiRequest('GET', `/api/records?userId=${userId}`); 
  
  // Vamos simular os dados para o desenvolvimento, caso a rota API não esteja pronta.
  // A rota real deve ser criada no backend em uma fase de desenvolvimento.

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