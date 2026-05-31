import { Navigate, Route, Routes } from "react-router-dom";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import RegisterTeacher from "./pages/RegisterTeacher.jsx";
import RegisterStudent from "./pages/RegisterStudent.jsx";
import NotFound from "./pages/NotFound.jsx";

import AuthLayout from "./layouts/AuthLayout.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import TeacherRoute from "./routes/TeacherRoute.jsx";
import StudentRoute from "./routes/StudentRoute.jsx";

import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import TeacherCourses from "./pages/teacher/TeacherCourses.jsx";
import CreateCourse from "./pages/teacher/CreateCourse.jsx";
import EditCourse from "./pages/teacher/EditCourse.jsx";
import CourseDetails from "./pages/teacher/CourseDetails.jsx";
import TeacherBatches from "./pages/teacher/TeacherBatches.jsx";
import CreateBatch from "./pages/teacher/CreateBatch.jsx";
import EditBatch from "./pages/teacher/EditBatch.jsx";
import BatchDetails from "./pages/teacher/BatchDetails.jsx";
import TeacherSessions from "./pages/teacher/TeacherSessions.jsx";
import CreateSession from "./pages/teacher/CreateSession.jsx";
import Attendance from "./pages/teacher/Attendance.jsx";

import TeacherAssignments from "./pages/teacher/TeacherAssignments.jsx";
import TeacherSubmissions from "./pages/teacher/TeacherSubmissions.jsx";

import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import JoinClassroom from "./pages/student/JoinClassroom.jsx";
import StudentBatches from "./pages/student/StudentBatches.jsx";
import StudentCourseDetails from "./pages/student/StudentCourseDetails.jsx";
import StudentSessions from "./pages/student/StudentSessions.jsx";

import StudentAssignments from "./pages/student/StudentAssignments.jsx";
import StudentSubmissions from "./pages/student/StudentSubmissions.jsx";

import LiveClassRoom from "./pages/live/LiveClassRoom.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register/teacher" element={<RegisterTeacher />} />
        <Route path="/register/student" element={<RegisterStudent />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/live/session/:id" element={<LiveClassRoom />} />

        <Route element={<TeacherRoute />}>
          <Route path="/teacher" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />

            <Route path="dashboard" element={<TeacherDashboard />} />

            <Route path="courses" element={<TeacherCourses />} />
            <Route path="courses/create" element={<CreateCourse />} />
            <Route path="courses/:id" element={<CourseDetails />} />
            <Route path="courses/:id/edit" element={<EditCourse />} />

            <Route path="batches" element={<TeacherBatches />} />
            <Route path="batches/create" element={<CreateBatch />} />
            <Route path="batches/:id" element={<BatchDetails />} />
            <Route path="batches/:id/edit" element={<EditBatch />} />

            <Route path="sessions" element={<TeacherSessions />} />
            <Route path="sessions/create" element={<CreateSession />} />
            <Route path="sessions/:id/attendance" element={<Attendance />} />

            <Route path="assignments" element={<TeacherAssignments />} />
            <Route path="submissions" element={<TeacherSubmissions />} />
          </Route>
        </Route>

        <Route element={<StudentRoute />}>
          <Route path="/student" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />

            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="join-classroom" element={<JoinClassroom />} />

            <Route path="batches" element={<StudentBatches />} />
            <Route path="courses/:id" element={<StudentCourseDetails />} />

            <Route path="sessions" element={<StudentSessions />} />

            <Route path="assignments" element={<StudentAssignments />} />
            <Route path="submissions" element={<StudentSubmissions />} />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}