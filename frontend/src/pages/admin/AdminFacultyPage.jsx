import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, Search, Shield } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { TableSkeleton } from '../../components/Skeletons';
import toast from 'react-hot-toast';

const AdminFacultyPage = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const tabs = [
    { id: 'Pending', name: 'Pending Approvals' },
    { id: 'Approved', name: 'Approved Faculty' },
    { id: 'Rejected', name: 'Rejected Applications' },
    { id: 'Suspended', name: 'Suspended Accounts' },
    { id: '', name: 'All Faculty' },
  ];

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const data = await adminService.getFacultyList(activeTab, search);
      if (data.success) {
        setFacultyList(data.faculty);
      }
    } catch (error) {
      toast.error('Failed to load faculty list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [activeTab, search]);

  const handleStatusChange = async (facultyId, newStatus) => {
    setUpdatingId(facultyId);
    try {
      const res = await adminService.updateFacultyStatus(facultyId, newStatus);
      if (res.success) {
        toast.success(res.message);
        fetchFaculty();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update faculty status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Faculty Mentor Approval System
          </h1>
          <p className="text-xs text-slate-500">
            Review and approve faculty applications. Approvals trigger email credentials.
          </p>
        </div>

        <button
          onClick={fetchFaculty}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600"
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
                    ? 'bg-indigo-600 text-white shadow-glow'
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
              placeholder="Search name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="glass-card rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <TableSkeleton />
        ) : facultyList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-bold">No Faculty Members Found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-6">Faculty Info</th>
                  <th className="py-3.5 px-4">Department & Designation</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Applied Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {facultyList.map((fac) => (
                  <tr key={fac._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={fac.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80'}
                          alt={fac.name}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{fac.name}</p>
                          <p className="text-[11px] text-slate-500">{fac.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-slate-800 dark:text-slate-200 font-semibold">{fac.department || 'CSE'}</p>
                      <p className="text-[11px] text-slate-500">{fac.designation || 'Senior Mentor'}</p>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={fac.status} />
                    </td>
                    <td className="py-4 px-4 text-slate-500">
                      {new Date(fac.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {updatingId === fac._id ? (
                        <span className="text-xs text-indigo-500 font-semibold">Updating...</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {fac.status !== 'Approved' && (
                            <button
                              onClick={() => handleStatusChange(fac._id, 'Approved')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}

                          {fac.status === 'Pending' && (
                            <button
                              onClick={() => handleStatusChange(fac._id, 'Rejected')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          )}

                          {fac.status === 'Approved' && (
                            <button
                              onClick={() => handleStatusChange(fac._id, 'Suspended')}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-800"
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

export default AdminFacultyPage;
