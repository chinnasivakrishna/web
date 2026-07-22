import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Mail, Lock, LogIn, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const FacultyLoginPage = () => {
  const { facultyLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setStatusError(null);
    try {
      const res = await facultyLogin(data);
      if (res.success) {
        toast.success(`Welcome, Professor ${res.user.name}!`);
        navigate('/faculty/dashboard');
      }
    } catch (error) {
      if (error.response?.data?.status) {
        setStatusError({
          status: error.response.data.status,
          message: error.response.data.message,
        });
      } else {
        toast.error(error.response?.data?.message || 'Invalid Faculty credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-glow">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Faculty Portal Login</h2>
          <p className="text-xs text-slate-500">StuVaradhi Mentorship Console</p>
        </div>

        {statusError && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 space-y-2 text-left">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              <span>Approval Status: {statusError.status}</span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {statusError.message}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Faculty Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="faculty@stuvaradhi.com"
                {...register('email', { required: 'Email is required' })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
            {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
              />
            </div>
            {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Login to Faculty Console
              </>
            )}
          </button>
        </form>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 text-center space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">🔑 Demo Faculty Login:</p>
          <p>Email: <code className="text-indigo-600 font-bold">faculty@stuvaradhi.com</code></p>
          <p>Password: <code className="text-indigo-600 font-bold">Faculty@123456</code></p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500">Need a Faculty account?</span>
          <Link to="/faculty/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            Register Faculty
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FacultyLoginPage;
