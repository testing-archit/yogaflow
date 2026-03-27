import React, { useRef, useEffect } from 'react';
import { User, LogOut, Settings, Calendar, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavAdmin?: () => void;
  onNavDashboard?: (tab?: 'profile' | 'asanas' | 'classes' | 'subscription') => void;
}

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ isOpen, onClose, onNavAdmin, onNavDashboard }) => {
  const { user, logout, isAdmin, isAdminChecking } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in-up"
    >
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-teal-50 to-white p-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-lg truncate">{user?.name || 'User'}</h3>
            <p className="text-sm text-slate-600 truncate">{user?.email || ''}</p>
          </div>
        </div>
        {user?.joinDate && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Member since</p>
            <p className="text-sm font-medium text-slate-700">{formatDate(user.joinDate)}</p>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="py-2">
        <a
          href="#"
          className="flex items-center gap-3 px-6 py-3 text-slate-700 hover:bg-teal-50 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            if (onNavDashboard) onNavDashboard('profile');
            onClose();
          }}
        >
          <User size={18} className="text-teal-600" />
          <span className="font-medium">My Profile</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-6 py-3 text-slate-700 hover:bg-teal-50 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            if (onNavDashboard) onNavDashboard('classes');
            onClose();
          }}
        >
          <Calendar size={18} className="text-teal-600" />
          <span className="font-medium">My Classes</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-6 py-3 text-slate-700 hover:bg-teal-50 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            if (onNavDashboard) onNavDashboard('subscription');
            onClose();
          }}
        >
          <CreditCard size={18} className="text-teal-600" />
          <span className="font-medium">Subscription</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-6 py-3 text-slate-700 hover:bg-teal-50 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            if (onNavDashboard) onNavDashboard('profile');
            onClose();
          }}
        >
          <Settings size={18} className="text-teal-600" />
          <span className="font-medium">Settings</span>
        </a>
        {isAdmin && !isAdminChecking && onNavAdmin && (
          <a
            href="#"
            className="flex items-center gap-3 px-6 py-3 text-slate-700 hover:bg-teal-50 transition-colors border-t border-slate-100 mt-2 pt-2"
            onClick={(e) => {
              e.preventDefault();
              onNavAdmin();
              onClose();
            }}
          >
            <Shield size={18} className="text-teal-600" />
            <span className="font-medium">Admin Dashboard</span>
          </a>
        )}
      </div>

      {/* Logout */}
      <div className="border-t border-slate-100 p-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-6 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
