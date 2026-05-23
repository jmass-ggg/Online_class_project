export const USER_ROLES = {
  TEACHER: "TEACHER",
  STUDENT: "STUDENT"
};

export const SESSION_STATUS = {
  UPCOMING: "UPCOMING",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
};

export const DASHBOARD_PATHS = {
  TEACHER: "/teacher/dashboard",
  STUDENT: "/student/dashboard"
};

export const API_PATHS = {
  COURSES: "/Course/",
  BATCHES: "/Batch/",
  SESSIONS: "/ClassSession/"
};
export const COURSE_CATEGORY_OPTIONS = [
  { value: "PROGRAMMING", label: "Programming" },
  { value: "DESIGN", label: "Design" },
  { value: "BUSINESS", label: "Business" },
  { value: "MARKETING", label: "Marketing" },
  { value: "DATA_SCIENCE", label: "Data Science" },
  { value: "LANGUAGE", label: "Language" },
  { value: "OTHER", label: "Other" },
];

export const COURSE_LEVEL_OPTIONS = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

export const getCourseCategoryLabel = (value) => {
  return (
    COURSE_CATEGORY_OPTIONS.find((category) => category.value === value)
      ?.label || value || "—"
  );
};

export const getCourseLevelLabel = (value) => {
  return (
    COURSE_LEVEL_OPTIONS.find((level) => level.value === value)?.label ||
    value ||
    "—"
  );
};