import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Appointment } from '../../types';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onPress,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#3b82f6';
      case 'confirmed':
        return '#10b981';
      case 'checked_in':
        return '#f59e0b';
      case 'in_progress':
        return '#8b5cf6';
      case 'completed':
        return '#059669';
      case 'cancelled':
        return '#dc2626';
      case 'no_show':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'schedule';
      case 'confirmed':
        return 'check-circle';
      case 'checked_in':
        return 'login';
      case 'in_progress':
        return 'medical-services';
      case 'completed':
        return 'done';
      case 'cancelled':
        return 'cancel';
      case 'no_show':
        return 'person-off';
      default:
        return 'help';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.dateTimeContainer}>
          <Text style={styles.dateText}>{formatDate(appointment.start_time)}</Text>
          <Text style={styles.timeText}>{formatTime(appointment.start_time)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) }]}>
          <Icon name={getStatusIcon(appointment.status)} size={16} color="#ffffff" />
          <Text style={styles.statusText}>{appointment.status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.appointmentType}>{appointment.appointment_type}</Text>
        {appointment.provider && (
          <Text style={styles.providerText}>
            Dr. {appointment.provider.profile?.first_name} {appointment.provider.profile?.last_name}
          </Text>
        )}
        {appointment.reason && (
          <Text style={styles.reasonText}>{appointment.reason}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Icon name="access-time" size={16} color="#6b7280" />
        <Text style={styles.durationText}>
          {Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (1000 * 60))} min
        </Text>
        <Icon name="chevron-right" size={20} color="#9ca3af" style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    marginBottom: 12,
  },
  appointmentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  providerText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  durationText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  chevron: {
    marginLeft: 'auto',
  },
});

export default AppointmentCard;
