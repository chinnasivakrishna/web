import React, { useEffect, useState } from 'react';
import { Search, Filter, BookOpen } from 'lucide-react';
import CourseCard from '../components/CourseCard';
import { courseService } from '../services/courseService';
import { CourseSkeleton } from '../components/Skeletons';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');

  const categories = ['All', 'Full Stack Development', 'Data Science', 'Cloud & DevOps'];
  const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const data = await courseService.getCourses({
          category,
          level,
          search,
          status: 'published',
        });
        if (data.success) {
          setCourses(data.courses);
        }
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [category, level, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Page Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Explore Training Masterclasses
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Industry-aligned training programs built to accelerate your career in software engineering.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses or skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Category & Level Pills */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  category === cat
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-brand-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CourseSkeleton />
          <CourseSkeleton />
          <CourseSkeleton />
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Courses Found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search criteria or category filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course._id || course.slug} course={course} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
