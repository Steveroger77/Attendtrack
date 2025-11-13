
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import RoleBadge from './ui/RoleBadge';
import Button from './ui/Button';
import { ICONS } from '../constants';

interface HeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 bg-black/30 backdrop-blur-xl border-b border-white/10 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 -mb-px">
          <div className="flex">
             <button
              className="text-gray-500 hover:text-gray-600 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="5" width="16" height="2" />
                <rect x="4" y="11" width="16" height="2" />
                <rect x="4" y="17" width="16" height="2" />
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <div className="text-right">
                    <div className="font-semibold text-gray-200">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.college_id}</div>
                </div>
                <RoleBadge role={user.role} />
                <Button variant="ghost" onClick={logout} className="!p-2">
                    {ICONS.logout}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
