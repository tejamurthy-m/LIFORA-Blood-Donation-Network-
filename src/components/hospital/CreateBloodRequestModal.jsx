import React, { useState } from 'react';
import { PlusCircle, AlertCircle, Building2, Calendar, MapPin } from 'lucide-react';
import Modal from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
const COMPONENT_TYPES = [
  'Whole Blood (450 mL)',
  'Packed Red Blood Cells (PRBC)',
  'Single Donor Platelets (SDP)',
  'Random Donor Platelets (RDP)',
  'Fresh Frozen Plasma (FFP)',
  'Cryoprecipitate',
];

export default function CreateBloodRequestModal({ isOpen, onClose, onCreateRequest }) {
  const { user, staffRole } = useAuth();
  const { addToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: 'O+',
    unitsRequired: 2,
    componentType: 'Packed Red Blood Cells (PRBC)',
    urgency: 'Normal',
    requiredDate: new Date().toISOString().split('T')[0],
    location: 'Emergency OT - Ward 3B',
    patientRef: 'Elective Surgery Pool',
    additionalInstructions: 'Standard cross-match and antibody screening requested.',
    status: 'Active',
  });

  const canManage = staffRole === 'hospital_admin' || staffRole === 'request_manager';

  const resetForm = () => {
    setFormData({
      bloodGroup: 'O+',
      unitsRequired: 2,
      componentType: 'Packed Red Blood Cells (PRBC)',
      urgency: 'Normal',
      requiredDate: new Date().toISOString().split('T')[0],
      location: 'Emergency OT - Ward 3B',
      patientRef: 'Elective Surgery Pool',
      additionalInstructions: 'Standard cross-match and antibody screening requested.',
      status: 'Active',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canManage) {
      addToast({
        title: 'Permission Denied',
        message: 'Only Hospital Admin and Request Manager can publish blood requests.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateRequest(formData);
      onClose();
      resetForm();
      addToast({
        title: 'Blood Request Published',
        message: `${formData.unitsRequired} units of ${formData.bloodGroup} requested for ${formData.location}. Live broadcast activated.`,
        type: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Error',
        message: err.message || 'Could not publish blood request.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Hospital Blood Requirement"
      subtitle="Publish an active requisition to nearby verified donors and hospital network"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Blood Group */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Required Blood Group <span className="text-[#C1123F]">*</span>
            </label>
            <select
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Urgency */}
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

          {/* Date Needed */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Date Needed By <span className="text-[#C1123F]">*</span>
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

        {/* Component Type */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Blood Component Type
          </label>
          <select
            value={formData.componentType}
            onChange={(e) => setFormData({ ...formData, componentType: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-[#172033] bg-white focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
          >
            {COMPONENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Hospital Ward / Location */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Hospital Ward / Delivery Location <span className="text-[#C1123F]">*</span>
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

        {/* Patient Reference */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Patient / Case Reference (Protected)
          </label>
          <input
            type="text"
            value={formData.patientRef}
            onChange={(e) => setFormData({ ...formData, patientRef: e.target.value })}
            placeholder="e.g. PT-9042 (Post-Accident Trauma Surgery)"
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
          />
        </div>

        {/* Additional Instructions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Clinical Instructions & Transfusion Protocols
          </label>
          <textarea
            rows={3}
            value={formData.additionalInstructions}
            onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
            placeholder="Special component specifications, irradiated units, antibody screening directives..."
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Blood Request'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}