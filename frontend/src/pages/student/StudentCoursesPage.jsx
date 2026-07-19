import React, { useEffect, useState } from 'react';
import { courseService } from '../../services/courseService';
import CourseCard from '../../components/CourseCard';
import { CourseSkeleton } from '../../components/Skeletons';

const StudentCoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseService.getCourses({ status: 'published' });
        if (data.success) {
          setCourses(data.courses);
        }
      } catch (error) {
        console.error('Failed to load courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Training Programs</h1>
        <p className="text-xs text-slate-500">Access your enrolled masterclasses & explore new domains.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CourseSkeleton />
          <CourseSkeleton />
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

export default StudentCoursesPage;
