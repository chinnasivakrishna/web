import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, AlertTriangle } from 'lucide-react';

const ProtectedRoute = ({ allowedRoles = ['student', 'admin'], requireApproved = true }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const isTryingAdmin = location.pathname.startsWith('/admin');
    return <Navigate to={isTryingAdmin ? '/admin/login' : '/login'} state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="glass-card max-w-md w-full p-8 rounded-3xl text-center space-y-4 border border-rose-200 dark:border-rose-900/50">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 rounded-2xl flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Unauthorized</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your current account role ({user.role}) does not have permission to access this area.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-5 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Check Student Approval Status
  if (user.role === 'student' && requireApproved && user.status !== 'Approved') {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6">
        <div className="glass-card max-w-lg w-full p-8 rounded-3xl text-center space-y-5 border border-amber-200 dark:border-amber-900/50">
          {user.status === 'Pending' && (
            <>
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Account Pending Approval</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Thank you for registering with <strong>StuVaradhi</strong>! Your account is currently under review by our Admin team.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 text-left space-y-1">
                <p className="font-bold">⚡ What happens next?</p>
                <p>An administrator will verify your profile. Once approved, you will receive an official notification email and full portal access.</p>
              </div>
            </>
          )}

          {user.status === 'Rejected' && (
            <>
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-950/60 rounded-2xl flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Registration Not Approved</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We regret to inform you that your student registration request was not approved. Please contact platform support for further inquiries.
              </p>
            </>
          )}

          {user.status === 'Suspended' && (
            <>
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-600 dark:text-slate-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Account Suspended</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your account access has been temporarily suspended by an administrator. Please reach out to StuVaradhi support.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
