import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { subscriptionService } from '../services/subscriptionService';
import { userAlertService } from '../services/userAlertService';
import type { CurrentUser, LoginRequest, RegisterRequest } from '../services/authService';
import type { CurrentSubscription, UserAlertStats } from '../types';

interface AuthContextType {
  user: CurrentUser | null;
  subscription: CurrentSubscription | null;
  alertStats: UserAlertStats | null;
  isAuthenticated: boolean;
  loading: boolean;
  loadingStats: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshSubscription: () => Promise<void>;
  refreshAlertStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [alertStats, setAlertStats] = useState<UserAlertStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  // Cargar datos de suscripción
  const loadSubscription = async (throwOnError = false) => {
    try {
      const sub = await subscriptionService.getCurrentTier();
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
      if (throwOnError) throw error;
    }
  };

  // Cargar estadísticas de alertas
  const loadAlertStats = async (throwOnError = false) => {
    try {
      setLoadingStats(true);
      const stats = await userAlertService.getAlertStats();
      setAlertStats(stats);
    } catch (error) {
      console.error('Error loading alert stats:', error);
      setAlertStats(null);
      if (throwOnError) throw error;
    } finally {
      setLoadingStats(false);
    }
  };

  // Verificar si hay usuario al cargar y validar token
  useEffect(() => {
    const initAuth = async () => {
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        // Validar token intentando cargar datos
        try {
          await Promise.all([
            loadSubscription(true),  // throwOnError = true para validación
            loadAlertStats(true)     // throwOnError = true para validación
          ]);
          setUser(currentUser);
        } catch (error) {
          // Si falla, el token es inválido - hacer logout automático
          console.log('❌ Token inválido, haciendo logout automático');
          authService.logout();
          setUser(null);
          setSubscription(null);
          setAlertStats(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    try {
      const response = await authService.login(data);
      setUser({
        userId: response.userId,
        username: response.username,
        email: response.email,
      });
      await loadSubscription();
      await loadAlertStats();
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await authService.register(data);
      setUser({
        userId: response.userId,
        username: response.username,
        email: response.email,
      });
      await loadSubscription();
      await loadAlertStats();
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setSubscription(null);
    setAlertStats(null);
  };

  const refreshSubscription = async () => {
    await loadSubscription();
    await loadAlertStats();
  };

  const refreshAlertStats = async () => {
    await loadAlertStats();
  };

  // ⏰ Auto-logout por inactividad (15 minutos)
  const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutos
  const WARNING_TIMEOUT = 14 * 60 * 1000; // Advertencia 1 minuto antes
  
  const idleTimerRef = useRef<number | null>(null);
  const warningTimerRef = useRef<number | null>(null);
  const warningToastIdRef = useRef<string | null>(null);
  
  // Resetear timer de inactividad
  const resetIdleTimer = useCallback(() => {
    // Solo si el usuario está autenticado
    if (!user) return;
    
    // Limpiar timers existentes
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    
    // Cerrar toast de advertencia si existe
    if (warningToastIdRef.current) {
      toast.dismiss(warningToastIdRef.current);
      warningToastIdRef.current = null;
    }
    
    // Timer de advertencia (1 minuto antes del logout)
    warningTimerRef.current = setTimeout(() => {
      console.log('⚠️ [Auth] Mostrando advertencia de inactividad');
      warningToastIdRef.current = toast(
        (
          <div className="flex flex-col gap-2">
            <p className="font-semibold">⚠️ Sesión por expirar</p>
            <p className="text-sm">Tu sesión se cerrará en 1 minuto por inactividad.</p>
            <p className="text-xs text-gray-300">Mueve el mouse para mantener la sesión activa.</p>
          </div>
        ),
        {
          duration: 60000, // 1 minuto
          icon: '⏰',
          style: {
            background: '#f59e0b',
            color: '#fff',
          },
        }
      );
    }, WARNING_TIMEOUT);
    
    // Timer de logout automático
    idleTimerRef.current = setTimeout(() => {
      console.log('🔒 [Auth] Logout automático por inactividad');
      toast.error('Sesión cerrada por inactividad', { duration: 5000 });
      logout();
    }, IDLE_TIMEOUT);
  }, [user]);
  
  // Detectar actividad del usuario
  useEffect(() => {
    if (!user) return;
    
    console.log('⏰ [Auth] Iniciando detección de inactividad (15 min)');
    
    // Eventos que indican actividad
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Handler con throttle para evitar demasiadas ejecuciones
    let lastReset = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      // Solo resetear si han pasado más de 1 segundo desde el último reset
      if (now - lastReset > 1000) {
        lastReset = now;
        resetIdleTimer();
      }
    };
    
    // Agregar event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Iniciar timer por primera vez
    resetIdleTimer();
    
    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (warningToastIdRef.current) toast.dismiss(warningToastIdRef.current);
      
      console.log('🧹 [Auth] Detección de inactividad detenida');
    };
  }, [user, resetIdleTimer]);

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        alertStats,
        isAuthenticated: !!user,
        loading,
        loadingStats,
        login,
        register,
        logout,
        refreshSubscription,
        refreshAlertStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
