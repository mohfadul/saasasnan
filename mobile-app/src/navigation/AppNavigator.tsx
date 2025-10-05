import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuthStore } from '../store/authStore';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main App Screens
import HomeScreen from '../screens/home/HomeScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import BookAppointmentScreen from '../screens/appointments/BookAppointmentScreen';
import AppointmentDetailsScreen from '../screens/appointments/AppointmentDetailsScreen';
import RecordsScreen from '../screens/records/RecordsScreen';
import ClinicalNotesScreen from '../screens/records/ClinicalNotesScreen';
import TreatmentPlansScreen from '../screens/records/TreatmentPlansScreen';
import TreatmentPlanDetailsScreen from '../screens/records/TreatmentPlanDetailsScreen';
import BillingScreen from '../screens/billing/BillingScreen';
import InvoiceDetailsScreen from '../screens/billing/InvoiceDetailsScreen';
import PaymentScreen from '../screens/billing/PaymentScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

import LoadingScreen from '../screens/common/LoadingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#ffffff' },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

const AppointmentsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#2563eb',
      },
      headerTintColor: '#ffffff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="AppointmentsList" 
      component={AppointmentsScreen}
      options={{ title: 'My Appointments' }}
    />
    <Stack.Screen 
      name="BookAppointment" 
      component={BookAppointmentScreen}
      options={{ title: 'Book Appointment' }}
    />
    <Stack.Screen 
      name="AppointmentDetails" 
      component={AppointmentDetailsScreen}
      options={{ title: 'Appointment Details' }}
    />
  </Stack.Navigator>
);

const RecordsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#059669',
      },
      headerTintColor: '#ffffff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="RecordsList" 
      component={RecordsScreen}
      options={{ title: 'My Records' }}
    />
    <Stack.Screen 
      name="ClinicalNotes" 
      component={ClinicalNotesScreen}
      options={{ title: 'Clinical Notes' }}
    />
    <Stack.Screen 
      name="TreatmentPlans" 
      component={TreatmentPlansScreen}
      options={{ title: 'Treatment Plans' }}
    />
    <Stack.Screen 
      name="TreatmentPlanDetails" 
      component={TreatmentPlanDetailsScreen}
      options={{ title: 'Treatment Plan' }}
    />
  </Stack.Navigator>
);

const BillingStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#dc2626',
      },
      headerTintColor: '#ffffff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="BillingList" 
      component={BillingScreen}
      options={{ title: 'Billing & Payments' }}
    />
    <Stack.Screen 
      name="InvoiceDetails" 
      component={InvoiceDetailsScreen}
      options={{ title: 'Invoice Details' }}
    />
    <Stack.Screen 
      name="Payment" 
      component={PaymentScreen}
      options={{ title: 'Make Payment' }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#7c3aed',
      },
      headerTintColor: '#ffffff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ProfileMain" 
      component={ProfileScreen}
      options={{ title: 'My Profile' }}
    />
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
    <Stack.Screen 
      name="Notifications" 
      component={NotificationsScreen}
      options={{ title: 'Notifications' }}
    />
  </Stack.Navigator>
);

const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string;

        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Appointments':
            iconName = 'event';
            break;
          case 'Records':
            iconName = 'folder';
            break;
          case 'Billing':
            iconName = 'payment';
            break;
          case 'Profile':
            iconName = 'person';
            break;
          default:
            iconName = 'help';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#2563eb',
      tabBarInactiveTintColor: '#6b7280',
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopColor: '#e5e7eb',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '500',
      },
      headerShown: false,
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen}
      options={{ title: 'Home' }}
    />
    <Tab.Screen 
      name="Appointments" 
      component={AppointmentsStack}
      options={{ title: 'Appointments' }}
    />
    <Tab.Screen 
      name="Records" 
      component={RecordsStack}
      options={{ title: 'Records' }}
    />
    <Tab.Screen 
      name="Billing" 
      component={BillingStack}
      options={{ title: 'Billing' }}
    />
    <Tab.Screen 
      name="Profile" 
      component={ProfileStack}
      options={{ title: 'Profile' }}
    />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
