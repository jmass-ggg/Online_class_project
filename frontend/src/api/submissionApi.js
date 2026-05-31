import axiosClient from "./axiosClient";

const SUBMISSION_ENDPOINT = "/Submission/";

export const submissionApi = {
  list(params = {}) {
    return axiosClient.get(SUBMISSION_ENDPOINT, { params });
  },

  create({ assignment, submitted_file }) {
    const formData = new FormData();

    formData.append("assignment", assignment);
    formData.append("submitted_file", submitted_file);

    return axiosClient.post(SUBMISSION_ENDPOINT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};