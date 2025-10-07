import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.tsx'

// Configurar QueryClient con opciones optimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache durante 10 minutos (sincronizado con backend)
      staleTime: 10 * 60 * 1000,
      // Mantener en cache durante 15 minutos
      gcTime: 15 * 60 * 1000,
      // Reintentar 1 vez en caso de error
      retry: 1,
      // Refetch cuando la ventana vuelve a tener foco
      refetchOnWindowFocus: true,
      // No refetch al montar (SignalR maneja updates)
      refetchOnMount: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
