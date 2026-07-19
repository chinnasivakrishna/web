import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminLoginPage = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await adminLogin(data);
      if (res.success) {
        toast.success(`Authenticated as Admin: ${res.user.name}`);
        navigate('/admin/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid Admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-900">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-800 bg-slate-950/80 space-y-6 shadow-2xl text-white">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-glow">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">StuVaradhi Admin Portal</h2>
          <p className="text-xs text-slate-400">Restricted Access • Administrator Authentication</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="admin@stuvaradhi.com"
                {...register('email', { required: 'Admin email is required' })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            {errors.password && <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Login to Admin Panel
              </>
            )}
          </button>
        </form>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 text-center space-y-1">
          <p className="font-semibold text-slate-300">🔐 Demo Admin Credentials:</p>
          <p>Email: <code className="text-brand-400">admin@stuvaradhi.com</code></p>
          <p>Password: <code className="text-brand-400">Admin@123456</code></p>
        </div>

        <div className="text-center pt-2">
          <Link to="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            ← Return to Main Website
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
