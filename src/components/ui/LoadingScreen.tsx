import { LoadingSpinner } from './LoadingSpinner';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message = 'Cargando...', fullScreen = false }: LoadingScreenProps) {
  const containerClass = fullScreen 
    ? 'min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' 
    : 'min-h-64';

  return (
    <div className={`${containerClass} flex items-center justify-center`}>
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-lg font-medium text-white">{message}</p>
      </div>
    </div>
  );
}