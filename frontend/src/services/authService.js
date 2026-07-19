import API from './api';

export const authService = {
  register: async (userData) => {
    const response = await API.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await API.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('stuvaradhi_token', response.data.token);
      localStorage.setItem('stuvaradhi_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  adminLogin: async (credentials) => {
    const response = await API.post('/auth/admin-login', credentials);
    if (response.data.token) {
      localStorage.setItem('stuvaradhi_token', response.data.token);
      localStorage.setItem('stuvaradhi_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  facultyRegister: async (facultyData) => {
    const response = await API.post('/auth/faculty-register', facultyData);
    return response.data;
  },

  facultyLogin: async (credentials) => {
    const response = await API.post('/auth/faculty-login', credentials);
    if (response.data.token) {
      localStorage.setItem('stuvaradhi_token', response.data.token);
      localStorage.setItem('stuvaradhi_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await API.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await API.post(`/auth/reset-password/${token}`, { password });
    return response.data;
  },

  getMe: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    let payload = profileData;
    let headers = {};

    if (profileData instanceof FormData || profileData.imageFile) {
      if (!(profileData instanceof FormData)) {
        const formData = new FormData();
        if (profileData.name) formData.append('name', profileData.name);
        if (profileData.phone) formData.append('phone', profileData.phone);
        if (profileData.department) formData.append('department', profileData.department);
        if (profileData.designation) formData.append('designation', profileData.designation);
        if (profileData.imageFile) formData.append('profileImage', profileData.imageFile);
        payload = formData;
      }
      headers = { 'Content-Type': 'multipart/form-data' };
    }

    const response = await API.put('/auth/update-profile', payload, { headers });
    if (response.data.user) {
      localStorage.setItem('stuvaradhi_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('stuvaradhi_token');
    localStorage.removeItem('stuvaradhi_user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('stuvaradhi_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },
};
