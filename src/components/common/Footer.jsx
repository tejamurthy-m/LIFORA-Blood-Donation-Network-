import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Globe, Share2, MessageCircle } from 'lucide-react';
import LiforaLogo from './LiforaLogo';

export default function Footer() {
  return (
    <footer className="bg-[#172033] text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <LiforaLogo variant="light" size="lg" withTagline={true} />
            <p className="text-sm text-slate-300 max-w-sm leading-relaxed">
              Every Drop Connects. Every Life Matters. A next-generation healthcare technology platform uniting verified voluntary donors, recipients, and clinical blood banks in real time.
            </p>

            <div className="pt-2 flex items-center gap-3 text-slate-400">
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-[#C1123F] hover:text-white flex items-center justify-center transition-colors" title="Global Health Network">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-[#C1123F] hover:text-white flex items-center justify-center transition-colors" title="Community Forum">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-[#C1123F] hover:text-white flex items-center justify-center transition-colors" title="Social Share">
                <Share2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link to="/find-donors" className="hover:text-white transition-colors">
                  Find Blood Donors
                </Link>
              </li>
              <li>
                <Link to="/register?role=donor" className="hover:text-white transition-colors">
                  Become a Voluntary Donor
                </Link>
              </li>
              <li>
                <Link to="/create-request" className="hover:text-white transition-colors">
                  Request Blood
                </Link>
              </li>
              <li>
                <Link to="/emergency-request" className="text-red-400 font-semibold hover:text-red-300 transition-colors">
                  Emergency Blood Alert
                </Link>
              </li>
              <li>
                <Link to="/hospital/dashboard" className="hover:text-white transition-colors">
                  Hospital Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Blood Groups Directory */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Blood Groups</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <Link to="/find-donors?bloodGroup=O%2B" className="hover:text-red-400">O Positive (O+)</Link>
              <Link to="/find-donors?bloodGroup=O-" className="hover:text-red-400">O Negative (O-)</Link>
              <Link to="/find-donors?bloodGroup=A%2B" className="hover:text-red-400">A Positive (A+)</Link>
              <Link to="/find-donors?bloodGroup=A-" className="hover:text-red-400">A Negative (A-)</Link>
              <Link to="/find-donors?bloodGroup=B%2B" className="hover:text-red-400">B Positive (B+)</Link>
              <Link to="/find-donors?bloodGroup=B-" className="hover:text-red-400">B Negative (B-)</Link>
              <Link to="/find-donors?bloodGroup=AB%2B" className="hover:text-red-400">AB Positive (AB+)</Link>
              <Link to="/find-donors?bloodGroup=AB-" className="hover:text-red-400">AB Negative (AB-)</Link>
            </div>
          </div>

          {/* 24/7 Clinical Emergency Line */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200">Emergency Support</h4>
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-red-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                24/7 National Emergency Desk
              </div>
              <div className="text-base font-extrabold text-white">
                1800-LIFORA-HELP
              </div>
              <p className="text-[11px] text-slate-400">
                Toll-free emergency dispatch assistance for hospital cross-matching.
              </p>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>support@lifora.org</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Lifora Health HQ, Tech Hub, Mumbai</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="max-w-2xl leading-relaxed">
            <strong className="text-slate-300">Medical Notice:</strong> LIFORA provides location-based discovery and communication coordination between voluntary blood donors, patients, and healthcare institutions. LIFORA does not provide medical testing, blood banking, or transfusion services. All donor eligibility and cross-matching is strictly conducted by certified hospital pathologists.
          </div>

          <div className="flex items-center gap-6 whitespace-nowrap text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Security & HIPAA</a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-800/60 text-center text-xs text-slate-300">
          © {new Date().getFullYear()} LIFORA Blood Donation Network. Built with precision for modern healthcare.
        </div>
      </div>
    </footer>
  );
}
