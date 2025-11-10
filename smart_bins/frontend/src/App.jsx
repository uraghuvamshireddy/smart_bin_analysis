import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import BinsPage from "./pages/BinsPage";
import AlertsPage from "./pages/AlertsPage";
import TasksPage from "./pages/TasksPage";
import AdminMapPage from "./pages/AdminMapPage";
import ProtectedRoute from "./components/ProtectedRoute";
import WorkerDashboard from "./pages/worker/WorkerDashboard";
import AssignedTasks from "./pages/worker/AssignedTasks";
import CompletedTasks from "./pages/worker/CompletedTasks";
import WorkerProtectedRoute from "./components/WorkerProtectedRoute";
import OptimalRouteMap from "./pages/worker/OptimalRouteMap";
import UserMap from "./pages/UserMap";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="bins" element={<BinsPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="map" element={<AdminMapPage />} />
                <Route path="*" element={<AdminDashboard />} />


              </Routes>
            </ProtectedRoute>
          }
        />

<Route
  path="/worker/*"
  element={
    <WorkerProtectedRoute>
      <Routes>
        <Route path="dashboard" element={<WorkerDashboard />} />
        <Route path="tasks" element={<AssignedTasks />} />
        <Route path="completed" element={<CompletedTasks />} />
        <Route path="route" element={<OptimalRouteMap />} />
        <Route path="*" element={<WorkerDashboard />} />
      </Routes>
    </WorkerProtectedRoute>
  }
/>
<Route path="/user/map" element={<UserMap />} />



      </Routes>
    </BrowserRouter>
  );
}
