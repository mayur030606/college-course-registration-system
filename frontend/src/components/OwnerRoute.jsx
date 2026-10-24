import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const OwnerRoute = ({ children }) => {
  const { isAuthenticated, isOwner, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage text="Checking owner privileges..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isOwner) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-6 shadow-sm">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Access Denied</h1>
        <p className="mt-2 max-w-md text-slate-500 text-sm leading-relaxed">
          The Database Explorer is restricted to administrators with the <strong>OWNER</strong> role. Your current account does not have sufficient administrative privileges.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return children ? children : <Outlet />;
};

export default OwnerRoute;
