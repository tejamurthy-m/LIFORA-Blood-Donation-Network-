import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Pages
import HomePage from '../pages/Home/HomePage';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import FindDonorsPage from '../pages/FindDonors/FindDonorsPage';
import CreateRequestPage from '../pages/Requests/CreateRequestPage';
import EmergencyRequestPage from '../pages/Requests/EmergencyRequestPage';
import DonorDashboard from '../pages/Donor/DonorDashboard';
import RecipientDashboard from '../pages/Recipient/RecipientDashboard';
import HospitalPortal from '../pages/Hospital/HospitalPortal';

export default function AppRoutes() {
  return (
    <Routes>
      {/* 1. Public Website Layout (Home, Find Donors, Become a Donor, How It Works, About Us, Login, Register, Emergency) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/find-donors" element={<FindDonorsPage />} />
        <Route path="/create-request" element={<CreateRequestPage />} />
        <Route path="/emergency-request" element={<EmergencyRequestPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* 2. Donor Dashboard (Protected: only role === 'donor') */}
      <Route
        path="/donor"
        element={
          <ProtectedRoute allowedRoles={['donor']}>
            <DashboardLayout title="Donor Portal" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DonorDashboard />} />
        <Route path="profile" element={<DonorDashboard />} />
        <Route path="availability" element={<DonorDashboard />} />
        <Route path="requests" element={<DonorDashboard />} />
        <Route path="accepted" element={<DonorDashboard />} />
        <Route path="history" element={<DonorDashboard />} />
        <Route path="notifications" element={<DonorDashboard />} />
        <Route path="settings" element={<DonorDashboard />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 3. Recipient Dashboard (Protected: only role === 'recipient') */}
      <Route
        path="/recipient"
        element={
          <ProtectedRoute allowedRoles={['recipient']}>
            <DashboardLayout title="Recipient Portal" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<RecipientDashboard />} />
        <Route path="find-donors" element={<FindDonorsPage />} />
        <Route path="create-request" element={<CreateRequestPage />} />
        <Route path="emergency-request" element={<EmergencyRequestPage />} />
        <Route path="requests" element={<RecipientDashboard />} />
        <Route path="track" element={<RecipientDashboard />} />
        <Route path="notifications" element={<RecipientDashboard />} />
        <Route path="profile" element={<RecipientDashboard />} />
        <Route path="settings" element={<RecipientDashboard />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 4. Hospital Portal (Protected: role === 'hospital' or hospital staff) */}
      <Route
        path="/hospital"
        element={
          <ProtectedRoute allowedRoles={['hospital', 'hospital_admin', 'request_manager', 'donor_coordinator', 'medical_staff']}>
            <DashboardLayout title="Hospital Management Portal" />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<HospitalPortal />} />
        <Route path="requests" element={<HospitalPortal />} />
        <Route path="donors" element={<HospitalPortal />} />
        <Route path="arrivals" element={<HospitalPortal />} />
        <Route path="donations" element={<HospitalPortal />} />
        <Route path="verifications" element={<HospitalPortal />} />
        <Route path="tracking" element={<HospitalPortal />} />
        <Route path="staff" element={<HospitalPortal />} />
        <Route path="notifications" element={<HospitalPortal />} />
        <Route path="analytics" element={<HospitalPortal />} />
        <Route path="profile" element={<HospitalPortal />} />
        <Route path="settings" element={<HospitalPortal />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* Legacy and Super-Admin redirects: direct to Hospital Portal */}
      <Route path="/admin/*" element={<Navigate to="/hospital/dashboard" replace />} />
      <Route path="/super-admin/*" element={<Navigate to="/hospital/dashboard" replace />} />

      {/* Fallback to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
