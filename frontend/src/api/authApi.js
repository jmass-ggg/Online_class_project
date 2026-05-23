import axiosClient from "./axiosClient";

export const authApi = {
  login: (data) => axiosClient.post("/auth/login/", data),
  refresh: () => axiosClient.post("/auth/refresh/"),
  me: () => axiosClient.get("/auth/me/"),

  teacherRegister: (data) =>
    axiosClient.post("/auth/teacher/register/", data),

  studentRegister: (data) =>
    axiosClient.post("/auth/student/register/", data),

  getTeacherProfile: () => axiosClient.get("/auth/me/teacher/"),
  getStudentProfile: () => axiosClient.get("/auth/me/student/"),
};