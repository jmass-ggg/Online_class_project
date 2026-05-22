import axiosClient from "./axiosClient";

export const enrollmentApi = {
  joinClassroom: (join_code) => axiosClient.post("/enrollment/", { join_code })
};
