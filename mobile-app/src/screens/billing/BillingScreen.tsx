import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialIcons';

import apiService from '../../services/api';
import InvoiceCard from '../../components/billing/InvoiceCard';
import PaymentCard from '../../components/billing/PaymentCard';

const BillingScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'invoices' | 'payments'>('invoices');

  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => apiService.getInvoices(),
  });

  const { data: payments, isLoading: paymentsLoading, refetch: refetchPayments } = useQuery({
    queryKey: ['payments'],
    queryFn: () => apiService.getPayments(),
  });

  const renderInvoice = ({ item }: { item: any }) => (
    <InvoiceCard
      invoice={item}
      onPress={() => {
        // Navigate to invoice details
        console.log('Navigate to invoice details:', item.id);
      }}
    />
  );

  const renderPayment = ({ item }: { item: any }) => (
    <PaymentCard
      payment={item}
      onPress={() => {
        // Navigate to payment details
        console.log('Navigate to payment details:', item.id);
      }}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon 
        name={selectedTab === 'invoices' ? 'receipt' : 'payment'} 
        size={64} 
        color="#d1d5db" 
      />
      <Text style={styles.emptyStateTitle}>
        No {selectedTab} found
      </Text>
      <Text style={styles.emptyStateText}>
        {selectedTab === 'invoices' 
          ? "You don't have any invoices yet"
          : "You haven't made any payments yet"
        }
      </Text>
    </View>
  );

  const onRefresh = async () => {
    if (selectedTab === 'invoices') {
      await refetchInvoices();
    } else {
      await refetchPayments();
    }
  };

  const getTotalOutstanding = () => {
    if (!invoices) return 0;
    return invoices
      .filter(invoice => invoice.status !== 'paid')
      .reduce((total, invoice) => total + invoice.balance_amount, 0);
  };

  const getTotalPaid = () => {
    if (!payments) return 0;
    return payments
      .filter(payment => payment.status === 'completed')
      .reduce((total, payment) => total + payment.amount, 0);
  };

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>${getTotalOutstanding().toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Outstanding</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>${getTotalPaid().toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Paid</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'invoices' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('invoices')}
        >
          <Icon name="receipt" size={20} color={selectedTab === 'invoices' ? '#2563eb' : '#6b7280'} />
          <Text style={[
            styles.tabText,
            selectedTab === 'invoices' && styles.activeTabText,
          ]}>
            Invoices
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'payments' && styles.activeTab,
          ]}
          onPress={() => setSelectedTab('payments')}
        >
          <Icon name="payment" size={20} color={selectedTab === 'payments' ? '#2563eb' : '#6b7280'} />
          <Text style={[
            styles.tabText,
            selectedTab === 'payments' && styles.activeTabText,
          ]}>
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        data={selectedTab === 'invoices' ? invoices : payments}
        renderItem={selectedTab === 'invoices' ? renderInvoice : renderPayment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={selectedTab === 'invoices' ? invoicesLoading : paymentsLoading}
            onRefresh={onRefresh}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#2563eb',
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default BillingScreen;
