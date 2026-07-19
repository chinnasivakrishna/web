import API from './api';

export const meetingService = {
  createMeeting: async (title, classroomId) => {
    const response = await API.post('/meetings', { title, classroomId });
    return response.data;
  },

  getMeetingDetails: async (meetingId) => {
    const response = await API.get(`/meetings/${meetingId}`);
    return response.data;
  },

  requestJoin: async (meetingId) => {
    const response = await API.post(`/meetings/${meetingId}/request-join`);
    return response.data;
  },

  respondJoinRequest: async (meetingId, studentId, action) => {
    const response = await API.post(`/meetings/${meetingId}/respond-join`, { studentId, action });
    return response.data;
  },

  admitAllJoinRequests: async (meetingId) => {
    const response = await API.post(`/meetings/${meetingId}/respond-join-all`);
    return response.data;
  },

  leaveMeeting: async (meetingId) => {
    const response = await API.post(`/meetings/${meetingId}/leave`);
    return response.data;
  },

  updateMediaState: async (meetingId, mediaState) => {
    const response = await API.post(`/meetings/${meetingId}/media-state`, mediaState);
    return response.data;
  },

  removeParticipant: async (meetingId, studentId) => {
    const response = await API.post(`/meetings/${meetingId}/remove-participant`, { studentId });
    return response.data;
  },

  toggleRaiseHand: async (meetingId) => {
    const response = await API.post(`/meetings/${meetingId}/raise-hand`);
    return response.data;
  },

  sendChatMessage: async (meetingId, content) => {
    const response = await API.post(`/meetings/${meetingId}/messages`, { content });
    return response.data;
  },

  endMeeting: async (meetingId) => {
    const response = await API.put(`/meetings/${meetingId}/end`);
    return response.data;
  },
};
