import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  HeartHandshake,
  History,
  Bell,
  Settings,
  LogOut,
  Search,
  PlusCircle,
  FileText,
  ShieldCheck,
  Users,
  Activity,
  AlertTriangle,
  Building2,
  MessageSquare,
  Radio,
  CheckCircle2,
  X,
  Compass,
  Clock,
  TrendingUp,
} from 'lucide-react';
import LiforaLogo from './LiforaLogo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { STAFF_ROLES, hasPermission } from '../../services/hospitalPortalService';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    addToast({
      title: 'Logged Out',
      message: 'You have safely signed out of your account.',
      type: 'info',
    });
    navigate('/');
  };

  const role = user?.role || 'donor';

  // 1. Exact Donor Navigation Items
  const donorLinks = [
    { label: 'Overview', path: '/donor/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', path: '/donor/profile', icon: User },
    { label: 'Availability Status', path: '/donor/availability', icon: Radio },
    { label: 'Blood Requests', path: '/donor/requests', icon: HeartHandshake, badge: 'Active' },
    { label: 'My Accepted Requests', path: '/donor/accepted', icon: CheckCircle2 },
    { label: 'Donation History', path: '/donor/history', icon: History },
    { label: 'Notifications', path: '/donor/notifications', icon: Bell },
    { label: 'Settings', path: '/donor/settings', icon: Settings },
  ];

  // 2. Exact Recipient Navigation Items
  const recipientLinks = [
    { label: 'Overview', path: '/recipient/dashboard', icon: LayoutDashboard },
    { label: 'Find Donors', path: '/recipient/find-donors', icon: Search },
    { label: 'Create Blood Request', path: '/recipient/create-request', icon: PlusCircle },
    { label: 'Emergency Request', path: '/recipient/emergency-request', icon: AlertTriangle, isEmergency: true },
    { label: 'My Requests', path: '/recipient/requests', icon: FileText, badge: 'Track' },
    { label: 'Track Requests', path: '/recipient/track', icon: Compass },
    { label: 'Notifications', path: '/recipient/notifications', icon: Bell },
    { label: 'My Profile', path: '/recipient/profile', icon: User },
    { label: 'Settings', path: '/recipient/settings', icon: Settings },
  ];

  // 3. Exact Hospital Portal Navigation Items (ONE portal for all staff, RBAC filtered)
  const staffRole = user?.staffRole || 'hospital_admin';

  const hospitalLinks = [
    { label: 'Dashboard', path: '/hospital/dashboard', icon: LayoutDashboard },
    {
      label: 'Blood Requests',
      path: '/hospital/requests',
      icon: FileText,
      badge: 'Active',
      permission: 'manage_requests',
    },
    {
      label: 'Donor Management',
      path: '/hospital/donors',
      icon: Users,
      permission: 'manage_donors',
    },
    {
      label: 'Donor Arrivals',
      path: '/hospital/arrivals',
      icon: Clock,
      badge: 'Live',
      permission: 'manage_arrivals',
    },
    {
      label: 'Donation Management',
      path: '/hospital/donations',
      icon: HeartHandshake,
      badge: 'Clinical',
      permission: 'record_donations',
    },
    {
      label: 'Donor Verifications',
      path: '/hospital/verifications',
      icon: ShieldCheck,
      badge: 'Review',
      permission: 'review_verifications',
    },
    {
      label: 'Requirement Tracking',
      path: '/hospital/tracking',
      icon: TrendingUp,
      permission: 'track_requirements',
    },
    {
      label: 'Staff Management',
      path: '/hospital/staff',
      icon: ShieldCheck,
      badge: 'Admin',
      permission: 'manage_staff',
    },
    { label: 'Notifications', path: '/hospital/notifications', icon: Bell },
    {
      label: 'Reports & Analytics',
      path: '/hospital/analytics',
      icon: Activity,
      permission: 'view_reports',
    },
    { label: 'Hospital Profile', path: '/hospital/profile', icon: Building2 },
    { label: 'Settings', path: '/hospital/settings', icon: Settings },
  ];

  // Filter links for hospital staff based on RBAC permissions
  const filteredHospitalLinks = hospitalLinks.filter((item) => {
    if (!item.permission) return true;
    // Hospital admin has full access to all items
    if (staffRole === 'hospital_admin') return true;
    return hasPermission(staffRole, item.permission);
  });

  const links =
    role === 'hospital'
      ? filteredHospitalLinks
      : role === 'recipient'
      ? recipientLinks
      : donorLinks;

  const roleLabel =
    role === 'hospital'
      ? STAFF_ROLES[staffRole]?.label || 'Hospital Staff'
      : role === 'recipient'
      ? 'Recipient Patient'
      : 'Blood Donor';

  const roleBadgeColor =
    role === 'hospital'
      ? 'bg-rose-100 text-[#C1123F]'
      : role === 'recipient'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-emerald-100 text-emerald-700';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white border-r border-slate-200/90 flex flex-col h-screen transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top: Header with LIFORA Logo & Role Badge */}
        <div className="flex-shrink-0">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <LiforaLogo size="sm" withTagline={true} />
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 pt-3 pb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Workspace Menu
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${roleBadgeColor}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Navigation Links (Scrollable flex-1 area) */}
        <nav className="flex-1 min-h-0 px-3 py-1 space-y-0.5 overflow-y-auto overscroll-contain">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              location.pathname === link.path ||
              (link.path !== `/${role}/dashboard` && location.pathname.startsWith(link.path));

            return (
              <NavLink
                key={link.path + link.label}
                to={link.path}
                onClick={() => onClose && onClose()}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  link.isEmergency
                    ? 'bg-red-50 text-[#C1123F] font-bold hover:bg-red-100 mb-1 border border-red-200/70'
                    : isActive
                    ? 'bg-[#C1123F] text-white shadow-xs font-semibold'
                    : 'text-[#172033] hover:bg-rose-50/70 hover:text-[#C1123F]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      link.isEmergency
                        ? 'text-[#C1123F]'
                        : isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-[#C1123F]'
                    }`}
                  />
                  <span>{link.label}</span>
                </div>

                {link.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-100 text-[#C1123F]'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Section: Active User Card & Sign Out (Fixed at bottom with safe padding) */}
        <div className="flex-shrink-0 p-3 pb-4 border-t border-slate-100 bg-slate-50/70 space-y-2">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
            {role === 'hospital' && (
              <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100 text-[11px] font-bold text-slate-800">
                <Building2 className="w-3.5 h-3.5 text-[#C1123F] flex-shrink-0" />
                <span className="truncate">{user?.hospitalName || 'Lilavati Hospital & Research'}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#C1123F] to-[#F04462] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user?.bloodGroup || user?.name?.charAt(0) || 'H'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#172033] truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-500 truncate leading-tight">{roleLabel}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-[#C1123F] rounded-xl transition-colors cursor-pointer border border-rose-200/50 bg-white hover:border-rose-300 shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
