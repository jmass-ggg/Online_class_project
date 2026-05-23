import axiosClient from "./axiosClient";

export const enrollmentApi = {
  joinClassroom: (join_code) =>
    axiosClient.post("/enrollment/join/", { join_code }),getMyClassrooms: () =>
    axiosClient.get("/enrollment/my-classrooms/"),
};