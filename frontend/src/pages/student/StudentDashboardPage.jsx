import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { certificateService } from '../../services/certificateService';
import CertificateTemplate from '../../components/certificate/CertificateTemplate';
import { BookOpen, Award, CheckCircle2, ArrowRight, Sparkles, Clock, Eye, X } from 'lucide-react';
import CourseCard from '../../components/CourseCard';
import StatusBadge from '../../components/StatusBadge';

const StudentDashboardPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const cData = await courseService.getCourses({ status: 'published' });
        if (cData.success) {
          setCourses(cData.courses.slice(0, 2));
        }

        const certData = await certificateService.getMyCertificates();
        if (certData.success) {
          setCertificates(certData.certificates || []);
        }
      } catch (error) {
        console.error('Error loading student dashboard data:', error);
      }
    };

    fetchDashboardData();
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
            <span className="text-xs font-bold">Verified Credentials</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{certificates.length} Issued</p>
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

      {/* Earned Credentials Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">My StuVaradhi Credentials & Certificates</h4>
            <p className="text-xs text-slate-500">Official QR-verified course completion certificates</p>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="p-6 text-center space-y-2 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <p className="text-xs text-slate-500">No course certificates issued yet.</p>
            <p className="text-[11px] text-slate-400">When your faculty mentor marks your course as completed, your certificate will appear here with PNG/PDF downloads & QR code verification.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900 dark:text-white">{cert.courseTitle}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Verification Serial: {cert.certificateId}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Official Verified 🎓
                  </span>

                  <button
                    onClick={() => setSelectedCert(cert)}
                    className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View & Download (PNG/PDF)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-5xl w-full p-6 rounded-3xl border border-slate-800 bg-slate-900 text-white space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-white">Official Certificate Preview</h3>
              </div>
              <button onClick={() => setSelectedCert(null)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <CertificateTemplate certificate={selectedCert} showActions={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboardPage;
