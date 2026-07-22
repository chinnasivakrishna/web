import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { classroomService } from '../../services/classroomService';
import { meetingService } from '../../services/meetingService';
import { BookOpen, Users, Video, FileText, Plus, ExternalLink, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const FacultyDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingMeetId, setCreatingMeetId] = useState(null);

  useEffect(() => {
    const fetchFacultyClassrooms = async () => {
      try {
        const data = await classroomService.getClassrooms();
        if (data.success) {
          setClassrooms(data.classrooms);
        }
      } catch (error) {
        toast.error('Failed to load faculty classrooms');
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyClassrooms();
  }, []);

  const handleStartMeeting = async (classroomId, classTitle) => {
    setCreatingMeetId(classroomId);
    try {
      const res = await meetingService.createMeeting(`Live Lecture: ${classTitle}`, classroomId);
      if (res.success) {
        toast.success('Virtual Meeting Room Created!');
        navigate(res.joinUrl);
      }
    } catch (error) {
      toast.error('Failed to create meeting room');
    } finally {
      setCreatingMeetId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-600/10 via-purple-500/10 to-brand-500/10 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Faculty Mentorship Console
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Welcome, {user?.name}! 🎓
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
          {user?.designation || 'Faculty Mentor'} • {user?.department || 'Computer Science'}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Assigned Classrooms</span>
            <BookOpen className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{classrooms.length}</p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Total Enrolled Students</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {classrooms.reduce((acc, curr) => acc + (curr.students?.length || 0), 0)}
          </p>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold">Shared Files & Documents</span>
            <FileText className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {classrooms.reduce((acc, curr) => acc + (curr.resources?.length || 0), 0)}
          </p>
        </div>
      </div>

      {/* My Classrooms List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">My Active Classrooms</h3>
            <p className="text-xs text-slate-500">Manage learning materials & launch live virtual meeting sessions.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading classrooms...</div>
        ) : classrooms.length === 0 ? (
          <div className="glass-card p-12 rounded-3xl text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">No Assigned Classrooms Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Platform Administrators assign classrooms and student cohorts to Faculty mentors.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {classrooms.map((cls) => (
              <div
                key={cls._id}
                className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      Code: {cls.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{cls.subject}</span>
                  </div>

                  <h4 className="text-xl font-extrabold text-slate-900 dark:text-white">{cls.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{cls.description}</p>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-emerald-500" />
                      {cls.students?.length || 0} Students
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4 text-amber-500" />
                      {cls.resources?.length || 0} Shared Files
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to={`/classroom/${cls._id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
                  >
                    Open Classroom
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    onClick={() => handleStartMeeting(cls._id, cls.title)}
                    disabled={creatingMeetId === cls._id}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 shadow-glow transition-all"
                  >
                    <Video className="w-3.5 h-3.5" />
                    {creatingMeetId === cls._id ? 'Starting...' : 'Launch Live Meeting'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboardPage;
