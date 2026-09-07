import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';

export default function DrawerLayout() {
  return (
    <Drawer
      screenOptions={{
        // Header (top bar) styling
        headerStyle: { backgroundColor: '#0B1220' },
        headerTintColor: '#fff',

        // Drawer (side menu) styling
        drawerStyle: {
          backgroundColor: '#0B1220',
        },
        drawerActiveTintColor: '#F2A93B',
        drawerActiveBackgroundColor: '#16233B',
        drawerInactiveTintColor: '#8FA3BF',

        // Bigger top space so items don't sit right under the status bar
        drawerContentContainerStyle: {
          paddingTop: 60,
        },

        // A bit of breathing room between items too
        drawerItemStyle: {
          marginVertical: 4,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Home',
          title: 'Home',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="explore"
        options={{
          drawerLabel: 'Explore',
          title: 'Explore',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="earth" size={size} color={color} />
          ),
        }}
      />
      
      <Drawer.Screen
        name="emergency"
        options={{
          drawerLabel: 'Emergency',
          title: 'Emergency',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="alert-circle" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="safetytips"
        options={{
          drawerLabel: 'Safety Tips',
          title: 'Safety Tips',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="agents"
        options={{
          drawerLabel: 'Agents',
          title: 'Agents',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="packages"
        options={{
          drawerLabel: 'Packages',
          title: 'Packages',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="briefcase" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="setting"
        options={{
          drawerLabel: 'Settings',
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="aboutsafetourism"
        options={{
          drawerLabel: 'About Safe Tourism',
          title: 'About Safe Tourism',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="information-circle" size={size} color={color} />
          ),
        }}
      />,
    </Drawer>
  );
}