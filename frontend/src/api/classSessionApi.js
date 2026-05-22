import axiosClient from "./axiosClient";

const base = "/ClassSession/";

export const classSessionApi = {
  getSessions: () => axiosClient.get(base),
  getSession: (id) => axiosClient.get(`${base}${id}/`),
  createSession: (data) => axiosClient.post(base, data),
  updateSession: (id, data) => axiosClient.put(`${base}${id}/`, data),
  partialUpdateSession: (id, data) => axiosClient.patch(`${base}${id}/`, data),
  deleteSession: (id) => axiosClient.delete(`${base}${id}/`),
  startSession: (id) => axiosClient.post(`${base}${id}/start/`),
  joinSession: (id) => axiosClient.post(`${base}${id}/join/`),
  completeSession: (id) => axiosClient.post(`${base}${id}/complete/`),
  cancelSession: (id) => axiosClient.post(`${base}${id}/cancel/`),
  getAttendance: (id) => axiosClient.get(`${base}${id}/attendance/`)
};
