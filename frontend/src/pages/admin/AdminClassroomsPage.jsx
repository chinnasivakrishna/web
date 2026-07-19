import React, { useEffect, useState } from 'react';
import { classroomService } from '../../services/classroomService';
import { adminService } from '../../services/adminService';
import { Plus, BookOpen, Users, UserCheck, Shield, ExternalLink, Trash2, X, Edit3, UserPlus } from 'lucide-react';
import { TableSkeleton } from '../../components/Skeletons';
import toast from 'react-hot-toast';

const AdminClassroomsPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    facultyId: '',
    studentIds: [],
  });

  // Edit Members Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [editFacultyId, setEditFacultyId] = useState('');
  const [editStudentIds, setEditStudentIds] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const classRes = await classroomService.getClassrooms();
      const facRes = await adminService.getFacultyList('Approved');
      const studRes = await adminService.getStudents('Approved');

      if (classRes.success) setClassrooms(classRes.classrooms);
      if (facRes.success) setFacultyList(facRes.faculty);
      if (studRes.success) setStudentList(studRes.students);
    } catch (error) {
      toast.error('Failed to load classroom monitoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClassroom = async (e) => {
    e.preventDefault();
    if (!formData.facultyId) {
      toast.error('Please select a faculty mentor to assign');
      return;
    }

    try {
      const res = await classroomService.createClassroom(formData);
      if (res.success) {
        toast.success(res.message);
        setModalOpen(false);
        setFormData({ title: '', subject: '', description: '', facultyId: '', studentIds: [] });
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create classroom');
    }
  };

  const openEditMembersModal = (cls) => {
    setEditingClassroom(cls);
    setEditFacultyId(cls.faculty?._id || '');
    setEditStudentIds(cls.students?.map((s) => s._id) || []);
    setEditModalOpen(true);
  };

  const handleSaveMembers = async (e) => {
    e.preventDefault();
    if (!editingClassroom) return;

    try {
      const res = await classroomService.updateClassroomMembers(editingClassroom._id, {
        facultyId: editFacultyId,
        studentIds: editStudentIds,
      });

      if (res.success) {
        toast.success('Classroom faculty & student members updated!');
        setEditModalOpen(false);
        setEditingClassroom(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update classroom members');
    }
  };

  const handleDeleteClassroom = async (id) => {
    if (!window.confirm('Delete this classroom?')) return;
    try {
      const res = await classroomService.deleteClassroom(id);
      if (res.success) {
        toast.success('Classroom deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete classroom');
    }
  };

  const toggleStudentSelection = (studentId, isEdit = false) => {
    if (isEdit) {
      setEditStudentIds((prev) =>
        prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
      );
    } else {
      setFormData((prev) => ({
        ...prev,
        studentIds: prev.studentIds.includes(studentId)
          ? prev.studentIds.filter((id) => id !== studentId)
          : [...prev.studentIds, studentId],
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Classroom Monitoring & Member Management Console
          </h1>
          <p className="text-xs text-slate-500">
            Create classrooms, add/remove faculty & students at any time, and monitor shared files & live meetings.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 shadow-glow"
        >
          <Plus className="w-4 h-4" />
          Create Virtual Classroom
        </button>
      </div>

      {/* Classroom List Cards */}
      {loading ? (
        <TableSkeleton />
      ) : classrooms.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-3 border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Active Classrooms</h3>
          <p className="text-xs text-slate-500">Click "Create Virtual Classroom" to set up a new teaching room.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classrooms.map((cls) => (
            <div
              key={cls._id}
              className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                    CODE: {cls.code}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditMembersModal(cls)}
                      className="p-1.5 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1 text-xs font-bold"
                      title="Add or Remove Faculty/Students"
                    >
                      <UserPlus className="w-4 h-4" />
                      Manage Members
                    </button>

                    <button
                      onClick={() => handleDeleteClassroom(cls._id)}
                      className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Classroom"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{cls.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">Subject: {cls.subject}</p>
                </div>

                {/* Assigned Faculty Card */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {cls.faculty?.profileImage ? (
                      <img
                        src={cls.faculty.profileImage}
                        alt={cls.faculty.name}
                        className="w-8 h-8 rounded-xl object-cover ring-2 ring-indigo-500"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-500">
                        {cls.faculty?.name?.charAt(0) || 'F'}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{cls.faculty?.name || 'Unassigned'}</p>
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Assigned Teacher</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-emerald-500" />
                    {cls.students?.length || 0} Enrolled Students
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-amber-500" />
                    {cls.resources?.length || 0} Files & Documents
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={`/classroom/${cls._id}`}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 shadow-sm"
                >
                  <Shield className="w-4 h-4" />
                  Monitor Classroom & Files
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Create Classroom */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Virtual Classroom</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClassroom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Classroom Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Full-Stack MERN Batch 2026"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Subject / Domain</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Web Development & Node.js Architecture"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Assign Primary Faculty Teacher</label>
                <select
                  required
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                >
                  <option value="">Select an Approved Faculty Member...</option>
                  {facultyList.map((fac) => (
                    <option key={fac._id} value={fac._id}>
                      {fac.name} ({fac.department || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Assign Approved Students (Click to select)</label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {studentList.map((stud) => {
                    const isSelected = formData.studentIds.includes(stud._id);
                    return (
                      <div
                        key={stud._id}
                        onClick={() => toggleStudentSelection(stud._id, false)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-brand-500 text-white font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{stud.name} ({stud.email})</span>
                        {isSelected && <UserCheck className="w-4 h-4" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-brand-600 hover:bg-brand-700 shadow-md"
              >
                Confirm Classroom Setup
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Admin Edit Members (Add/Remove Faculty & Students Anytime) */}
      {editModalOpen && editingClassroom && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-xl w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Add or Remove Classroom Members</h3>
                <p className="text-xs text-slate-500">Classroom: {editingClassroom.title}</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMembers} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Re-assign Faculty Teacher</label>
                <select
                  required
                  value={editFacultyId}
                  onChange={(e) => setEditFacultyId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white"
                >
                  {facultyList.map((fac) => (
                    <option key={fac._id} value={fac._id}>
                      {fac.name} ({fac.department || 'Faculty'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold">Enrolled Students ({editStudentIds.length} Selected)</label>
                  <span className="text-[10px] text-slate-500">Click student to add or remove</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {studentList.map((stud) => {
                    const isSelected = editStudentIds.includes(stud._id);
                    return (
                      <div
                        key={stud._id}
                        onClick={() => toggleStudentSelection(stud._id, true)}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{stud.name}</span>
                          <span className="text-[10px] opacity-80">({stud.email})</span>
                        </div>
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-white/20">
                          {isSelected ? '✓ Assigned' : '+ Add'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md"
              >
                Save Member Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClassroomsPage;
