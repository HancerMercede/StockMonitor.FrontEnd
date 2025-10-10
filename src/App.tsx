import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { SignalRProvider } from './contexts/SignalRContext';
import Dashboard from './components/Dashboard';
import UserProfile from './components/UserProfile';
import SubscriptionPlans from './components/SubscriptionPlans';
import SubscriptionSuccess from './components/SubscriptionSuccess';
import AdminDashboard from './components/AdminDashboard';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <ErrorBoundary 
      showToast={true}
      onError={(error, errorInfo) => {
        // Log para debugging (puedes agregar Sentry, LogRocket, etc.)
        console.error('🔴 App Error:', error, errorInfo);
      }}
    >
      <Router>
        <AuthProvider>
          <SignalRProvider>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/subscription" element={<SubscriptionPlans />} />
              <Route path="/subscription/success" element={<SubscriptionSuccess />} />
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SignalRProvider>
          <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
            loading: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
            },
          }}
        />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
