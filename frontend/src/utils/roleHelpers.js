import { USER_ROLES } from "./constants";

export const isTeacher = (user) => user?.role === USER_ROLES.TEACHER;
export const isStudent = (user) => user?.role === USER_ROLES.STUDENT;
export const homeForRole = (role) => (role === USER_ROLES.TEACHER ? "/teacher/dashboard" : "/student/dashboard");
