import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/authStore';

// Import only the screens that exist
import LoginScreen from '../screens/auth/LoginScreen';
import LoadingScreen from '../screens/common/LoadingScreen';

const Stack = createStackNavigator();

const SimpleNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#ffffff' },
        }}
      >
        {isAuthenticated ? (
          // When authenticated, show a simple home screen
          <Stack.Screen name="Home" component={LoadingScreen} />
        ) : (
          // When not authenticated, show login
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default SimpleNavigator;
