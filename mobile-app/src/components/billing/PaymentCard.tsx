import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Payment } from '../../types';

interface PaymentCardProps {
  payment: Payment;
  onPress: () => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  onPress,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#dc2626';
      case 'refunded':
        return '#8b5cf6';
      case 'cancelled':
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'pending':
        return 'schedule';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'undo';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return 'credit-card';
      case 'cash':
        return 'money';
      case 'bank_transfer':
        return 'account-balance';
      case 'check':
        return 'description';
      case 'insurance':
        return 'health-and-safety';
      case 'online':
        return 'payment';
      default:
        return 'payment';
    }
  };

  const formatMethodName = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Bank Transfer';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentNumber}>{payment.payment_number}</Text>
          <Text style={styles.paymentDate}>{formatDate(payment.payment_date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
          <Icon name={getStatusIcon(payment.status)} size={14} color="#ffffff" />
          <Text style={styles.statusText}>{payment.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>${payment.amount.toFixed(2)}</Text>
          <View style={styles.methodContainer}>
            <Icon name={getMethodIcon(payment.payment_method)} size={16} color="#6b7280" />
            <Text style={styles.methodText}>{formatMethodName(payment.payment_method)}</Text>
          </View>
        </View>
        
        {payment.transaction_id && (
          <Text style={styles.transactionId}>
            Transaction: {payment.transaction_id}
          </Text>
        )}
        
        {payment.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {payment.notes}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Icon name="chevron-right" size={20} color="#9ca3af" />
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
  paymentInfo: {
    flex: 1,
  },
  paymentNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  paymentDate: {
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
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  methodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  transactionId: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 4,
  },
  notes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'flex-end',
  },
});

export default PaymentCard;
