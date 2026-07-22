import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../layouts/AdminLayout';
import FacultyLayout from '../layouts/FacultyLayout';
import StudentLayout from '../layouts/StudentLayout';
import ClassroomDetailPage from '../pages/classroom/ClassroomDetailPage';

const ClassroomLayoutWrapper = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return (
      <AdminLayout>
        <ClassroomDetailPage />
      </AdminLayout>
    );
  }

  if (user?.role === 'faculty') {
    return (
      <FacultyLayout>
        <ClassroomDetailPage />
      </FacultyLayout>
    );
  }

  // Student default
  return (
    <StudentLayout>
      <ClassroomDetailPage />
    </StudentLayout>
  );
};

export default ClassroomLayoutWrapper;
