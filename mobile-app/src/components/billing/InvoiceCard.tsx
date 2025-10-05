import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Invoice } from '../../types';

interface InvoiceCardProps {
  invoice: Invoice;
  onPress: () => void;
}

const InvoiceCard: React.FC<InvoiceCardProps> = ({
  invoice,
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
      case 'paid':
        return '#10b981';
      case 'overdue':
        return '#dc2626';
      case 'sent':
        return '#3b82f6';
      case 'draft':
        return '#6b7280';
      case 'cancelled':
        return '#9ca3af';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return 'check-circle';
      case 'overdue':
        return 'warning';
      case 'sent':
        return 'mail';
      case 'draft':
        return 'edit';
      case 'cancelled':
        return 'cancel';
      default:
        return 'help';
    }
  };

  const isOverdue = () => {
    if (invoice.status === 'paid') return false;
    return new Date(invoice.due_date) < new Date();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          <Text style={styles.invoiceDate}>{formatDate(invoice.invoice_date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) }]}>
          <Icon name={getStatusIcon(invoice.status)} size={14} color="#ffffff" />
          <Text style={styles.statusText}>{invoice.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.totalAmount}>${invoice.total_amount.toFixed(2)}</Text>
        {invoice.balance_amount > 0 && (
          <Text style={styles.balanceAmount}>
            Balance: ${invoice.balance_amount.toFixed(2)}
          </Text>
        )}
        <Text style={styles.dueDate}>
          Due: {formatDate(invoice.due_date)}
        </Text>
      </View>

      {isOverdue() && (
        <View style={styles.overdueBanner}>
          <Icon name="warning" size={16} color="#dc2626" />
          <Text style={styles.overdueText}>Payment Overdue</Text>
        </View>
      )}

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
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  invoiceDate: {
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
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  overdueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  overdueText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'flex-end',
  },
});

export default InvoiceCard;
