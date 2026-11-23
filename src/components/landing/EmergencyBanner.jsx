import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, PhoneCall, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmergencyBanner() {
  return (
    <section className="py-16 bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.3 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#C1123F] via-[#A00E34] to-[#172033] text-white p-8 sm:p-12 shadow-2xl shadow-[#C1123F]/20"
        >
          {/* Decorative glow and subtle wave overlay */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F04462]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-red-100 text-xs font-bold border border-white/20">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span>Urgent Care Network</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Someone needs blood. <br />
                <span className="text-red-200">Be the reason help arrives.</span>
              </h2>

              <p className="text-sm sm:text-base text-red-100/90 max-w-xl leading-relaxed">
                Emergency requests trigger high-priority push notifications and automated hospital desk coordination within seconds of submission.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-red-100 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verified Cross-Match Coordination</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-300" />
                  <span>Real-Time Broadcast Radius (15 km)</span>
                </div>
              </div>
            </div>

            {/* Right Action (4 cols) */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch justify-center gap-4">
              <Link
                to="/emergency-request"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-white hover:bg-slate-100 text-[#C1123F] font-bold text-sm shadow-xl hover:shadow-2xl transition-all duration-200 group text-center"
              >
                <AlertTriangle className="w-5 h-5 text-[#C1123F] animate-pulse" />
                <span>Create Emergency Request</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/find-donors"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-xs transition-colors text-center"
              >
                <span>View Urgent Donors on Map</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
