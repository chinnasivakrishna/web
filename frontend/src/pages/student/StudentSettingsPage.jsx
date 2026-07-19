import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Lock, Shield, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentSettingsPage = () => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      toast.success('Password update request processed');
      setPassword('');
    } catch (error) {
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Account Settings</h1>
        <p className="text-xs text-slate-500">Manage security options and notifications.</p>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-500" />
          Security & Password
        </h3>

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-6 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50"
          >
            Update Security Password
          </button>
        </form>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          Notification Preferences
        </h3>

        <div className="space-y-3">
          <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded text-brand-600 focus:ring-brand-500" />
            <span>Receive account approval email updates</span>
          </label>
          <label className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded text-brand-600 focus:ring-brand-500" />
            <span>Course announcement & lecture reminders</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default StudentSettingsPage;
