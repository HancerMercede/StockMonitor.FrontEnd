import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, UserCircle, Crown, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/jwtUtils';
import SubscriptionModal from './SubscriptionModal';

interface UserMenuProps {
  user: {
    username: string;
    email: string;
  };
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { subscription } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Verificar si el usuario es admin
  const userIsAdmin = isAdmin();

  // Cerrar el menú cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Obtener la inicial del nombre
  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border-2 border-white/30"
      >
        {getInitial(user.username)}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 overflow-hidden z-50">
          {/* User Info */}
          <div className="px-4 py-3 bg-gray-900 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base">
                {getInitial(user.username)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{user.username}</p>
                <p className="text-gray-400 text-sm truncate">{user.email}</p>
                {subscription && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                    subscription.name === 'Premium' ? 'bg-purple-600 text-white' :
                    subscription.name === 'Pro' ? 'bg-blue-600 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {subscription.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Admin Dashboard - Solo visible para admins */}
            {userIsAdmin && (
              <button
                onClick={() => {
                  navigate('/admin');
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 flex items-center space-x-3 text-amber-400 hover:bg-gray-700 transition-colors border-b border-gray-700"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Admin Dashboard</span>
              </button>
            )}
            
            <button
              onClick={() => {
                navigate('/profile');
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 flex items-center space-x-3 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <UserCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Mi Perfil</span>
            </button>
            <button
              onClick={() => {
                setShowSubscriptionModal(true);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 flex items-center space-x-3 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <Crown className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Mi Suscripción</span>
            </button>
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 flex items-center space-x-3 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Log out</span>
            </button>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
      />
    </div>
  );
};

export default UserMenu;
