import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { SIGNALR_URL } from '../config/api';
import { useAuth } from './AuthContext';
import type { Alert } from '../types';

interface SignalRContextType {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnect: () => Promise<void>;
  // Funciones para suscribirse a eventos
  onNewAlert: (callback: (alert: Alert) => void) => () => void;
  onStatusUpdate: (callback: (status: any) => void) => () => void;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error('useSignalR must be used within SignalRProvider');
  }
  return context;
};

interface SignalRProviderProps {
  children: ReactNode;
}

export const SignalRProvider: React.FC<SignalRProviderProps> = ({ children }) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated } = useAuth();
  
  // Sets para almacenar callbacks de suscriptores
  const alertCallbacksRef = useRef<Set<(alert: Alert) => void>>(new Set());
  const statusCallbacksRef = useRef<Set<(status: any) => void>>(new Set());

  // 📌 Función para suscribirse a nuevas alertas
  const onNewAlert = (callback: (alert: Alert) => void) => {
    alertCallbacksRef.current.add(callback);
    console.log('➕ [SignalR] Nuevo suscriptor de alertas. Total:', alertCallbacksRef.current.size);
    
    // Retorna función de cleanup
    return () => {
      alertCallbacksRef.current.delete(callback);
      console.log('➖ [SignalR] Suscriptor removido. Total:', alertCallbacksRef.current.size);
    };
  };

  // 📌 Función para suscribirse a status updates
  const onStatusUpdate = (callback: (status: any) => void) => {
    statusCallbacksRef.current.add(callback);
    
    // Retorna función de cleanup
    return () => {
      statusCallbacksRef.current.delete(callback);
    };
  };

  // 🔄 Función de reconexión manual
  const reconnect = async () => {
    if (!connection) return;
    try {
      if (connection.state !== HubConnectionState.Disconnected) {
        await connection.stop();
      }
      await connection.start();
      console.log('✅ [SignalR] Reconectado manualmente');
    } catch (err) {
      console.error('❌ [SignalR] Error al reconectar:', err);
    }
  };

  // 🚀 Inicializar y mantener conexión SignalR
  useEffect(() => {
    // Solo conectar si está autenticado
    if (!isAuthenticated) {
      // Si hay conexión activa y el usuario hace logout, desconectar
      if (connection) {
        console.log('🔌 [SignalR] Usuario desautenticado, cerrando conexión...');
        connection.stop().catch(console.error);
        setConnection(null);
        setIsConnected(false);
        setError(null);
      }
      return;
    }

    // ✅ No crear nueva conexión si ya existe
    if (connection) {
      console.log('✓ [SignalR] Conexión ya existe, reutilizando...');
      return;
    }

    console.log('🔌 [SignalR] Iniciando conexión SignalR...');

    const newConnection = new HubConnectionBuilder()
      .withUrl(SIGNALR_URL)
      .withAutomaticReconnect([2000, 5000, 10000, 30000])
      .build();

    // 📡 Event handlers de conexión
    newConnection.onclose((error) => {
      console.log('❌ [SignalR] Conexión cerrada:', error?.message);
      setIsConnected(false);
      setError(error?.message || 'Connection closed');
    });

    newConnection.onreconnecting((error) => {
      console.log('⏳ [SignalR] Reconectando...', error?.message);
      setIsConnecting(true);
      setError('Reconnecting...');
    });

    newConnection.onreconnected((connectionId) => {
      console.log('✅ [SignalR] Reconectado. ID:', connectionId);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    // 📨 Event handlers para mensajes del servidor
    newConnection.on('NewAlert', (alert: Alert) => {
      console.log('🔔 [SignalR] Nueva alerta:', alert.symbol, alert.type);
      // Notificar a TODOS los suscriptores
      alertCallbacksRef.current.forEach(callback => {
        try {
          callback(alert);
        } catch (err) {
          console.error('Error en callback de alerta:', err);
        }
      });
    });

    newConnection.on('StatusUpdate', (status: any) => {
      console.log('📊 [SignalR] Status update');
      statusCallbacksRef.current.forEach(callback => {
        try {
          callback(status);
        } catch (err) {
          console.error('Error en callback de status:', err);
        }
      });
    });

    newConnection.on('AlertsBatch', (alerts: Alert[]) => {
      console.log('📦 [SignalR] Batch de alertas:', alerts.length);
      alerts.forEach(alert => {
        alertCallbacksRef.current.forEach(callback => {
          try {
            callback(alert);
          } catch (err) {
            console.error('Error en callback de batch:', err);
          }
        });
      });
    });

    // 🎯 Iniciar conexión
    const startConnection = async () => {
      try {
        setIsConnecting(true);
        setError(null);
        console.log('⏳ [SignalR] Conectando a', SIGNALR_URL);
        await newConnection.start();
        console.log('✅ [SignalR] Conectado exitosamente!');
        setIsConnected(true);
      } catch (err) {
        console.error('❌ [SignalR] Error al conectar:', err);
        setIsConnected(false);
        setError(err instanceof Error ? err.message : 'Connection failed');
      } finally {
        setIsConnecting(false);
      }
    };

    setConnection(newConnection);
    startConnection();

    // 🧹 Cleanup SOLO cuando el provider se desmonte
    return () => {
      console.log('🧹 [SignalR] Limpiando provider...');
      if (newConnection.state !== HubConnectionState.Disconnected) {
        newConnection.stop().catch(console.error);
      }
    };
  }, [isAuthenticated]);

  const value: SignalRContextType = {
    isConnected,
    isConnecting,
    error,
    reconnect,
    onNewAlert,
    onStatusUpdate,
  };

  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
};
