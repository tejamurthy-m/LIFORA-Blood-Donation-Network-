import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  User,
  Settings,
  KeyRound,
  LogOut,
  ChevronDown,
  AlertTriangle,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import LiforaLogo from './LiforaLogo';
import ChangePasswordModal from './ChangePasswordModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [changePassOpen, setChangePassOpen] = useState(false);

  const { user, isAuthenticated, logout, switchDemoRole } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on path change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setRoleSwitcherOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    addToast({
      title: 'Signed Out',
      message: 'You have been signed out successfully.',
      type: 'info',
    });
    navigate('/');
  };

  const handleSwitchRole = (newRole) => {
    const switched = switchDemoRole(newRole);
    setRoleSwitcherOpen(false);
    addToast({
      title: `Switched to ${newRole.toUpperCase()} Persona`,
      message: `Active session set as ${switched?.name || newRole}. Redirecting to ${newRole} dashboard...`,
      type: 'success',
    });
    navigate(`/${newRole}/dashboard`);
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Find Donors', path: '/find-donors' },
    { label: 'Become a Donor', path: '/register?role=donor' },
    { label: 'How It Works', path: '/#how-it-works' },
    { label: 'About Us', path: '/#about-us' },
  ];

  const getDashboardPath = () => {
    if (user?.role === 'donor') return '/donor/dashboard';
    if (user?.role === 'recipient') return '/recipient/dashboard';
    if (user?.role === 'hospital') return '/hospital/dashboard';
    return '/donor/dashboard';
  };

  const getRoleBadgeLabel = () => {
    if (!user) return 'Demo: Guest';
    if (user.role === 'donor') return 'Demo: Donor';
    if (user.role === 'recipient') return 'Demo: Recipient';
    if (user.role === 'hospital') return 'Demo: Hospital';
    return 'Demo Persona';
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'glass-nav shadow-xs py-2.5'
            : 'bg-[#FAF9F6]/95 backdrop-blur-md border-b border-slate-200/60 py-3'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Brand Logo */}
            <LiforaLogo size="md" withTagline={false} />

            {/* Desktop Public Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isHash = link.path.includes('#');
                if (isHash) {
                  return (
                    <a
                      key={link.label}
                      href={link.path}
                      className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-[#C1123F] hover:bg-slate-100/50 transition-colors"
                    >
                      {link.label}
                    </a>
                  );
                }
                return (
                  <NavLink
                    key={link.label}
                    to={link.path}
                    className={({ isActive }) =>
                      `relative px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-[#C1123F] font-semibold'
                          : 'text-slate-600 hover:text-[#C1123F] hover:bg-slate-100/50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {link.label}
                        {isActive && (
                          <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[#C1123F] rounded-full" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Emergency CTA Button */}
              <Link
                to="/emergency-request"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100/90 text-[#C1123F] border border-rose-200/80 text-xs font-semibold transition-all shadow-2xs hover:border-rose-300"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#C1123F]" />
                <span>Emergency Request</span>
              </Link>

              {/* Demo Persona Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 transition-all cursor-pointer shadow-2xs hover:border-slate-300"
                  title="Switch Demo Persona"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider">DEMO:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {user?.role || 'Guest'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
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
                        className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs"
                      >
                        <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-400">
                          Select Demo Persona
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSwitchRole('donor')}
                          className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between cursor-pointer ${
                            user?.role === 'donor'
                              ? 'bg-rose-50 text-[#C1123F] font-bold'
                              : 'hover:bg-slate-50 text-[#172033]'
                          }`}
                        >
                          <span>🩸 Donor Persona</span>
                          {user?.role === 'donor' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C1123F]" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchRole('recipient')}
                          className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between cursor-pointer ${
                            user?.role === 'recipient'
                              ? 'bg-rose-50 text-[#C1123F] font-bold'
                              : 'hover:bg-slate-50 text-[#172033]'
                          }`}
                        >
                          <span>🏥 Recipient Persona</span>
                          {user?.role === 'recipient' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C1123F]" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchRole('hospital')}
                          className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between cursor-pointer ${
                            user?.role === 'hospital'
                              ? 'bg-rose-50 text-[#C1123F] font-bold'
                              : 'hover:bg-slate-50 text-[#172033]'
                          }`}
                        >
                          <span>🏢 Hospital Portal</span>
                          {user?.role === 'hospital' && <CheckCircle2 className="w-3.5 h-3.5 text-[#C1123F]" />}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Authenticated Controls or Log In / Register */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <Link
                    to={getDashboardPath()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-semibold transition-all shadow-xs hover:shadow"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Dashboard</span>
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-1.5 p-1 pr-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all shadow-2xs cursor-pointer"
                      title="User Profile & Settings"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#C1123F] to-[#F04462] text-white flex items-center justify-center font-bold text-[11px] shadow-xs">
                        {user?.bloodGroup || user?.name?.charAt(0) || 'U'}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 max-w-[85px] truncate hidden md:inline">
                        {user?.name?.split(' ')[0]}
                      </span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
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
                            className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 text-xs"
                          >
                            <div className="p-2.5 border-b border-slate-100">
                              <div className="flex items-center gap-2.5 mb-1.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#C1123F] to-[#F04462] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                  {user?.bloodGroup || user?.name?.charAt(0) || 'U'}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-[#172033] truncate">{user?.name}</div>
                                  <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                                </div>
                              </div>
                              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 text-[#C1123F]">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{user?.role} Workspace</span>
                              </div>
                            </div>

                            {/* Clean Profile Dropdown: View Profile, Account Settings, Change Password, Logout */}
                            <div className="py-1">
                              <Link
                                to={getDashboardPath()}
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[#172033] hover:bg-slate-50 transition-colors"
                              >
                                <LayoutDashboard className="w-4 h-4 text-[#C1123F]" />
                                <span>Open Dashboard</span>
                              </Link>

                              <Link
                                to={`/${user?.role}/profile`}
                                onClick={() => setProfileDropdownOpen(false)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-[#172033] hover:bg-slate-50 transition-colors"
                              >
                                <User className="w-4 h-4 text-slate-500" />
                                <span>View Profile</span>
                              </Link>

                              <Link
                                to={`/${user?.role}/settings`}
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
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#C1123F] transition-colors"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-1.5 rounded-full bg-[#C1123F] hover:bg-[#9E0E32] text-xs font-bold text-white shadow-xs transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-white"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 overflow-hidden px-4 pt-3 pb-6"
            >
              <div className="flex flex-col gap-1">
                <Link
                  to="/emergency-request"
                  className="w-full py-2.5 px-4 rounded-xl bg-red-100 text-[#C1123F] font-bold text-sm mb-2 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Emergency Blood Request
                </Link>

                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    className="py-2.5 px-3 rounded-xl text-sm font-medium text-[#172033] hover:bg-rose-50 hover:text-[#C1123F]"
                  >
                    {link.label}
                  </Link>
                ))}

                {isAuthenticated && (
                  <Link
                    to={getDashboardPath()}
                    className="mt-2 py-2.5 px-4 rounded-xl bg-[#C1123F] text-white font-bold text-sm text-center"
                  >
                    Go to My Dashboard
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePassOpen}
        onClose={() => setChangePassOpen(false)}
      />
    </>
  );
}
