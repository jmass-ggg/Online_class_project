import axiosClient from "./axiosClient";

const ASSIGNMENT_ENDPOINT = "/StudyMaterial/";

export const assignmentApi = {
  list(params = {}) {
    return axiosClient.get(ASSIGNMENT_ENDPOINT, { params });
  },

  create(formData) {
    return axiosClient.post(ASSIGNMENT_ENDPOINT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  remove(id) {
    return axiosClient.delete(`${ASSIGNMENT_ENDPOINT}${id}/`);
  },
};