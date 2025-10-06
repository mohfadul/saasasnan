import React, { Suspense } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Lazy load screens for better performance
const HomeScreen = React.lazy(() => import('../screens/home/HomeScreen'));
const AppointmentsScreen = React.lazy(() => import('../screens/appointments/AppointmentsScreen'));
const BookAppointmentScreen = React.lazy(() => import('../screens/appointments/BookAppointmentScreen'));
const AppointmentDetailsScreen = React.lazy(() => import('../screens/appointments/AppointmentDetailsScreen'));
const RecordsScreen = React.lazy(() => import('../screens/records/RecordsScreen'));
const ClinicalNotesScreen = React.lazy(() => import('../screens/records/ClinicalNotesScreen'));
const TreatmentPlansScreen = React.lazy(() => import('../screens/records/TreatmentPlansScreen'));
const TreatmentPlanDetailsScreen = React.lazy(() => import('../screens/records/TreatmentPlanDetailsScreen'));
const BillingScreen = React.lazy(() => import('../screens/billing/BillingScreen'));
const InvoiceDetailsScreen = React.lazy(() => import('../screens/billing/InvoiceDetailsScreen'));
const PaymentScreen = React.lazy(() => import('../screens/billing/PaymentScreen'));
const ProfileScreen = React.lazy(() => import('../screens/profile/ProfileScreen'));
const SettingsScreen = React.lazy(() => import('../screens/settings/SettingsScreen'));
const NotificationsScreen = React.lazy(() => import('../screens/notifications/NotificationsScreen'));
const LoginScreen = React.lazy(() => import('../screens/auth/LoginScreen'));
const RegisterScreen = React.lazy(() => import('../screens/auth/RegisterScreen'));
const ForgotPasswordScreen = React.lazy(() => import('../screens/auth/ForgotPasswordScreen'));
const LoadingScreen = React.lazy(() => import('../screens/common/LoadingScreen'));

// Loading component for Suspense fallback
const LoadingComponent: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

// HOC for lazy loading with Suspense
export const withLazyLoading = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => (
    <Suspense fallback={<LoadingComponent />}>
      <Component {...props} />
    </Suspense>
  );
};

// Export lazy-loaded screens
export const LazyHomeScreen = withLazyLoading(HomeScreen);
export const LazyAppointmentsScreen = withLazyLoading(AppointmentsScreen);
export const LazyBookAppointmentScreen = withLazyLoading(BookAppointmentScreen);
export const LazyAppointmentDetailsScreen = withLazyLoading(AppointmentDetailsScreen);
export const LazyRecordsScreen = withLazyLoading(RecordsScreen);
export const LazyClinicalNotesScreen = withLazyLoading(ClinicalNotesScreen);
export const LazyTreatmentPlansScreen = withLazyLoading(TreatmentPlansScreen);
export const LazyTreatmentPlanDetailsScreen = withLazyLoading(TreatmentPlanDetailsScreen);
export const LazyBillingScreen = withLazyLoading(BillingScreen);
export const LazyInvoiceDetailsScreen = withLazyLoading(InvoiceDetailsScreen);
export const LazyPaymentScreen = withLazyLoading(PaymentScreen);
export const LazyProfileScreen = withLazyLoading(ProfileScreen);
export const LazySettingsScreen = withLazyLoading(SettingsScreen);
export const LazyNotificationsScreen = withLazyLoading(NotificationsScreen);
export const LazyLoginScreen = withLazyLoading(LoginScreen);
export const LazyRegisterScreen = withLazyLoading(RegisterScreen);
export const LazyForgotPasswordScreen = withLazyLoading(ForgotPasswordScreen);
export const LazyLoadingScreen = withLazyLoading(LoadingScreen);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

