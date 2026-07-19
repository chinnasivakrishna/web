import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { classroomService } from '../../services/classroomService';
import { BookOpen, Users, Video, FileText, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentClassroomsPage = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const data = await classroomService.getClassrooms();
        if (data.success) {
          setClassrooms(data.classrooms);
        }
      } catch (error) {
        toast.error('Failed to load classrooms');
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  const handleJoinMeeting = (classId) => {
    const meetId = `meet-${classId}`;
    navigate(`/classroom/${classId}/meet/${meetId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Enrolled Classrooms</h1>
        <p className="text-xs text-slate-500">Access learning materials, shared files, announcements & live meeting sessions.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading classrooms...</div>
      ) : classrooms.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-3 border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Enrolled Classrooms Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You have not been assigned to a classroom yet. Platform Administrators or Teachers will assign you to a classroom cohort.
          </p>
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
                  <span className="text-xs font-semibold text-slate-500">{cls.subject}</span>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{cls.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{cls.description}</p>
                </div>

                {/* Faculty Card */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center gap-3">
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
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{cls.faculty?.name || 'Assigned Instructor'}</p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Faculty Mentor</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-emerald-500" />
                    {cls.students?.length || 0} Classmates
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4 text-amber-500" />
                    {cls.resources?.length || 0} Shared Documents
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
                  onClick={() => handleJoinMeeting(cls._id)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 shadow-glow transition-all"
                >
                  <Video className="w-3.5 h-3.5" />
                  Join Live Meeting
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentClassroomsPage;
