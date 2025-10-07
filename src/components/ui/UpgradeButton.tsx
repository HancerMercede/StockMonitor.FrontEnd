import React, { useState } from 'react';
import SubscriptionModal from '../SubscriptionModal';

interface UpgradeButtonProps {
  /** Tamaño del botón */
  size?: 'sm' | 'md' | 'lg';
  /** Texto del botón */
  text?: string;
  /** Función personalizada onClick (opcional, por defecto abre modal de suscripción) */
  onClick?: () => void;
  /** Clases adicionales */
  className?: string;
}

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ 
  size = 'md',
  text = 'Upgrade',
  onClick,
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false);
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-3 text-lg'
  };
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setShowModal(true);
    }
  };
  
  return (
    <>
      <button
        onClick={handleClick}
        className={`
          ${sizeClasses[size]}
          bg-gradient-to-r from-yellow-400 to-orange-500 
          hover:from-yellow-500 hover:to-orange-600 
          text-white font-bold rounded-lg 
          transition-all shadow-lg
          ${className}
        `}
      >
        {text}
      </button>
      
      {/* Modal de Suscripción */}
      <SubscriptionModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default UpgradeButton;
