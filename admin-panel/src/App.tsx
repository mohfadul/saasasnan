import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { BillingPage } from './pages/BillingPage';
import { PendingPaymentsPage } from './pages/PendingPaymentsPage';
import { ClinicalNotesPage } from './pages/ClinicalNotesPage';
import { TreatmentPlansPage } from './pages/TreatmentPlansPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AIPage from './pages/AIPage';
import { SettingsPage } from './pages/SettingsPage';
import { PatientTable } from './components/patients/PatientTable';

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime in v4)
      refetchOnMount: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

// Main App Routes
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <div className="space-y-6">
                <div className="md:flex md:items-center md:justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                      Patients
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage your patient records
                    </p>
                  </div>
                </div>
                <PatientTable />
              </div>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <AppointmentsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/clinical"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ClinicalNotesPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/treatment-plans"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <TreatmentPlansPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

              <Route
                path="/marketplace"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <MarketplacePage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/billing"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <BillingPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments/pending"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <PendingPaymentsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AnalyticsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ai"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <AIPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SettingsPage />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppRoutes />
          </Router>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
