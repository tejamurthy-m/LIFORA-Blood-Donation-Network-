import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Search,
  PlusCircle,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Building2,
  Lock,
  Edit,
  Power,
  Trash2,
  Terminal,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import StatCard from '../common/StatCard';
import Modal from '../common/Modal';
import ConfirmationDialog from '../common/ConfirmationDialog';
import StatusBadge from '../common/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { STAFF_ROLES } from '../../services/hospitalPortalService';

export default function HospitalStaffView({
  staff,
  auditLogs,
  onAddStaff,
  onUpdateStaffRole,
  onToggleStaffStatus,
  onRemoveStaff,
}) {
  const { user, staffRole } = useAuth();
  const { addToast } = useToast();

  const isHospitalAdmin = staffRole === 'hospital_admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Add / Invite staff modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'donor_coordinator',
    department: 'Blood Bank Coordination',
    phone: '',
  });

  // Edit role modal
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedRole, setSelectedRole] = useState('donor_coordinator');

  // Toggle status confirm
  const [statusToggleStaff, setStatusToggleStaff] = useState(null);

  // Remove staff confirm
  const [staffToRemove, setStaffToRemove] = useState(null);

  // Summary counts
  const summary = useMemo(() => {
    const total = staff.length;
    const active = staff.filter((s) => s.status === 'active').length;
    const admins = staff.filter((s) => s.role === 'hospital_admin').length;
    const medical = staff.filter((s) => s.role === 'medical_staff').length;
    return { total, active, admins, medical };
  }, [staff]);

  // Filtered staff
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (roleFilter !== 'ALL' && s.role !== roleFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(q);
        const matchEmail = s.email.toLowerCase().includes(q);
        const matchDept = (s.department || '').toLowerCase().includes(q);
        const matchRole = (s.roleLabel || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchDept && !matchRole) return false;
      }
      return true;
    });
  }, [staff, roleFilter, searchQuery]);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!isHospitalAdmin) {
      addToast({
        title: 'Admin Only',
        message: 'Only Hospital Admin can invite and onboard new staff members.',
        type: 'error',
      });
      return;
    }

    try {
      await onAddStaff(formData);
      setIsInviteOpen(false);
      setFormData({
        name: '',
        email: '',
        role: 'donor_coordinator',
        department: 'Blood Bank Coordination',
        phone: '',
      });
      addToast({
        title: 'Staff Invited',
        message: `${formData.name} added as ${STAFF_ROLES[formData.role]?.label}. Credentials dispatched.`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not invite staff member.', type: 'error' });
    }
  };

  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      await onUpdateStaffRole(editingStaff.id, selectedRole);
      setEditingStaff(null);
      addToast({
        title: 'Role Updated',
        message: `${editingStaff.name} reassigned to ${STAFF_ROLES[selectedRole]?.label}.`,
        type: 'success',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not update staff role.', type: 'error' });
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusToggleStaff) return;
    try {
      const newStatus = await onToggleStaffStatus(statusToggleStaff.id);
      setStatusToggleStaff(null);
      addToast({
        title: `Account ${newStatus === 'active' ? 'Activated' : 'Deactivated'}`,
        message: `${statusToggleStaff.name}'s account is now ${newStatus}.`,
        type: 'info',
      });
    } catch {
      addToast({ title: 'Error', message: 'Could not toggle account status.', type: 'error' });
    }
  };

  const handleRemoveClick = (member) => {
    if (
      member.id === user?.id ||
      (member.email && user?.email && member.email.toLowerCase() === user.email.toLowerCase())
    ) {
      addToast({
        title: 'Action Restricted',
        message: 'You cannot remove your own active administrator account.',
        type: 'error',
      });
      return;
    }
    setStaffToRemove(member);
  };

  const handleConfirmRemoveStaff = async () => {
    if (!staffToRemove) return;
    try {
      await onRemoveStaff(staffToRemove.id);
      addToast({
        title: 'Staff Member Removed',
        message: `${staffToRemove.name} (${staffToRemove.roleLabel || 'Staff'}) has been removed from the hospital team.`,
        type: 'success',
      });
      setStaffToRemove(null);
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not remove staff member.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & ARCHITECTURE EXPLANATION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight">
            Hospital Staff & Role-Based Access Control
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            One shared Hospital Portal with individual staff logins and role-enforced module permissions
          </p>
        </div>

        {isHospitalAdmin && (
          <button
            type="button"
            onClick={() => setIsInviteOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Invite New Staff</span>
          </button>
        )}
      </div>

      {/* RBAC ROLES MATRIX BANNER */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">Configured Hospital Staff Roles:</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(STAFF_ROLES).map(([key, config]) => (
            <div key={key} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <span className="font-bold text-xs text-[#F04462] block">{config.label}</span>
              <p className="text-[11px] text-slate-300 leading-snug">{config.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Staff"
          value={summary.total}
          icon={Users}
          colorScheme="slate"
          subtitle="Hospital team accounts"
        />
        <StatCard
          title="Active Accounts"
          value={summary.active}
          icon={CheckCircle2}
          colorScheme="emerald"
          subtitle="Authorized users"
        />
        <StatCard
          title="Hospital Admins"
          value={summary.admins}
          icon={ShieldCheck}
          colorScheme="crimson"
          subtitle="Full operational access"
        />
        <StatCard
          title="Medical Personnel"
          value={summary.medical}
          icon={UserCheck}
          colorScheme="blue"
          subtitle="Authorized clinical staff"
        />
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff name, email, department, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            >
              <option value="ALL">All Staff Roles</option>
              {Object.entries(STAFF_ROLES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STAFF LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#172033]">Hospital Staff Directory</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {filteredStaff.length} Members
            </span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredStaff.map((member) => {
            const isActive = member.status === 'active';
            const isCurrentUser = user?.email?.toLowerCase() === member.email.toLowerCase();

            return (
              <div
                key={member.id}
                className="p-5 sm:p-6 transition-colors hover:bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#C1123F] font-bold flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                    {member.name.charAt(0)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm sm:text-base text-[#172033]">
                        {member.name}
                      </span>
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-[#C1123F]">
                          You (Current)
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {member.roleLabel || STAFF_ROLES[member.role]?.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.email}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{member.phone}</span>
                      </span>
                      <span>•</span>
                      <span>{member.department}</span>
                    </div>

                    <p className="text-[11px] text-slate-400">
                      Joined {member.joinedDate} • Last active {member.lastActive}
                    </p>
                  </div>
                </div>

                {/* Actions (Hospital Admin Only) */}
                {isHospitalAdmin && (
                  <div className="flex items-center gap-2 self-start lg:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStaff(member);
                        setSelectedRole(member.role);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Change Role</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatusToggleStaff(member)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveClick(member)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#C1123F] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-200/60"
                      title={`Remove ${member.name} from hospital team`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#C1123F]" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AUDIT LOG SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-slate-500" />
          <h3 className="font-bold text-sm text-[#172033]">Hospital Operations Audit Trail</h3>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {auditLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-[#172033]">{log.action}</span>
                <span className="text-slate-400 block text-[11px] mt-0.5">
                  By {log.actor} • Ref: {log.target}
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px] flex-shrink-0">{log.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* INVITE STAFF MODAL */}
      {isInviteOpen && (
        <Modal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          title="Invite Hospital Staff Member"
          subtitle="Add an authorized team member to Lilavati Hospital's portal"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleInviteSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Full Name <span className="text-[#C1123F]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. Ramesh Gupta"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hospital Email Address <span className="text-[#C1123F]">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@lilavati.org"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Staff Role <span className="text-[#C1123F]">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              >
                {Object.entries(STAFF_ROLES).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. ICU / Blood Bank"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98200 00000"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all shadow-sm"
              >
                Create Staff Account
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT ROLE MODAL */}
      {editingStaff && (
        <Modal
          isOpen={!!editingStaff}
          onClose={() => setEditingStaff(null)}
          title={`Assign Staff Role: ${editingStaff.name}`}
          subtitle="Change permissions for this hospital account"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSaveRole} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select New Role <span className="text-[#C1123F]">*</span>
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
              >
                {Object.entries(STAFF_ROLES).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
              <strong>Role Capabilities:</strong> {STAFF_ROLES[selectedRole]?.description}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all shadow-sm"
              >
                Save Role Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* STATUS TOGGLE CONFIRM DIALOG */}
      <ConfirmationDialog
        isOpen={!!statusToggleStaff}
        onClose={() => setStatusToggleStaff(null)}
        onConfirm={handleConfirmToggleStatus}
        title={statusToggleStaff?.status === 'active' ? 'Deactivate Staff Account' : 'Reactivate Staff Account'}
        message={`Are you sure you want to ${statusToggleStaff?.status === 'active' ? 'deactivate' : 'reactivate'} ${statusToggleStaff?.name}'s account?`}
        confirmText={statusToggleStaff?.status === 'active' ? 'Deactivate' : 'Reactivate'}
        type={statusToggleStaff?.status === 'active' ? 'danger' : 'info'}
      />

      {/* REMOVE STAFF CONFIRM DIALOG */}
      <ConfirmationDialog
        isOpen={!!staffToRemove}
        onClose={() => setStaffToRemove(null)}
        onConfirm={handleConfirmRemoveStaff}
        title="Remove Hospital Staff Member"
        message={`Are you sure you want to permanently remove ${staffToRemove?.name} (${staffToRemove?.roleLabel || 'Staff'}) from your hospital team? Their portal access and assigned permissions will be immediately revoked.`}
        confirmText="Remove Staff"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
