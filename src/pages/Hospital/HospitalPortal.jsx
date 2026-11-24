import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  hospitalPortalService,
  getStoredHospitalData,
  saveStoredHospitalData,
  hasPermission,
} from '../../services/hospitalPortalService';

// Module Views
import HospitalOverviewView from '../../components/hospital/HospitalOverviewView';
import HospitalRequestsView from '../../components/hospital/HospitalRequestsView';
import HospitalDonorsView from '../../components/hospital/HospitalDonorsView';
import HospitalArrivalsView from '../../components/hospital/HospitalArrivalsView';
import HospitalDonationsView from '../../components/hospital/HospitalDonationsView';
import HospitalTrackingView from '../../components/hospital/HospitalTrackingView';
import HospitalStaffView from '../../components/hospital/HospitalStaffView';
import HospitalNotificationsView from '../../components/hospital/HospitalNotificationsView';
import HospitalAnalyticsView from '../../components/hospital/HospitalAnalyticsView';
import HospitalProfileView from '../../components/hospital/HospitalProfileView';
import HospitalSettingsView from '../../components/hospital/HospitalSettingsView';
import HospitalPendingVerificationView from '../../components/hospital/HospitalPendingVerificationView';

export default function HospitalPortal() {
  const { user, staffRole } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [hospitalState, setHospitalState] = useState(getStoredHospitalData);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);

  // Sync state on load
  useEffect(() => {
    setHospitalState(getStoredHospitalData());
  }, []);

  // Determine current active view based on path
  const path = location.pathname;
  const isDashboard = path === '/hospital/dashboard' || path === '/hospital';
  const isRequests = path.includes('/hospital/requests');
  const isDonors = path.includes('/hospital/donors');
  const isArrivals = path.includes('/hospital/arrivals');
  const isDonations = path.includes('/hospital/donations');
  const isTracking = path.includes('/hospital/tracking');
  const isStaff = path.includes('/hospital/staff');
  const isNotifications = path.includes('/hospital/notifications');
  const isAnalytics = path.includes('/hospital/analytics');
  const isProfile = path.includes('/hospital/profile');
  const isSettings = path.includes('/hospital/settings');

  // Navigation helper for quick actions
  const handleNavigate = (subpath) => {
    navigate(`/hospital/${subpath}`);
  };

  // 1. Blood Request Actions
  const handleCreateRequest = async (payload) => {
    const newReq = await hospitalPortalService.createRequest(payload, user);
    setHospitalState(getStoredHospitalData());
    addToast({
      title: 'Blood Request Published',
      message: `${newReq.unitsRequired} unit(s) of ${newReq.bloodGroup} requested. Live broadcast activated.`,
      type: 'success',
    });
    return newReq;
  };

  const handleUpdateRequest = async (id, updates) => {
    await hospitalPortalService.updateRequest(id, updates, user);
    setHospitalState(getStoredHospitalData());
  };

  const handleCloseRequest = async (id) => {
    await hospitalPortalService.closeRequest(id, user);
    setHospitalState(getStoredHospitalData());
  };

  // 2. Donor Actions
  const handleUpdateDonorStatus = async (responseId, newStatus, notes) => {
    await hospitalPortalService.updateDonorResponseStatus(responseId, newStatus, notes, user);
    setHospitalState(getStoredHospitalData());
  };

  const handleScheduleArrival = async (payload) => {
    const newArr = await hospitalPortalService.scheduleArrival(payload, user);
    setHospitalState(getStoredHospitalData());
    return newArr;
  };

  // 3. Arrival Actions
  const handleUpdateArrivalStatus = async (arrivalId, status, checkInTime, notes) => {
    await hospitalPortalService.updateArrivalStatus(arrivalId, status, checkInTime, notes, user);
    setHospitalState(getStoredHospitalData());
  };

  const handleProceedToDonation = (arrival) => {
    navigate('/hospital/donations');
  };

  // 4. Donation Actions
  const handleRecordDonation = async (payload) => {
    const record = await hospitalPortalService.recordDonationOutcome(payload, user);
    setHospitalState(getStoredHospitalData());
    return record;
  };

  // 5. Staff Actions
  const handleAddStaff = async (payload) => {
    const newStaff = await hospitalPortalService.addStaff(payload, user);
    setHospitalState(getStoredHospitalData());
    return newStaff;
  };

  const handleUpdateStaffRole = async (staffId, newRole) => {
    await hospitalPortalService.updateStaffRole(staffId, newRole, user);
    setHospitalState(getStoredHospitalData());
  };

  const handleToggleStaffStatus = async (staffId) => {
    const status = await hospitalPortalService.toggleStaffStatus(staffId, user);
    setHospitalState(getStoredHospitalData());
    return status;
  };

  const handleRemoveStaff = async (staffId) => {
    await hospitalPortalService.removeStaff(staffId, user);
    setHospitalState(getStoredHospitalData());
  };

  // 6. Profile Action
  const handleUpdateProfile = async (updates) => {
    const updated = await hospitalPortalService.updateProfile(updates, user);
    setHospitalState(getStoredHospitalData());
    return updated;
  };

  // 7. Notification Actions
  const handleMarkNotificationRead = (notifId) => {
    const current = getStoredHospitalData();
    current.notifications = current.notifications.map((n) =>
      n.id === notifId ? { ...n, read: true } : n
    );
    saveStoredHospitalData(current);
    setHospitalState(current);
  };

  const handleMarkAllNotificationsRead = () => {
    const current = getStoredHospitalData();
    current.notifications = current.notifications.map((n) => ({ ...n, read: true }));
    saveStoredHospitalData(current);
    setHospitalState(current);
    addToast({
      title: 'Notifications Cleared',
      message: 'All notifications marked as read.',
      type: 'info',
    });
  };

  const handleDeleteNotification = (notifId) => {
    const current = getStoredHospitalData();
    current.notifications = current.notifications.filter((n) => n.id !== notifId);
    saveStoredHospitalData(current);
    setHospitalState(current);
  };

  // VIEW RENDERING
  // Platform Verification Check: only approved hospitals can access operational modules
  const isVerified = hospitalState?.profile?.verificationStatus === 'Verified';

  if (!isVerified) {
    return (
      <HospitalPendingVerificationView
        profile={hospitalState?.profile}
        auditLogs={hospitalState?.auditLogs}
        onStatusChanged={() => {
          setHospitalState(getStoredHospitalData());
        }}
      />
    );
  }

  if (isRequests) {
    return (
      <HospitalRequestsView
        requests={hospitalState.requests}
        donations={hospitalState.donations}
        arrivals={hospitalState.arrivals}
        onCreateRequest={handleCreateRequest}
        onUpdateRequest={handleUpdateRequest}
        onCloseRequest={handleCloseRequest}
        isCreateOpen={isCreateRequestOpen}
        setIsCreateOpen={setIsCreateRequestOpen}
      />
    );
  }

  if (isDonors) {
    return (
      <HospitalDonorsView
        donorResponses={hospitalState.donorResponses}
        requests={hospitalState.requests}
        onUpdateDonorStatus={handleUpdateDonorStatus}
        onScheduleArrival={handleScheduleArrival}
      />
    );
  }

  if (isArrivals) {
    return (
      <HospitalArrivalsView
        arrivals={hospitalState.arrivals}
        requests={hospitalState.requests}
        onUpdateArrivalStatus={handleUpdateArrivalStatus}
        onProceedToDonation={handleProceedToDonation}
      />
    );
  }

  if (isDonations) {
    return (
      <HospitalDonationsView
        donations={hospitalState.donations}
        arrivals={hospitalState.arrivals}
        requests={hospitalState.requests}
        onRecordDonation={handleRecordDonation}
      />
    );
  }

  if (isTracking) {
    return (
      <HospitalTrackingView
        requests={hospitalState.requests}
        arrivals={hospitalState.arrivals}
        donations={hospitalState.donations}
        onUpdateRequest={handleUpdateRequest}
        onCloseRequest={handleCloseRequest}
      />
    );
  }

  if (isStaff) {
    return (
      <HospitalStaffView
        staff={hospitalState.staff}
        auditLogs={hospitalState.auditLogs}
        onAddStaff={handleAddStaff}
        onUpdateStaffRole={handleUpdateStaffRole}
        onToggleStaffStatus={handleToggleStaffStatus}
        onRemoveStaff={handleRemoveStaff}
      />
    );
  }

  if (isNotifications) {
    return (
      <HospitalNotificationsView
        notifications={hospitalState.notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onDeleteNotification={handleDeleteNotification}
      />
    );
  }

  if (isAnalytics) {
    return (
      <HospitalAnalyticsView
        requests={hospitalState.requests}
        donations={hospitalState.donations}
        donorResponses={hospitalState.donorResponses}
      />
    );
  }

  if (isProfile) {
    return (
      <HospitalProfileView
        profile={hospitalState.profile}
        onUpdateProfile={handleUpdateProfile}
      />
    );
  }

  if (isSettings) {
    return <HospitalSettingsView />;
  }

  // DEFAULT: DASHBOARD OVERVIEW
  return (
    <HospitalOverviewView
      hospitalState={hospitalState}
      onNavigate={handleNavigate}
      onOpenCreateRequest={() => setIsCreateRequestOpen(true)}
      onCreateRequest={handleCreateRequest}
      onCheckInDonor={(arrivalId) =>
        handleUpdateArrivalStatus(
          arrivalId,
          'Arrived',
          new Date().toISOString().replace('T', ' ').substring(0, 16),
          'Checked in at blood bank counter.'
        )
      }
    />
  );
}
