import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { UsersPage } from '../pages/users/UsersPage';
import { StudentsPage } from '../pages/students/StudentsPage';
import { BatchesPage } from '../pages/batches/BatchesPage';
import { FingerprintsPage } from '../pages/fingerprints/FingerprintsPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { DownloadsPage } from '../pages/downloads/DownloadsPage';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Dashboard and Management Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:id" element={<StudentsPage />} />
          <Route path="/batches" element={<BatchesPage />} />
          <Route path="/fingerprints" element={<FingerprintsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/downloads" element={<DownloadsPage />} />

          {/* User Management restricted to SUPER_ADMIN and ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN']} />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
