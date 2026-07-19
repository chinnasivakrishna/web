import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import FacultyLayout from './layouts/FacultyLayout';
import StudentLayout from './layouts/StudentLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ClassroomLayoutWrapper from './components/ClassroomLayoutWrapper';

// Public Pages
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Faculty Pages
import FacultyRegisterPage from './pages/faculty/FacultyRegisterPage';
import FacultyLoginPage from './pages/faculty/FacultyLoginPage';
import FacultyDashboardPage from './pages/faculty/FacultyDashboardPage';

// Admin Pages
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminStudentsPage from './pages/admin/AdminStudentsPage';
import AdminFacultyPage from './pages/admin/AdminFacultyPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminClassroomsPage from './pages/admin/AdminClassroomsPage';
import AdminAdminsPage from './pages/admin/AdminAdminsPage';

// Student Pages
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import StudentCoursesPage from './pages/student/StudentCoursesPage';
import StudentClassroomsPage from './pages/student/StudentClassroomsPage';
import StudentSettingsPage from './pages/student/StudentSettingsPage';

// Classroom & Live Google Meet Pages
import ClassroomDetailPage from './pages/classroom/ClassroomDetailPage';
import MeetRoomPage from './pages/classroom/MeetRoomPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                borderRadius: '12px',
                fontSize: '13px',
              },
            }}
          />
          <Routes>
            {/* PUBLIC WEBSITE ROUTES */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="course/:slug" element={<CourseDetailPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password/:token" element={<ResetPasswordPage />} />

              {/* Faculty Public Auth */}
              <Route path="faculty/register" element={<FacultyRegisterPage />} />
              <Route path="faculty/login" element={<FacultyLoginPage />} />
            </Route>

            {/* SEPARATE ADMIN PUBLIC LOGIN */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* PROTECTED ADMIN ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} requireApproved={false} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="students" element={<AdminStudentsPage />} />
                <Route path="faculty" element={<AdminFacultyPage />} />
                <Route path="courses" element={<AdminCoursesPage />} />
                <Route path="classrooms" element={<AdminClassroomsPage />} />
                <Route path="admins" element={<AdminAdminsPage />} />
              </Route>
            </Route>

            {/* PROTECTED FACULTY ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['faculty']} requireApproved={true} />}>
              <Route path="/faculty" element={<FacultyLayout />}>
                <Route path="dashboard" element={<FacultyDashboardPage />} />
                <Route path="classrooms" element={<FacultyDashboardPage />} />
                <Route path="profile" element={<StudentProfilePage />} />
              </Route>
            </Route>

            {/* PROTECTED STUDENT DASHBOARD ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={['student']} requireApproved={true} />}>
              <Route element={<StudentLayout />}>
                <Route path="/dashboard" element={<StudentDashboardPage />} />
                <Route path="/profile" element={<StudentProfilePage />} />
                <Route path="/my-courses" element={<StudentCoursesPage />} />
                <Route path="/my-classrooms" element={<StudentClassroomsPage />} />
                <Route path="/settings" element={<StudentSettingsPage />} />
              </Route>
            </Route>

            {/* CLASSROOM & GOOGLE MEET ROOM (FACULTY, STUDENT & ADMIN) */}
            <Route element={<ProtectedRoute allowedRoles={['student', 'faculty', 'admin']} requireApproved={true} />}>
              <Route path="/classroom/:id" element={<ClassroomLayoutWrapper />} />
              <Route path="/classroom/:classId/meet/:meetId" element={<MeetRoomPage />} />
            </Route>

            {/* FALLBACK 404 */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center p-6 text-center">
                  <div className="space-y-4">
                    <h1 className="text-4xl font-black">404 - Page Not Found</h1>
                    <a href="/" className="text-brand-600 font-bold hover:underline">
                      Return to Homepage
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
