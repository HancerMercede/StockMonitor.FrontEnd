import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSubscription } = useAuth();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refrescar la suscripción del usuario
    const refreshData = async () => {
      try {
        await refreshSubscription();
        toast.success('¡Suscripción activada correctamente!');
      } catch (error) {
        console.error('Error refreshing subscription:', error);
      }
    };

    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-6">
            <CheckCircle className="w-20 h-20 text-green-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
          ¡Pago Exitoso!
        </h1>

        {/* Message */}
        <p className="text-lg text-center text-gray-600 mb-8">
          Tu suscripción ha sido activada correctamente. Ahora tienes acceso a todas las funcionalidades de tu plan.
        </p>

        {/* Session ID (for debugging) */}
        {sessionId && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center">
              ID de sesión: <code className="text-gray-700">{sessionId}</code>
            </p>
          </div>
        )}

        {/* Benefits List */}
        <div className="mb-8 space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Ahora puedes disfrutar de:</h3>
          <ul className="space-y-2">
            <li className="flex items-center text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
              <span>Límites aumentados de alertas y tracking</span>
            </li>
            <li className="flex items-center text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
              <span>Acceso a watchlist personalizado</span>
            </li>
            <li className="flex items-center text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
              <span>Estadísticas avanzadas</span>
            </li>
            <li className="flex items-center text-gray-700">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" />
              <span>Soporte prioritario</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <span>Ir al Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => navigate('/subscription')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-all"
          >
            Gestionar Suscripción
          </button>
        </div>

        {/* Footer Note */}
        <p className="mt-8 text-sm text-center text-gray-500">
          Recibirás un correo de confirmación con los detalles de tu suscripción.
        </p>
      </div>
    </div>
  );
}
