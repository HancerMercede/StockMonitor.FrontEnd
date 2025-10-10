import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/jwtUtils';
import { ShieldAlert } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Guard que protege rutas de administrador
 * Solo permite acceso a usuarios con rol Admin o SuperAdmin
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al dashboard
  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar si el usuario tiene rol de admin
  const userIsAdmin = isAdmin();

  // Si no es admin, mostrar página de acceso denegado
  if (!userIsAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-red-500/30 rounded-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full mb-4">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Acceso Denegado
            </h1>
            
            <p className="text-gray-400 mb-6">
              No tienes permisos para acceder a esta área del sistema.
              Solo los administradores pueden ver esta página.
            </p>

            <div className="space-y-3">
              <a
                href="/dashboard"
                className="block w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Volver al Dashboard
              </a>
              
              <p className="text-xs text-gray-500">
                Si crees que deberías tener acceso, contacta al administrador del sistema
              </p>
            </div>
          </div>

          {/* Debug info (solo en desarrollo) */}
          {import.meta.env.DEV && (
            <div className="mt-4 p-4 bg-gray-900/50 border border-gray-700 rounded-lg text-xs font-mono">
              <div className="text-gray-400 mb-2">Debug Info:</div>
              <div className="space-y-1 text-gray-500">
                <div>User: {user?.username || 'N/A'}</div>
                <div>Email: {user?.email || 'N/A'}</div>
                <div>Is Admin: {userIsAdmin ? 'Yes' : 'No'}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Usuario es admin, permitir acceso
  return <>{children}</>;
};

export default AdminRoute;
