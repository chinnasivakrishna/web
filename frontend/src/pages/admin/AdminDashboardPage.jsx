import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Users, Clock, CheckCircle2, XCircle, BookOpen, Shield, TrendingUp, AlertTriangle } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/Skeletons';
import toast from 'react-hot-toast';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await adminService.getStats();
        if (data.success) {
          setStats(data.stats);
          setRecentStudents(data.recentRegistrations || []);
        }
      } catch (error) {
        toast.error('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <TableSkeleton />;
  }

  const statCards = [
    {
      title: 'Total Registered Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'from-brand-600 to-indigo-600',
      textColor: 'text-brand-600',
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingStudents || 0,
      icon: Clock,
      color: 'from-amber-500 to-orange-500',
      textColor: 'text-amber-500',
    },
    {
      title: 'Approved Active Students',
      value: stats?.approvedStudents || 0,
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-500',
    },
    {
      title: 'Total Masterclass Courses',
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      color: 'from-cyan-500 to-blue-600',
      textColor: 'text-cyan-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Admin Overview & Metrics
        </h1>
        <p className="text-xs text-slate-500">
          Real-time snapshot of StuVaradhi student status breakdown & platform statistics.
        </p>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{card.title}</span>
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{card.value}</span>
                <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> +100%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Registrations Table */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Student Registrations</h3>
            <p className="text-xs text-slate-500">Latest student signups awaiting or possessing status updates.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Approval Status</th>
                <th className="py-3 px-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {recentStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No recent student registrations.
                  </td>
                </tr>
              ) : (
                recentStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{student.name}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{student.email}</td>
                    <td className="py-3.5 px-4 text-slate-500">{student.phone}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
