import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Bell,
  ChevronRight,
  ChevronDown,
  User,
  Settings,
  KeyRound,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Radio,
  Building2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Sidebar from '../components/common/Sidebar';
import NotificationPanel from '../components/common/NotificationPanel';
import ChangePasswordModal from '../components/common/ChangePasswordModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { donorService } from '../services/donorService';
import { STAFF_ROLES } from '../services/hospitalPortalService';

export default function DashboardLayout({ title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [staffSwitcherOpen, setStaffSwitcherOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);

  const { user, role, staffRole, updateProfile, switchDemoRole, switchStaffRole, logout } = useAuth();
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const handleToggleAvailability = async () => {
    if (!user) return;
    const newStatus = !user.isAvailable;
    try {
      await updateProfile({ isAvailable: newStatus });
      await donorService.updateAvailability(user.id, newStatus);
      addToast({
        title: newStatus ? 'Status: Active for Donation' : 'Status: Paused',
        message: newStatus
          ? 'You are now discoverable to nearby patients and emergency requests.'
          : 'You will not receive new blood donation requests until re-enabled.',
        type: newStatus ? 'success' : 'info',
      });
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not update availability status.',
        type: 'error',
      });
    }
  };

  const handleSwitchRole = (newRole) => {
    const switched = switchDemoRole(newRole);
    setRoleSwitcherOpen(false);
    addToast({
      title: `Demo Persona: ${newRole.toUpperCase()}`,
      message: `Active session changed to ${switched?.name || newRole}. Switching workspace...`,
      type: 'success',
    });
    if (newRole === 'hospital') {
      navigate('/hospital/dashboard');
    } else {
      navigate(`/${newRole}/dashboard`);
    }
  };

  const handleStaffRoleSelect = (targetStaffRole) => {
    const updated = switchStaffRole(targetStaffRole);
    setStaffSwitcherOpen(false);
    addToast({
      title: `Staff Switched: ${STAFF_ROLES[targetStaffRole]?.label}`,
      message: `Operating as ${updated?.name || 'Staff'}. Permissions and module views updated.`,
      type: 'info',
    });
  };

  const handleLogout = () => {
    logout();
    addToast({
      title: 'Signed Out',
      message: 'You have been signed out successfully.',
      type: 'info',
    });
    navigate('/');
  };

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path.includes('/profile')) return role === 'hospital' ? 'Hospital Profile & Accreditation' : 'My Profile & Medical ID';
    if (path.includes('/settings')) return 'Account & Platform Settings';
    if (path.includes('/notifications')) return role === 'hospital' ? 'Hospital Notifications Centre' : 'Notifications & Alerts';
    if (path.includes('/availability')) return 'Donor Availability Status';
    if (path.includes('/accepted')) return 'My Accepted Requests';
    if (path.includes('/requests')) return role === 'hospital' ? 'Blood Request Management' : role === 'donor' ? 'Incoming Blood Requests' : 'My Blood Requisitions';
    if (path.includes('/donors')) return role === 'hospital' ? 'Donor Management' : 'Verified Donor Registry';
    if (path.includes('/arrivals')) return 'Donor Arrival Management';
    if (path.includes('/donations')) return 'Donation Management & Clinical Outcomes';
    if (path.includes('/tracking')) return 'Blood Requirement Tracking';
    if (path.includes('/staff')) return 'Hospital Staff Management & RBAC';
    if (path.includes('/analytics')) return role === 'hospital' ? 'Hospital Reports & Analytics' : 'Reports & Analytics Dashboard';
    if (path.includes('/history')) return 'Donation History & Badges';
    if (path.includes('/track')) return 'Track Active Blood Requests';
    if (path.includes('/users')) return 'User & Account Management';
    if (path.includes('/verification')) return 'Donor Clinical Verification';
    if (path.includes('/hospitals')) return 'Hospital Verification & Accreditation';
    if (path.includes('/audit')) return 'Platform Security & Compliance';
    return title || 'Workspace Overview';
  };

  return (
    <div className="min-h-screen bg-[#F6F5F0] text-[#172033] flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 transition-all">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
                <Link to="/" className="hover:text-[#C1123F]">LIFORA</Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                {role === 'hospital' ? (
                  <>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-[#C1123F]" />
                      <span>Lilavati Hospital</span>
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>NABH Partner</span>
                    </span>
                  </>
                ) : (
                  <span className="capitalize font-medium text-slate-700">{role} Workspace</span>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[#C1123F] font-semibold">{getHeaderTitle()}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-[#172033] tracking-tight">
                {getHeaderTitle()}
              </h1>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Donor Availability Quick Toggle */}
            {role === 'donor' && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                <Radio className={`w-3.5 h-3.5 ${user?.isAvailable ? 'text-[#16A36A]' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold text-slate-700">
                  {user?.isAvailable ? 'Available' : 'Paused'}
                </span>
                <button
                  type="button"
                  onClick={handleToggleAvailability}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
                    user?.isAvailable ? 'bg-[#16A36A]' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle availability"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      user?.isAvailable ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* Hospital Staff Role Switcher (RBAC) */}
            {role === 'hospital' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStaffSwitcherOpen(!staffSwitcherOpen)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-xs font-bold text-[#C1123F] flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Switch Staff Role (RBAC Simulation)"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-normal text-slate-600">Staff:</span>
                  <span>{STAFF_ROLES[staffRole]?.label || 'Hospital Admin'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#C1123F]" />
                </button>

                <AnimatePresence>
                  {staffSwitcherOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setStaffSwitcherOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs"
                      >
                        <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">
                          Switch Hospital Staff (RBAC)
                        </div>
                        {Object.entries(STAFF_ROLES).map(([key, config]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleStaffRoleSelect(key)}
                            className={`w-full text-left px-3 py-2 rounded-xl transition-colors flex flex-col cursor-pointer ${
                              staffRole === key
                                ? 'bg-rose-50 text-[#C1123F] font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold">{config.label}</span>
                              {staffRole === key && <CheckCircle2 className="w-3.5 h-3.5 text-[#C1123F]" />}
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal line-clamp-1">
                              {config.description}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Demo Persona Switcher Dropdown in Dashboard Header */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Switch Demo Persona"
              >
                <span className="w-2 h-2 rounded-full bg-[#16A36A] animate-pulse" />
                <span className="hidden sm:inline capitalize">Role:</span>
                <span className="capitalize">{role === 'hospital' ? 'Hospital' : role}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <AnimatePresence>
                {roleSwitcherOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setRoleSwitcherOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs"
                    >
                      <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">
                        Switch Persona
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSwitchRole('donor')}
                        className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          role === 'donor'
                            ? 'bg-rose-50 text-[#C1123F] font-bold'
                            : 'hover:bg-slate-50 text-[#172033]'
                        }`}
                      >
                        <span>🩸 Donor Persona</span>
                        {role === 'donor' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C1123F]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchRole('recipient')}
                        className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          role === 'recipient'
                            ? 'bg-rose-50 text-[#C1123F] font-bold'
                            : 'hover:bg-slate-50 text-[#172033]'
                        }`}
                      >
                        <span>🏥 Recipient Persona</span>
                        {role === 'recipient' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C1123F]" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSwitchRole('hospital')}
                        className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          role === 'hospital'
                            ? 'bg-rose-50 text-[#C1123F] font-bold'
                            : 'hover:bg-slate-50 text-[#172033]'
                        }`}
                      >
                        <span>🏢 Hospital Portal</span>
                        {role === 'hospital' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C1123F]" />}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-xl text-slate-600 hover:text-[#C1123F] hover:bg-slate-100 transition-colors relative cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C1123F] ring-2 ring-white" />
              </button>
              <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-2 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#C1123F] to-[#F04462] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.bloodGroup || user?.name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-[#172033] leading-tight">
                    {user?.name?.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize">{role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-0.5" />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs"
                    >
                      <div className="p-2 border-b border-slate-100">
                        <div className="font-bold text-[#172033]">{user?.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                        <div className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
                          {role} Workspace
                        </div>
                      </div>

                      {/* Clean Profile Dropdown: ONLY View Profile, Account Settings, Change Password, Logout */}
                      <div className="py-1">
                        <Link
                          to={`/${role}/profile`}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[#172033] hover:bg-slate-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span>View Profile</span>
                        </Link>

                        <Link
                          to={`/${role}/settings`}
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[#172033] hover:bg-slate-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-slate-500" />
                          <span>Account Settings</span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setChangePassOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[#172033] hover:bg-slate-50 transition-colors text-left cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-slate-500" />
                          <span>Change Password</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePassOpen}
        onClose={() => setChangePassOpen(false)}
      />
    </div>
  );
}
