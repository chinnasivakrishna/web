import API from './api';

export const courseService = {
  getCourses: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.level) params.append('level', filters.level);
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);

    const response = await API.get(`/courses?${params.toString()}`);
    return response.data;
  },

  getCourseBySlug: async (slug) => {
    const response = await API.get(`/courses/slug/${slug}`);
    return response.data;
  },

  createCourse: async (courseData) => {
    const response = await API.post('/courses', courseData);
    return response.data;
  },

  updateCourse: async (courseId, courseData) => {
    const response = await API.put(`/courses/${courseId}`, courseData);
    return response.data;
  },

  deleteCourse: async (courseId) => {
    const response = await API.delete(`/courses/${courseId}`);
    return response.data;
  },
};
