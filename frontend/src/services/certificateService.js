import api from './api';

export const certificateService = {
  // Issue completion certificate (Faculty / Admin)
  issueCertificate: async (data) => {
    const response = await api.post('/certificates/issue', data);
    return response.data;
  },

  // Public verification by certificate ID (Public QR Scanning)
  verifyCertificate: async (certificateId) => {
    const response = await api.get(`/certificates/verify/${certificateId}`);
    return response.data;
  },

  // Get logged-in student certificates
  getMyCertificates: async () => {
    const response = await api.get('/certificates/my-certificates');
    return response.data;
  },

  // Get certificates issued for a classroom
  getClassroomCertificates: async (classroomId) => {
    const response = await api.get(`/certificates/classroom/${classroomId}`);
    return response.data;
  },
};
