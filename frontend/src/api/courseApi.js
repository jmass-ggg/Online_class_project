import axiosClient from "./axiosClient";

const base = "/Course/";

export const courseApi = {
  getCourses: () => axiosClient.get(base),
  getCourse: (id) => axiosClient.get(`${base}${id}/`),
  createCourse: (data) => axiosClient.post(base, data),
  updateCourse: (id, data) => axiosClient.put(`${base}${id}/`, data),
  partialUpdateCourse: (id, data) => axiosClient.patch(`${base}${id}/`, data),
  deleteCourse: (id) => axiosClient.delete(`${base}${id}/`)
};
