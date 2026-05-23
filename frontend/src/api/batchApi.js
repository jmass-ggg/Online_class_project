import axiosClient from "./axiosClient";

const base = "/Batch/";

export const batchApi = {
  getBatches: () => axiosClient.get(base),
  getBatch: (id) => axiosClient.get(`${base}${id}/`),
  createBatch: (data) => axiosClient.post(base, data),
  updateBatch: (id, data) => axiosClient.put(`${base}${id}/`, data),
  partialUpdateBatch: (id, data) => axiosClient.patch(`${base}${id}/`, data),
  deleteBatch: (id) => axiosClient.delete(`${base}${id}/`),
  regenerateEnrollmentCode: (id) =>
    axiosClient.post(`${base}${id}/regenerate-code/`),
};