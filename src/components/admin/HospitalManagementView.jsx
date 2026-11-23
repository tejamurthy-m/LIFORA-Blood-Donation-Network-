import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  MoreVertical,
  Eye,
  Edit,
  Check,
  X,
  Power,
  Trash2,
  MapPin,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';
import ConfirmationDialog from '../common/ConfirmationDialog';
import StatusBadge from '../common/StatusBadge';
import { useToast } from '../../context/ToastContext';
import { hospitalService, getStoredHospitals } from '../../services/hospitalService';

const STATUS_FILTERS = ['All', 'Verified', 'Pending', 'Rejected', 'Inactive'];

export default function HospitalManagementView() {
  const { addToast } = useToast();

  const [hospitals, setHospitals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [detailsModalHospital, setDetailsModalHospital] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalHospital, setEditModalHospital] = useState(null);

  // Confirmation Dialog State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'danger',
    onConfirm: null,
  });

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    address: '',
    city: 'Mumbai',
    contactPhone: '',
    contactEmail: '',
    bedCapacity: 250,
    headName: '',
    headPhone: '',
    headEmail: '',
    headQualification: 'MD (Transfusion Medicine)',
    facilities: 'Whole Blood, Packed Red Cells, Platelets',
    emergencyTieUp: true,
    notes: '',
  });

  const loadHospitals = () => {
    setHospitals(getStoredHospitals());
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  // Summary Metrics calculations
  const totalHospitals = hospitals.length;
  const verifiedCount = hospitals.filter((h) => h.status === 'Verified').length;
  const pendingCount = hospitals.filter((h) => h.status === 'Pending').length;
  const inactiveCount = hospitals.filter((h) => h.status === 'Inactive').length;

  // Filtered List
  const filteredHospitals = hospitals.filter((h) => {
    const matchesStatus =
      statusFilter === 'All' || h.status.toLowerCase() === statusFilter.toLowerCase();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      h.name.toLowerCase().includes(q) ||
      h.city.toLowerCase().includes(q) ||
      h.licenseNumber.toLowerCase().includes(q) ||
      (h.bloodBankHead?.name && h.bloodBankHead.name.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // Approve Hospital Handler with Confirmation Dialog
  const triggerApprove = (hospital) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Approve Hospital Accreditation',
      message: `Are you sure you want to approve "${hospital.name}" (${hospital.licenseNumber}) as an accredited blood bank? This enables live emergency dispatch.`,
      confirmText: 'Approve Accreditation',
      type: 'success',
      onConfirm: async () => {
        try {
          await hospitalService.approveHospital(hospital.id);
          loadHospitals();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          addToast({
            title: 'Hospital Approved',
            message: `${hospital.name} is now a Verified Partner in the network.`,
            type: 'success',
          });
        } catch {
          addToast({ title: 'Error', message: 'Could not approve hospital.', type: 'error' });
        }
      },
    });
  };

  // Reject Hospital Handler with Confirmation Dialog
  const triggerReject = (hospital) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Reject Registration',
      message: `Are you sure you want to reject registration for "${hospital.name}"? The facility will be marked as Rejected.`,
      confirmText: 'Reject Registration',
      type: 'danger',
      onConfirm: async () => {
        try {
          await hospitalService.rejectHospital(hospital.id, 'License validation failed or incomplete facility records.');
          loadHospitals();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          addToast({
            title: 'Registration Rejected',
            message: `${hospital.name} registration marked as Rejected.`,
            type: 'info',
          });
        } catch {
          addToast({ title: 'Error', message: 'Could not reject registration.', type: 'error' });
        }
      },
    });
  };

  // Toggle Active/Inactive Status Handler with Confirmation Dialog
  const triggerToggleStatus = (hospital) => {
    const isCurrentlyInactive = hospital.status === 'Inactive';
    setConfirmConfig({
      isOpen: true,
      title: isCurrentlyInactive ? 'Reactivate Hospital Listing' : 'Deactivate Hospital Listing',
      message: isCurrentlyInactive
        ? `Reactivate "${hospital.name}" to resume receiving patient blood requisitions?`
        : `Are you sure you want to deactivate "${hospital.name}"? The hospital will be paused from the emergency dispatch network.`,
      confirmText: isCurrentlyInactive ? 'Reactivate' : 'Deactivate',
      type: isCurrentlyInactive ? 'success' : 'warning',
      onConfirm: async () => {
        try {
          await hospitalService.toggleHospitalStatus(hospital.id);
          loadHospitals();
          setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          addToast({
            title: isCurrentlyInactive ? 'Hospital Reactivated' : 'Hospital Deactivated',
            message: `${hospital.name} listing updated.`,
            type: 'info',
          });
        } catch {
          addToast({ title: 'Error', message: 'Could not update status.', type: 'error' });
        }
      },
    });
  };

  // Open Edit Modal
  const openEditModal = (hospital) => {
    setFormData({
      name: hospital.name,
      licenseNumber: hospital.licenseNumber,
      address: hospital.address,
      city: hospital.city,
      contactPhone: hospital.contactPhone,
      contactEmail: hospital.contactEmail,
      bedCapacity: hospital.bedCapacity,
      headName: hospital.bloodBankHead?.name || '',
      headPhone: hospital.bloodBankHead?.phone || '',
      headEmail: hospital.bloodBankHead?.email || '',
      headQualification: hospital.bloodBankHead?.qualification || '',
      facilities: Array.isArray(hospital.facilities) ? hospital.facilities.join(', ') : '',
      emergencyTieUp: !!hospital.emergencyTieUp,
      notes: hospital.notes || '',
    });
    setEditModalHospital(hospital);
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      name: '',
      licenseNumber: '',
      address: '',
      city: 'Mumbai',
      contactPhone: '',
      contactEmail: '',
      bedCapacity: 200,
      headName: '',
      headPhone: '',
      headEmail: '',
      headQualification: 'MD (Transfusion Medicine)',
      facilities: 'Whole Blood, Packed Red Cells, Platelets, Fresh Frozen Plasma',
      emergencyTieUp: true,
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  // Save Add Form
  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.licenseNumber.trim() || !formData.address.trim()) {
      addToast({ title: 'Validation Error', message: 'Fill in all mandatory hospital fields.', type: 'error' });
      return;
    }

    try {
      const facilitiesList = formData.facilities
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      await hospitalService.addHospital({
        ...formData,
        facilities: facilitiesList,
      });

      loadHospitals();
      setIsAddModalOpen(false);
      addToast({
        title: 'Hospital Registered',
        message: `${formData.name} added to platform pending verification queue.`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not add hospital.', type: 'error' });
    }
  };

  // Save Edit Form
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModalHospital) return;

    try {
      const facilitiesList = typeof formData.facilities === 'string'
        ? formData.facilities.split(',').map((f) => f.trim()).filter(Boolean)
        : formData.facilities;

      await hospitalService.updateHospital(editModalHospital.id, {
        name: formData.name,
        licenseNumber: formData.licenseNumber,
        address: formData.address,
        city: formData.city,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        bedCapacity: Number(formData.bedCapacity),
        bloodBankHead: {
          name: formData.headName,
          phone: formData.headPhone,
          email: formData.headEmail,
          qualification: formData.headQualification,
        },
        facilities: facilitiesList,
        emergencyTieUp: formData.emergencyTieUp,
        notes: formData.notes,
      });

      loadHospitals();
      setEditModalHospital(null);
      addToast({
        title: 'Hospital Updated',
        message: `${formData.name} details saved.`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not save updates.', type: 'error' });
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#C1123F] text-xs font-bold border border-rose-200 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Accredited Healthcare Facilities</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#172033] tracking-tight">
            Hospital & Blood Bank Management
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Review licenses, approve hospital tie-ups, inspect transfusion heads, and maintain active clinical partners.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-2xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold shadow-md shadow-[#C1123F]/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Hospital</span>
        </button>
      </div>

      {/* 1. Summary Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Hospitals"
          value={totalHospitals}
          subtitle="Registered clinical partners"
          icon={Building2}
          colorScheme="slate"
        />
        <StatCard
          title="Verified Hospitals"
          value={verifiedCount}
          subtitle="Active on emergency grid"
          icon={ShieldCheck}
          colorScheme="emerald"
        />
        <StatCard
          title="Pending Verification"
          value={pendingCount}
          subtitle="License inspection required"
          icon={Clock}
          colorScheme="amber"
        />
        <StatCard
          title="Inactive Hospitals"
          value={inactiveCount}
          subtitle="Paused or under repair"
          icon={Power}
          colorScheme="crimson"
        />
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Filter Tabs & Search Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Status Filter Tabs (All, Verified, Pending, Rejected, Inactive) */}
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((status) => {
              const isActive = statusFilter === status;
              const count =
                status === 'All'
                  ? hospitals.length
                  : hospitals.filter((h) => h.status.toLowerCase() === status.toLowerCase()).length;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-rose-50 text-[#C1123F] ring-1 ring-[#C1123F]/30'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{status}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-[#C1123F] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search by Name, City, License Number */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, city, or license #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
            />
          </div>
        </div>

        {/* 5. Hospital Table with Actions */}
        <div className="overflow-x-auto">
          {filteredHospitals.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-3xl">
              <Building2 className="w-10 h-10 mx-auto text-slate-300" />
              <h4 className="font-bold text-base text-[#172033]">No Hospitals Found</h4>
              <p className="text-xs text-[#64748B]">
                No facilities match the chosen status and search filters.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Hospital Name</th>
                  <th className="px-6 py-3.5">License & City</th>
                  <th className="px-6 py-3.5">Capacity & Head</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredHospitals.map((h) => {
                  const isPending = h.status === 'Pending';
                  const isVerified = h.status === 'Verified';
                  const isInactive = h.status === 'Inactive';
                  const isRejected = h.status === 'Rejected';

                  return (
                    <tr key={h.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Address */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-sm text-[#172033]">{h.name}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {h.address}
                        </div>
                      </td>

                      {/* License & City */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-[#C1123F] font-bold text-xs">
                          {h.licenseNumber}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {h.city}, {h.state || 'India'}
                        </div>
                      </td>

                      {/* Capacity & Head */}
                      <td className="px-6 py-4">
                        <div className="text-[#172033] font-semibold">{h.bedCapacity} Beds</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Head: {h.bloodBankHead?.name || 'Assigned Officer'}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        {isVerified && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-[#16A36A] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
                            Verified Partner
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending Review
                          </span>
                        )}
                        {isInactive && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Rejected
                          </span>
                        )}
                      </td>

                      {/* Row Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. View Details */}
                          <button
                            type="button"
                            onClick={() => setDetailsModalHospital(h)}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="View Hospital Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* 2. Edit */}
                          <button
                            type="button"
                            onClick={() => openEditModal(h)}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Edit Hospital Info"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* 3. Pending Actions: Approve & Reject */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => triggerApprove(h)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-[#16A36A] hover:bg-emerald-100 font-bold text-xs border border-emerald-200 flex items-center gap-1 transition-colors"
                                title="Approve Registration"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => triggerReject(h)}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 flex items-center gap-1 transition-colors"
                                title="Reject Registration"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {/* 4. Verified/Inactive Actions: Toggle Active/Inactive */}
                          {(isVerified || isInactive) && (
                            <button
                              type="button"
                              onClick={() => triggerToggleStatus(h)}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-xs border transition-colors flex items-center gap-1 ${
                                isInactive
                                  ? 'bg-emerald-50 text-[#16A36A] border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-600'
                              }`}
                              title={isInactive ? 'Reactivate Hospital' : 'Deactivate Listing'}
                            >
                              <Power className="w-3.5 h-3.5" />
                              <span>{isInactive ? 'Activate' : 'Deactivate'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 6. HOSPITAL DETAILS MODAL */}
      {detailsModalHospital && (
        <Modal
          isOpen={!!detailsModalHospital}
          onClose={() => setDetailsModalHospital(null)}
          title={detailsModalHospital.name}
          subtitle={`License ID: ${detailsModalHospital.licenseNumber} • ${detailsModalHospital.city}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-[#172033]">Verification Status:</span>
                <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border">
                  {detailsModalHospital.status}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Registered: {detailsModalHospital.registeredAt || '2024'}
              </span>
            </div>

            {/* Address & Contact Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="font-bold text-[#172033] block">Address & Physical Location</span>
                <div className="text-slate-600">{detailsModalHospital.address}</div>
                <div className="text-slate-500 font-medium">
                  {detailsModalHospital.city}, {detailsModalHospital.state || 'India'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="font-bold text-[#172033] block">Official Hospital Contact</span>
                <div className="text-slate-600">Phone: {detailsModalHospital.contactPhone}</div>
                <div className="text-slate-600">Email: {detailsModalHospital.contactEmail}</div>
                <div className="text-slate-700 font-bold mt-1">
                  Bed Capacity: {detailsModalHospital.bedCapacity} Inpatient Beds
                </div>
              </div>
            </div>

            {/* Blood Bank Head Details */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C1123F]" />
                <span className="font-bold text-[#172033]">Blood Bank Head & Medical Officer</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Officer Name:</span>
                  <span className="font-bold text-[#172033]">
                    {detailsModalHospital.bloodBankHead?.name || 'Dr. Assigned In-Charge'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Qualification:</span>
                  <span>{detailsModalHospital.bloodBankHead?.qualification || 'MD (Transfusion Medicine)'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Direct Line:</span>
                  <span>{detailsModalHospital.bloodBankHead?.phone || detailsModalHospital.contactPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Direct Email:</span>
                  <span>{detailsModalHospital.bloodBankHead?.email || detailsModalHospital.contactEmail}</span>
                </div>
              </div>
            </div>

            {/* Facilities / Blood Components */}
            <div>
              <span className="text-xs font-bold text-[#172033] block mb-2">
                Certified Blood Component Facilities:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(detailsModalHospital.facilities) &&
                  detailsModalHospital.facilities.map((fac) => (
                    <span
                      key={fac}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200"
                    >
                      {fac}
                    </span>
                  ))}
              </div>
            </div>

            {/* Notes */}
            {detailsModalHospital.notes && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-700">Accreditation Notes: </span>
                {detailsModalHospital.notes}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailsModalHospital(null)}
                className="px-5 py-2.5 rounded-xl bg-[#172033] text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. ADD HOSPITAL MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Hospital & Blood Bank Facility"
        subtitle="Register an accredited transfusion centre into the LIFORA network"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Hospital Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Fortis Memorial Research Institute"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                License Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BB-LIC-DL-990"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Full Physical Address *
              </label>
              <input
                type="text"
                required
                placeholder="Street, Sector, Landmark"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">Contact Phone *</label>
              <input
                type="tel"
                required
                placeholder="+91 22 2675 1000"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">Contact Email *</label>
              <input
                type="email"
                required
                placeholder="bloodbank@hospital.org"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">Bed Capacity *</label>
              <input
                type="number"
                required
                min="10"
                value={formData.bedCapacity}
                onChange={(e) => setFormData({ ...formData, bedCapacity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Blood Bank Head Details */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-[#172033] block">
              Blood Bank Head / Chief Medical Officer
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Head Officer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh Gupta"
                  value={formData.headName}
                  onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. MD (Immunohematology)"
                  value={formData.headQualification}
                  onChange={(e) => setFormData({ ...formData, headQualification: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172033] mb-1">
              Component Separation Facilities (Comma Separated)
            </label>
            <input
              type="text"
              placeholder="Whole Blood, Packed Red Cells, Platelets, Cryoprecipitate"
              value={formData.facilities}
              onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold shadow-sm shadow-[#C1123F]/20 flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Hospital</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT HOSPITAL MODAL */}
      {editModalHospital && (
        <Modal
          isOpen={!!editModalHospital}
          onClose={() => setEditModalHospital(null)}
          title={`Edit ${editModalHospital.name}`}
          subtitle={`License ID: ${editModalHospital.licenseNumber}`}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  License Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">Bed Capacity</label>
                <input
                  type="number"
                  value={formData.bedCapacity}
                  onChange={(e) => setFormData({ ...formData, bedCapacity: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Blood Bank Head */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-[#172033] block">Blood Bank Head Officer</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Officer Name"
                  value={formData.headName}
                  onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                />
                <input
                  type="text"
                  placeholder="Qualification"
                  value={formData.headQualification}
                  onChange={(e) => setFormData({ ...formData, headQualification: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditModalHospital(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* 9. REUSABLE CONFIRMATION DIALOG */}
      <ConfirmationDialog
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        type={confirmConfig.type}
      />
    </div>
  );
}
