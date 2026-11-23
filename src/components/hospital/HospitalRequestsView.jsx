import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  PlusCircle,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MoreVertical,
  Eye,
  Edit,
  X,
  Check,
  Calendar,
  MapPin,
  Building2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';
import ConfirmationDialog from '../common/ConfirmationDialog';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function HospitalRequestsView({
  requests,
  donations,
  arrivals,
  onCreateRequest,
  onUpdateRequest,
  onCloseRequest,
  isCreateOpen,
  setIsCreateOpen,
}) {
  const { user, staffRole } = useAuth();
  const { addToast } = useToast();

  const canManage = staffRole === 'hospital_admin' || staffRole === 'request_manager';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('ALL');

  // Modals state
  const [viewRequest, setViewRequest] = useState(null);
  const [editRequest, setEditRequest] = useState(null);
  const [closeConfirmId, setCloseConfirmId] = useState(null);

  // Form state for Create / Edit
  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    unitsRequired: 2,
    urgency: 'Normal',
    requiredDate: new Date().toISOString().split('T')[0],
    location: 'Emergency OT - Ward 3B',
    patientRef: 'Elective Surgery Pool',
    additionalInstructions: 'Standard cross-match and antibody screening.',
    status: 'Active',
  });

  const resetForm = () => {
    setFormData({
      bloodGroup: 'O+',
      unitsRequired: 2,
      urgency: 'Normal',
      requiredDate: new Date().toISOString().split('T')[0],
      location: 'Emergency OT - Ward 3B',
      patientRef: 'Elective Surgery Pool',
      additionalInstructions: 'Standard cross-match and antibody screening.',
      status: 'Active',
    });
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== 'ALL' && r.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (urgencyFilter !== 'ALL' && r.urgency.toLowerCase() !== urgencyFilter.toLowerCase()) {
        return false;
      }
      if (bloodGroupFilter !== 'ALL' && r.bloodGroup !== bloodGroupFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = r.id.toLowerCase().includes(q) || (r.trackingId || '').toLowerCase().includes(q);
        const matchLoc = r.location.toLowerCase().includes(q);
        const matchPatient = (r.patientRef || '').toLowerCase().includes(q);
        const matchBg = r.bloodGroup.toLowerCase().includes(q);
        if (!matchId && !matchLoc && !matchPatient && !matchBg) return false;
      }
      return true;
    });
  }, [requests, statusFilter, urgencyFilter, bloodGroupFilter, searchQuery]);

  // Handle Create Submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) {
      addToast({
        title: 'Permission Denied',
        message: 'Only Hospital Admin and Request Manager can create blood requests.',
        type: 'error',
      });
      return;
    }

    try {
      await onCreateRequest(formData);
      setIsCreateOpen(false);
      resetForm();
      addToast({
        title: 'Blood Request Published',
        message: `${formData.unitsRequired} units of ${formData.bloodGroup} requested for ${formData.location}.`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not create blood request.', type: 'error' });
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editRequest) return;

    try {
      await onUpdateRequest(editRequest.id, formData);
      setEditRequest(null);
      resetForm();
      addToast({
        title: 'Blood Request Updated',
        message: `Changes saved for ${editRequest.id}.`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not update request.', type: 'error' });
    }
  };

  const handleOpenEdit = (req) => {
    setEditRequest(req);
    setFormData({
      bloodGroup: req.bloodGroup,
      unitsRequired: req.unitsRequired,
      urgency: req.urgency,
      requiredDate: req.requiredDate,
      location: req.location,
      patientRef: req.patientRef || '',
      additionalInstructions: req.additionalInstructions || '',
      status: req.status,
    });
  };

  const handleCloseConfirm = async () => {
    if (!closeConfirmId) return;
    try {
      await onCloseRequest(closeConfirmId);
      setCloseConfirmId(null);
      addToast({
        title: 'Request Closed',
        message: 'Blood requirement closed and archived.',
        type: 'info',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not close request.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
            Hospital Blood Requests
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Create, manage and dispatch clinical blood requisitions across hospital departments
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Blood Request</span>
          </button>
        )}
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search request ID, location, or patient ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Blood group */}
          <div className="md:col-span-3">
            <select
              value={bloodGroupFilter}
              onChange={(e) => setBloodGroupFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            >
              <option value="ALL">All Blood Groups</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Urgency */}
          <div className="md:col-span-2">
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            >
              <option value="ALL">All Urgencies</option>
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Partially Fulfilled">Partially Fulfilled</option>
              <option value="Fulfilled">Fulfilled</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Quick status tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          {[
            { key: 'ALL', label: 'All Requests' },
            { key: 'Active', label: 'Active' },
            { key: 'Partially Fulfilled', label: 'Partially Fulfilled' },
            { key: 'Fulfilled', label: 'Fulfilled' },
            { key: 'Draft', label: 'Draft' },
            { key: 'Closed', label: 'Closed' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.key
                  ? 'bg-[#172033] text-white shadow-sm'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* REQUESTS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#172033]">Hospital Requisitions</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {filteredRequests.length} of {requests.length}
            </span>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#172033]">No Blood Requests Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hospital requests match your search or filter settings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRequests.map((req) => {
              // Calculate successful donations for this request
              const donCount = donations
                .filter((d) => d.requestId === req.id && d.outcome === 'Donated')
                .reduce((sum, d) => sum + (d.unitsCollected || 1), 0);
              const pct = Math.min(100, Math.round((donCount / req.unitsRequired) * 100));

              return (
                <div
                  key={req.id}
                  className="p-5 sm:p-6 transition-colors hover:bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  {/* Left: Blood Group + Details */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#C1123F] text-white flex flex-col items-center justify-center font-extrabold text-sm shadow-sm flex-shrink-0">
                      <span>{req.bloodGroup}</span>
                      <span className="text-[9px] font-normal uppercase opacity-80">Blood</span>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-[#172033]">
                          {req.id}
                        </span>
                        <StatusBadge status={req.urgency} type="urgency" size="sm" />
                        <StatusBadge status={req.status} size="sm" />
                        <span className="text-xs text-slate-400 font-mono">
                          Ref: {req.trackingId}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.location}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Needed: {req.requiredDate}</span>
                        </span>
                        <span>•</span>
                        <span>Patient Ref: {req.patientRef || 'Clinical Requisition'}</span>
                      </div>

                      {/* Fulfillment Progress Bar */}
                      <div className="w-full max-w-md pt-1 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">
                            {donCount} of {req.unitsRequired} Units Collected
                          </span>
                          <span className="font-bold text-slate-500">{pct}% Complete</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 100 ? 'bg-[#16A36A]' : pct > 0 ? 'bg-[#C1123F]' : 'bg-slate-300'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 self-start lg:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewRequest(req)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>

                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(req)}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#C1123F] font-bold text-xs transition-colors flex items-center gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {req.status !== 'Closed' && (
                          <button
                            type="button"
                            onClick={() => setCloseConfirmId(req.id)}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-[#C1123F] text-slate-600 font-bold text-xs transition-colors"
                          >
                            Close
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Create Hospital Blood Request"
          subtitle="Publish a clinical blood requirement to the LIFORA donor dispatch grid"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Blood Group <span className="text-[#C1123F]">*</span>
                </label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
                >
                  {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Quantity Required (Units) <span className="text-[#C1123F]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={formData.unitsRequired}
                  onChange={(e) => setFormData({ ...formData, unitsRequired: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Urgency Level <span className="text-[#C1123F]">*</span>
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
                >
                  <option value="Normal">Normal (Elective Procedure)</option>
                  <option value="Urgent">Urgent (Within 24 Hours)</option>
                  <option value="Emergency">Emergency (Immediate Transfusion)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date Needed <span className="text-[#C1123F]">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.requiredDate}
                  onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hospital Ward / Location <span className="text-[#C1123F]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Emergency OT - Ward 3B or Cardiac ICU"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Patient / Case Reference
              </label>
              <input
                type="text"
                value={formData.patientRef}
                onChange={(e) => setFormData({ ...formData, patientRef: e.target.value })}
                placeholder="e.g. PT-9042 (Post-Accident Trauma Surgery)"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Instructions
              </label>
              <textarea
                rows={3}
                value={formData.additionalInstructions}
                onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                placeholder="Special blood component specifications or cross-match directives..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish Blood Request</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editRequest && (
        <Modal
          isOpen={!!editRequest}
          onClose={() => setEditRequest(null)}
          title={`Edit Blood Request: ${editRequest.id}`}
          subtitle="Update requirement parameters or request status"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
                >
                  {['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Required Units</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.unitsRequired}
                  onChange={(e) => setFormData({ ...formData, unitsRequired: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Urgency</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Request Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Partially Fulfilled">Partially Fulfilled</option>
                  <option value="Fulfilled">Fulfilled</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ward / Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Instructions</label>
              <textarea
                rows={3}
                value={formData.additionalInstructions}
                onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditRequest(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewRequest && (
        <Modal
          isOpen={!!viewRequest}
          onClose={() => setViewRequest(null)}
          title={`Requisition Details: ${viewRequest.id}`}
          subtitle={`Hospital Reference ${viewRequest.trackingId}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#C1123F] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
                  {viewRequest.bloodGroup}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#172033]">{viewRequest.id}</span>
                    <StatusBadge status={viewRequest.urgency} type="urgency" size="sm" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{viewRequest.location}</p>
                </div>
              </div>
              <StatusBadge status={viewRequest.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Required Units</span>
                <span className="text-sm font-black text-[#172033]">{viewRequest.unitsRequired} Units</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Target Date</span>
                <span className="text-sm font-black text-[#172033]">{viewRequest.requiredDate}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <div className="font-bold text-[#172033]">Case Directive / Patient Reference:</div>
              <p className="text-slate-600">{viewRequest.patientRef || 'Clinical Requisition'}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
              <div className="font-bold text-[#172033]">Special Clinical Instructions:</div>
              <p className="text-slate-600 leading-relaxed">
                {viewRequest.additionalInstructions || 'Standard cross-match requested.'}
              </p>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2">
              <span>Created by: {viewRequest.createdBy || 'Hospital Operations'}</span>
              <span>{viewRequest.createdAt}</span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewRequest(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM CLOSE DIALOG */}
      <ConfirmationDialog
        isOpen={!!closeConfirmId}
        onClose={() => setCloseConfirmId(null)}
        onConfirm={handleCloseConfirm}
        title="Close Blood Request"
        message="Are you sure you want to close this blood request? Any remaining uncollected units will no longer be broadcast to donors."
        confirmText="Close Request"
        type="warning"
      />
    </div>
  );
}
