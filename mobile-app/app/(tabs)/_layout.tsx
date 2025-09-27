import { Tabs } from 'expo-router';
import { Home, List, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#1d4ed8', // Azul principal
      headerShown: true, 
      tabBarLabelStyle: { fontSize: 12, fontWeight: '500' }
    }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          headerTitle: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Registros',
          tabBarIcon: ({ color }) => <List size={24} color={color} />,
          headerTitle: 'Meus Registros',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          headerTitle: 'Meu Perfil',
        }}
      />
    </Tabs>
  );
}