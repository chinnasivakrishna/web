import API from './api';

export const classroomService = {
  getClassrooms: async () => {
    const response = await API.get('/classrooms');
    return response.data;
  },

  getClassroomById: async (id) => {
    const response = await API.get(`/classrooms/${id}`);
    return response.data;
  },

  createClassroom: async (classroomData) => {
    const response = await API.post('/classrooms', classroomData);
    return response.data;
  },

  updateClassroomMembers: async (classroomId, memberData) => {
    const response = await API.put(`/classrooms/${classroomId}/members`, memberData);
    return response.data;
  },

  uploadResource: async (classroomId, resourceData) => {
    let payload = resourceData;
    let headers = {};

    if (resourceData.file) {
      const formData = new FormData();
      formData.append('title', resourceData.title || '');
      formData.append('file', resourceData.file);
      if (resourceData.fileType) formData.append('fileType', resourceData.fileType);
      if (resourceData.fileUrl) formData.append('fileUrl', resourceData.fileUrl);
      payload = formData;
      headers = { 'Content-Type': 'multipart/form-data' };
    }

    const response = await API.post(`/classrooms/${classroomId}/resources`, payload, { headers });
    return response.data;
  },

  postAnnouncement: async (classroomId, content) => {
    const response = await API.post(`/classrooms/${classroomId}/announcements`, { content });
    return response.data;
  },

  askDoubt: async (classroomId, question) => {
    const response = await API.post(`/classrooms/${classroomId}/doubts`, { question });
    return response.data;
  },

  answerDoubt: async (classroomId, doubtId, answer) => {
    const response = await API.post(`/classrooms/${classroomId}/doubts/${doubtId}/answers`, { answer });
    return response.data;
  },

  deleteClassroom: async (id) => {
    const response = await API.delete(`/classrooms/${id}`);
    return response.data;
  },
};
