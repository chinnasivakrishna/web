import API from './api';

export const adminService = {
  getStats: async () => {
    const response = await API.get('/admin/stats');
    return response.data;
  },

  getStudents: async (status = '', search = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await API.get(`/admin/students?${params.toString()}`);
    return response.data;
  },

  updateStudentStatus: async (studentId, status) => {
    const response = await API.put(`/admin/students/${studentId}/status`, { status });
    return response.data;
  },

  getAdmins: async () => {
    const response = await API.get('/admin/admins');
    return response.data;
  },

  getFacultyList: async (status = '', search = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await API.get(`/admin/faculty?${params.toString()}`);
    return response.data;
  },

  updateFacultyStatus: async (facultyId, status) => {
    const response = await API.put(`/admin/faculty/${facultyId}/status`, { status });
    return response.data;
  },

  createAdmin: async (adminData) => {
    const response = await API.post('/admin/create-admin', adminData);
    return response.data;
  },

  deleteAdmin: async (adminId) => {
    const response = await API.delete(`/admin/admins/${adminId}`);
    return response.data;
  },
};
