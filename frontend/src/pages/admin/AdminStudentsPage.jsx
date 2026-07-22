import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Search, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/Skeletons';
import toast from 'react-hot-toast';

const AdminStudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const tabs = [
    { id: 'Pending', name: 'Pending Approvals', color: 'text-amber-500' },
    { id: 'Approved', name: 'Approved Students', color: 'text-emerald-500' },
    { id: 'Rejected', name: 'Rejected Applications', color: 'text-rose-500' },
    { id: 'Suspended', name: 'Suspended Accounts', color: 'text-slate-400' },
    { id: '', name: 'All Students', color: 'text-brand-500' },
  ];

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await adminService.getStudents(activeTab, search);
      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      toast.error('Failed to load student list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeTab, search]);

  const handleStatusChange = async (studentId, newStatus) => {
    setUpdatingId(studentId);
    try {
      const res = await adminService.updateStudentStatus(studentId, newStatus);
      if (res.success) {
        toast.success(res.message);
        fetchStudents();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update student status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Student Approval & Access Control
          </h1>
          <p className="text-xs text-slate-500">
            Review, approve, reject, or suspend student access. Approvals trigger email notifications.
          </p>
        </div>

        <button
          onClick={fetchStudents}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-600"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh List
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-bold">No Students Found</p>
            <p className="text-xs">No students matching the selected filter status standard.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Student Info</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-6 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                          alt={student.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{student.name}</p>
                          <p className="text-[11px] text-slate-400">ID: {student._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-800 dark:text-slate-200 font-semibold">{student.email}</p>
                      <p className="text-[11px] text-slate-500">{student.phone}</p>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(student.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {updatingId === student._id ? (
                        <span className="text-xs text-brand-500 font-semibold">Updating...</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {student.status !== 'Approved' && (
                            <button
                              onClick={() => handleStatusChange(student._id, 'Approved')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                              title="Approve Student Account & Send Email"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}

                          {student.status !== 'Rejected' && student.status === 'Pending' && (
                            <button
                              onClick={() => handleStatusChange(student._id, 'Rejected')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          )}

                          {student.status === 'Approved' && (
                            <button
                              onClick={() => handleStatusChange(student._id, 'Suspended')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Suspend
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentsPage;
