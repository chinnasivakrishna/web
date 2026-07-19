import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { BookOpen, Award, CheckCircle2, ArrowRight, Sparkles, Clock } from 'lucide-react';
import CourseCard from '../../components/CourseCard';
import StatusBadge from '../../components/StatusBadge';

const StudentDashboardPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getCourses({ status: 'published' });
        if (data.success) {
          setCourses(data.courses.slice(0, 2));
        }
      } catch (error) {
        console.error('Error loading student courses:', error);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-brand-500/30 bg-gradient-to-r from-brand-600/10 via-indigo-500/10 to-cyan-500/10 relative overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Welcome Back
            </span>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              Hello, {user?.name}! 👋
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              StuVaradhi Portal • Bridging Students to Success
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={user?.status} />
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Enrolled Courses</span>
            <BookOpen className="w-5 h-5 text-brand-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">2 Masterclasses</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Certificates</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">1 Verified</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Account Status</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Approved Student</p>
        </div>
      </div>

      {/* Enrolled Courses Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Active Learning Courses</h3>
          <Link to="/my-courses" className="text-xs font-bold text-brand-600 hover:underline">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <CourseCard key={course._id || course.slug} course={course} />
          ))}
        </div>
      </div>

      {/* Certificates Placeholder */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">My StuVaradhi Credentials & Certificates</h4>
            <p className="text-xs text-slate-500">Earned upon course capstone completion</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <p className="font-bold text-slate-900 dark:text-white">MERN Full-Stack Foundation Certificate</p>
            <p className="text-[11px] text-slate-500">Verification ID: STU-2026-88912</p>
          </div>
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Verified Active
          </span>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
