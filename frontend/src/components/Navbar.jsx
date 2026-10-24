import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, Shield, User } from 'lucide-react';

const routeTitles = {
  '/': 'System Overview',
  '/students': 'Student Directory',
  '/departments': 'Academic Departments',
  '/courses': 'Course Catalog',
  '/registrations': 'Course Registrations',
  '/database-explorer': 'Database Explorer',
};

const Navbar = ({ onMobileMenuClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const title = routeTitles[location.pathname] || 'College Management';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs shadow-xs">
      {/* Left side: Hamburger button + Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden focus:outline-hidden"
          aria-label="Open mobile menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight sm:text-xl">
            {title}
          </h2>
        </div>
      </div>

      {/* Right side: User Profile info + Quick actions */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-semibold text-slate-800">
                {user.fullName || user.username}
              </span>
              <span className="text-xs text-slate-400">
                {user.email || user.username}
              </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 px-2.5 border border-slate-200">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  user.role === 'OWNER' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              />
              <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                {user.role}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 focus:outline-hidden transition-colors"
              title="Sign out of system"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
