import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  Award,
  BookOpen,
  CheckCircle,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CourseDetailPage = () => {
  const { slug } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isApproved, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourseDetail = async () => {
      try {
        const data = await courseService.getCourseBySlug(slug);
        if (data.success) {
          setCourse(data.course);
        }
      } catch (error) {
        toast.error('Course not found');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetail();
  }, [slug]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to enroll in this course');
      navigate('/login');
      return;
    }

    if (!isApproved) {
      toast.error('Your student account is pending Admin Approval');
      navigate('/dashboard');
      return;
    }

    const toastId = toast.loading('Submitting enrollment request...');
    try {
      const res = await courseService.enrollInCourse(course._id);
      if (res.success) {
        toast.success('We will connect you!', { id: toastId });
        navigate('/my-courses');
      } else {
        toast.error(res.message || 'Failed to submit enrollment request', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to submit enrollment request', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold">Course Not Found</h2>
        <Link to="/courses" className="text-brand-600 font-semibold hover:underline">
          Back to Courses
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Course Banner */}
      <section className="bg-slate-900 text-white py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-400">
              <span className="px-2.5 py-1 rounded-md bg-brand-950 border border-brand-800">
                {course.category}
              </span>
              <span>•</span>
              <span>{course.level} Level</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black leading-tight">
              {course.title}
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-400" />
                {course.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                {course.certificateIncluded ? 'Certificate Included' : 'No Certificate'}
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                {course.instructorName}
              </span>
            </div>
          </div>

          {/* Pricing & Enrollment Card */}
          <div className="lg:col-span-4">
            <div className="glass-card p-6 rounded-3xl border border-slate-700 bg-slate-800/90 space-y-6">
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-48 object-cover rounded-2xl"
              />

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-white">
                    ₹{course.discountPrice?.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 line-through ml-2">
                    ₹{course.price?.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
                  Save 30%
                </span>
              </div>

              <button
                onClick={handleEnroll}
                className="w-full py-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 shadow-glow transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Enroll Now
              </button>

              <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Approved Student Access</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-10">
          {/* Learning Outcomes */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">What You Will Learn</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {course.learningOutcomes?.map((outcome, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{outcome}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Curriculum */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Course Curriculum</h3>
            {course.curriculum && course.curriculum.length > 0 ? (
              <div className="space-y-3">
                {course.curriculum.map((section, idx) => (
                  <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{section.sectionTitle}</h4>
                    <ul className="space-y-1.5">
                      {section.lessons?.map((lesson, lIdx) => (
                        <li key={lIdx} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-xl">
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-brand-500" />
                            {lesson.title}
                          </span>
                          <span className="text-[11px] text-slate-400">{lesson.duration}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Curriculum module breakdown is available upon enrollment.</p>
            )}
          </div>

          {/* Technologies & Skills */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Technologies Covered</h3>
            <div className="flex flex-wrap gap-2">
              {course.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-900"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Instructor Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Lead Instructor</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-bold text-lg">
                {course.instructorName?.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{course.instructorName}</h4>
                <p className="text-xs text-slate-500">{course.instructorRole}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Senior software architect dedicated to mentoring StuVaradhi students in real-world application design.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
