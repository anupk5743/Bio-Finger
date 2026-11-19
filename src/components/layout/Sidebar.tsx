import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Layers,
  Fingerprint,
  Download,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { hasRole, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);

  const canManageUsers = hasRole('SUPER_ADMIN', 'ADMIN');

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      to: '/users',
      label: 'User Management',
      icon: Users,
      visible: canManageUsers,
    },
    {
      to: '/students',
      label: 'Student',
      icon: UserCheck,
      visible: true,
    },
    {
      to: '/batches',
      label: 'Batch',
      icon: Layers,
      visible: true,
    },
    {
      to: '/fingerprints',
      label: 'Device Status',
      icon: Fingerprint,
      visible: true,
    },
  ];

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Header on mobile to close */}
        <div className="p-4 md:hidden flex items-center justify-between border-b border-slate-100">
          <span className="font-bold text-slate-800">Menu</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List matching Screenshot 2 */}
        <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                      isActive
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </div>

        {/* Bottom actions matching Screenshot 2: Download & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-1.5">
          <NavLink
            to="/downloads"
            onClick={() => onClose()}
            className={({ isActive }) =>
              `flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <Download className="w-5 h-5 flex-shrink-0" />
            <span>Download</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal matching Screenshot 8 */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Confirmation"
        message="Are you sure you want to sign out?"
        confirmLabel="SIGN OUT"
        cancelLabel="CANCEL"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
};
