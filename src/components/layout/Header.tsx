import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, User as UserIcon, LogOut, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConfirmationModal } from '../common/ConfirmationModal';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  const getInitials = (first?: string, last?: string) => {
    if (!first && !last) return 'BF';
    return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`;
  };

  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name || 'USER';

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm sticky top-0 z-30">
        {/* Left: Mobile hamburger + App Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-9 bg-slate-900 rounded-md flex items-center justify-center text-white shadow-sm">
              <Fingerprint className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Bio Finger</span>
          </div>
        </div>

        {/* Right: User profile matching Screenshot 2 & 7 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 text-left focus:outline-none p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-slate-900 leading-tight">
                {user ? `${user.firstName} ${user.lastName}` : 'Amit koninoom'}
              </p>
              <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase mt-0.5">
                {userRole}
              </p>
            </div>

            {/* Circular Avatar badge matching screenshot reference AKD */}
            <div className="w-11 h-11 rounded-full bg-[#8a2522] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
              {getInitials(user?.firstName, user?.lastName) || 'AKD'}
            </div>

            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-fadeIn z-50">
              <div className="px-4 py-2.5 border-b border-slate-100 sm:hidden">
                <p className="text-sm font-bold text-slate-900">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs font-semibold text-slate-400 uppercase">{userRole}</p>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/profile');
                }}
                className="w-full px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-3 transition-colors"
              >
                <UserIcon className="w-4.5 h-4.5 text-slate-400" />
                <span>Account Profile</span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full px-4 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center space-x-3 transition-colors border-t border-slate-100"
              >
                <LogOut className="w-4.5 h-4.5 text-rose-400" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal matching Screenshot 8 */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        title="Confirmation"
        message="Are you sure you want to sign out?"
        confirmLabel="SIGN OUT"
        cancelLabel="CANCEL"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
};
