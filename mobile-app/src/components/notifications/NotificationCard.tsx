import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Notification } from '../../types';

interface NotificationCardProps {
  notification: Notification;
  onPress: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'event';
      case 'billing':
        return 'payment';
      case 'clinical':
        return 'medical-services';
      case 'general':
        return 'notifications';
      default:
        return 'info';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return '#3b82f6';
      case 'billing':
        return '#dc2626';
      case 'clinical':
        return '#059669';
      case 'general':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.is_read && styles.unreadContainer,
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Icon
            name={getTypeIcon(notification.type)}
            size={20}
            color={getTypeColor(notification.type)}
          />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, !notification.is_read && styles.unreadTitle]}>
            {notification.title}
          </Text>
          <Text style={styles.timeText}>{formatTime(notification.created_at)}</Text>
        </View>
        {!notification.is_read && <View style={styles.unreadDot} />}
      </View>
      
      <Text style={styles.message} numberOfLines={2}>
        {notification.message}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unreadContainer: {
    backgroundColor: '#f8fafc',
    borderColor: '#3b82f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  message: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
    marginLeft: 44,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
  },
});

export default NotificationCard;
