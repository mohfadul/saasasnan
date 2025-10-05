import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuthStore } from '../../store/authStore';
import apiService from '../../services/api';
import QuickActionCard from '../../components/common/QuickActionCard';
import AppointmentCard from '../../components/appointments/AppointmentCard';
import NotificationCard from '../../components/notifications/NotificationCard';
import StatsCard from '../../components/common/StatsCard';

const HomeScreen: React.FC = () => {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user's upcoming appointments
  const { data: upcomingAppointments, refetch: refetchAppointments } = useQuery({
    queryKey: ['upcoming-appointments'],
    queryFn: () => apiService.getAppointments({ 
      status: 'scheduled,confirmed',
      limit: 3,
      sort: 'start_time:asc'
    }),
  });

  // Fetch recent notifications
  const { data: notifications, refetch: refetchNotifications } = useQuery({
    queryKey: ['recent-notifications'],
    queryFn: () => apiService.getNotifications({ 
      limit: 3,
      sort: 'created_at:desc'
    }),
  });

  // Fetch health summary
  const { data: healthSummary, refetch: refetchHealthSummary } = useQuery({
    queryKey: ['health-summary'],
    queryFn: () => apiService.getHealthSummary(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchAppointments(),
        refetchNotifications(),
        refetchHealthSummary(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const quickActions = [
    {
      title: 'Book Appointment',
      icon: 'event',
      color: '#2563eb',
      onPress: () => navigation.navigate('Appointments', { screen: 'BookAppointment' }),
    },
    {
      title: 'View Records',
      icon: 'folder',
      color: '#059669',
      onPress: () => navigation.navigate('Records'),
    },
    {
      title: 'Pay Bills',
      icon: 'payment',
      color: '#dc2626',
      onPress: () => navigation.navigate('Billing'),
    },
    {
      title: 'Emergency',
      icon: 'emergency',
      color: '#dc2626',
      onPress: () => {
        // Handle emergency contact
        console.log('Emergency contact');
      },
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.profile?.first_name || 'Patient'}
          </Text>
          <Text style={styles.subtitle}>
            Welcome to your health dashboard
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}
        >
          <Icon name="notifications" size={24} color="#6b7280" />
          {notifications?.filter(n => !n.is_read).length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>
                {notifications.filter(n => !n.is_read).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Health Stats */}
      {healthSummary && (
        <View style={styles.statsContainer}>
          <StatsCard
            title="Next Appointment"
            value={healthSummary.next_appointment ? 
              new Date(healthSummary.next_appointment.start_time).toLocaleDateString() : 
              'None scheduled'
            }
            icon="event"
            color="#2563eb"
          />
          <StatsCard
            title="Outstanding Balance"
            value={`$${healthSummary.outstanding_balance || 0}`}
            icon="payment"
            color="#dc2626"
          />
          <StatsCard
            title="Active Treatment Plans"
            value={healthSummary.active_treatment_plans || 0}
            icon="assignment"
            color="#059669"
          />
          <StatsCard
            title="Health Score"
            value={`${healthSummary.health_score || 85}%`}
            icon="favorite"
            color="#7c3aed"
          />
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              title={action.title}
              icon={action.icon}
              color={action.color}
              onPress={action.onPress}
            />
          ))}
        </View>
      </View>

      {/* Upcoming Appointments */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {upcomingAppointments?.length > 0 ? (
          upcomingAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onPress={() => navigation.navigate('Appointments', {
                screen: 'AppointmentDetails',
                params: { appointmentId: appointment.id }
              })}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Icon name="event" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No upcoming appointments</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('Appointments', { screen: 'BookAppointment' })}
            >
              <Text style={styles.emptyStateButtonText}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent Notifications */}
      {notifications?.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile', { screen: 'Notifications' })}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onPress={() => {
                apiService.markNotificationAsRead(notification.id);
                // Navigate based on notification type
                if (notification.type === 'appointment') {
                  navigation.navigate('Appointments');
                } else if (notification.type === 'billing') {
                  navigation.navigate('Billing');
                }
              }}
            />
          ))}
        </View>
      )}

      {/* Emergency Contact */}
      <View style={styles.emergencySection}>
        <TouchableOpacity style={styles.emergencyButton}>
          <Icon name="emergency" size={24} color="#ffffff" />
          <Text style={styles.emergencyButtonText}>Emergency Contact</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 10,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  emergencySection: {
    padding: 20,
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  emergencyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
