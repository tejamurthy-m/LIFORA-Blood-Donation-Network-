import React, { useState } from 'react';
import {
  Settings,
  Radio,
  Bell,
  ShieldCheck,
  Save,
  Download,
  Database,
  Smartphone,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function HospitalSettingsView() {
  const { user, staffRole } = useAuth();
  const { addToast } = useToast();

  const isHospitalAdmin = staffRole === 'hospital_admin';

  const [broadcastRadius, setBroadcastRadius] = useState(15);
  const [smsGateway, setSmsGateway] = useState(true);
  const [autoNotifyDonors, setAutoNotifyDonors] = useState(true);
  const [emergencySiren, setEmergencySiren] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    addToast({
      title: 'Settings Saved',
      message: 'Hospital dispatch parameters and communication thresholds updated.',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#172033]">
            Hospital Operational & Dispatch Settings
          </h2>
          <p className="text-xs text-slate-500">
            Configure automated donor radius broadcasts, telephony dispatch gateways, and emergency protocol alerts
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Dispatch Radius */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-[#172033] block">
                  Voluntary Donor Broadcast Search Radius
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Geographic distance around Lilavati Hospital where registered donors receive emergency match alerts
                </p>
              </div>
              <span className="text-sm font-black text-[#C1123F] px-3 py-1 bg-rose-50 border border-rose-200 rounded-xl">
                {broadcastRadius} km
              </span>
            </div>

            <input
              type="range"
              min="5"
              max="40"
              step="5"
              disabled={!isHospitalAdmin}
              value={broadcastRadius}
              onChange={(e) => setBroadcastRadius(Number(e.target.value))}
              className="w-full accent-[#C1123F] cursor-pointer disabled:opacity-50"
            />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#172033]">SMS & WhatsApp Dispatch Gateway</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Two-way telecom delivery verification (Active)
                </div>
              </div>
              <button
                type="button"
                disabled={!isHospitalAdmin}
                onClick={() => setSmsGateway(!smsGateway)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  smsGateway ? 'bg-[#16A36A]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    smsGateway ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#172033]">Auto-Broadcast Urgent Requests</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Instantly ping matching donors when urgency is Emergency
                </div>
              </div>
              <button
                type="button"
                disabled={!isHospitalAdmin}
                onClick={() => setAutoNotifyDonors(!autoNotifyDonors)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  autoNotifyDonors ? 'bg-[#16A36A]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    autoNotifyDonors ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Database & Backup Operations */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-600" />
                <span>Hemovigilance & Transfusion Audit Snapshots</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Encrypted daily backups stored in compliance with National Blood Transfusion Council norms
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                addToast({
                  title: 'Backup Downloaded',
                  message: 'Encrypted hospital transfusion snapshot downloaded.',
                  type: 'success',
                })
              }
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors self-start sm:self-auto flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Snapshot</span>
            </button>
          </div>

          {isHospitalAdmin && (
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-[#C1123F] text-white text-xs font-bold hover:bg-[#9E0E32] transition-colors flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Dispatch Settings</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
