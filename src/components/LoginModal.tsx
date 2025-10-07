import React, { useState } from 'react';
import { X, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register';

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [emailOrUsername, setEmailOrUsername] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({ emailOrUsername, password });
        toast.success(`¡Bienvenido de nuevo!`);
        onClose();
      } else {
        await register({ email, username, password });
        toast.success(`¡Cuenta creada exitosamente! Bienvenido ${username}!`);
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    // Limpiar formularios
    setEmail('');
    setUsername('');
    setPassword('');
    setEmailOrUsername('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-blue-900/95 to-slate-900/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src="/images/logo.png" 
                alt="Stock Monitor Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {mode === 'login' ? 'Ingresa tus credenciales para continuar' : 'Completa el formulario para comenzar'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white transition-all"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Usuario
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white transition-all"
                    placeholder="nombredeusuario"
                  />
                </div>
              </div>
            </>
          )}

          {mode === 'login' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email o Usuario
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white transition-all"
                  placeholder="Email o usuario"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-gray-50 focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>
            {mode === 'register' && (
              <p className="text-xs text-gray-500 mt-2 ml-1">Mínimo 6 caracteres</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 mt-6"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                <span>{mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</span>
              </>
            )}
          </button>

          {/* Switch Mode */}
          <div className="text-center pt-6 mt-6 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button
                type="button"
                onClick={switchMode}
                className="ml-2 text-blue-600 font-bold hover:text-blue-700 hover:underline transition-all"
              >
                {mode === 'login' ? 'Regístrate gratis' : 'Inicia Sesión'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
