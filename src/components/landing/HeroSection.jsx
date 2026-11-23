import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Heart,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Activity,
  Users,
} from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-8 pb-20 lg:pt-16 lg:pb-28">
      {/* Background ambient gradient blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#F04462]/10 via-[#C1123F]/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 -right-20 w-96 h-96 bg-[#C1123F]/8 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Column (7 cols on lg) */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-6 text-center lg:text-left"
          >
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-[#C1123F] text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#C1123F] animate-pulse" />
              <span>Next-Gen Voluntary Blood Network</span>
              <Sparkles className="w-3.5 h-3.5 text-[#F04462]" />
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#172033] tracking-tight leading-[1.12]">
              One Connection <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C1123F] via-[#F04462] to-[#C1123F]">
                Can Save a Life.
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#64748B] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Connecting people who need blood with willing donors nearby. Join a community that makes every drop count with verified privacy and real-time hospital dispatch.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <Link
                to="/find-donors"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-sm font-bold shadow-lg shadow-[#C1123F]/25 hover:shadow-xl hover:shadow-[#C1123F]/30 transition-all duration-200 group"
              >
                <Search className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>Find Blood Donors</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                to="/register?role=donor"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-[#172033] border border-slate-200 text-sm font-bold shadow-sm transition-all duration-200"
              >
                <Heart className="w-4 h-4 text-[#C1123F] fill-rose-500/20" />
                <span>Become a Donor</span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="pt-6 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-[#172033]">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#16A36A] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Verified Donor Profiles</span>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <span>Location-Based Discovery</span>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#C1123F] flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <span>Emergency Request Support</span>
              </div>
            </div>
          </motion.div>

          {/* Right Hero Visual (5 cols on lg) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-5 relative flex items-center justify-center"
          >
            {/* Center Visual Art Canvas */}
            <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
              {/* Animated pulsating circles */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#C1123F]/10 via-[#F04462]/10 to-amber-500/5 animate-pulse" />
              <div className="absolute inset-8 rounded-full border border-dashed border-[#C1123F]/20 animate-spin" style={{ animationDuration: '40s' }} />
              <div className="absolute inset-16 rounded-full border border-[#C1123F]/15" />

              {/* Glowing Center Core */}
              <div className="relative w-40 h-40 rounded-full bg-gradient-to-tr from-[#C1123F] to-[#F04462] shadow-2xl shadow-[#C1123F]/40 flex flex-col items-center justify-center text-white text-center p-4 z-10 transition-transform hover:scale-105 duration-300">
                <svg
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-16 h-16 drop-shadow-md"
                >
                  <path
                    d="M50 88C50 88 15 65 15 38C15 24 26 14 39 14C45.5 14 50 18 50 18C50 18 54.5 14 61 14C74 14 85 24 85 38C85 65 50 88 50 88Z"
                    fill="white"
                    fillOpacity="0.95"
                  />
                  <path
                    d="M50 34C50 34 40 48 40 56C40 61.5 44.5 66 50 66C55.5 66 60 61.5 60 56C60 48 50 34 50 34Z"
                    fill="#C1123F"
                  />
                  <circle cx="50" cy="56" r="3.5" fill="white" />
                </svg>
                <span className="text-xs font-extrabold tracking-wider mt-1 uppercase">LIFORA Core</span>
              </div>

              {/* Floating Glassmorphism Badge 1 (Top Left) */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                className="absolute -top-3 -left-3 sm:-left-6 glass-panel rounded-2xl p-3.5 shadow-lg border border-white/80 z-20 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16A36A] to-emerald-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  O-
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#172033]">Universal Match</div>
                  <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Lilavati Hospital • 1.8 km
                  </div>
                </div>
              </motion.div>

              {/* Floating Glassmorphism Badge 2 (Bottom Right) */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-4 -right-2 sm:-right-6 glass-panel rounded-2xl p-3.5 shadow-lg border border-white/80 z-20 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C1123F] to-[#F04462] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#172033]">Emergency Dispatched</div>
                  <div className="text-[11px] text-[#C1123F] font-semibold">
                    18 Donors Pinged in 42s
                  </div>
                </div>
              </motion.div>

              {/* Floating Badge 3 (Middle Right) */}
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 1 }}
                className="hidden sm:flex absolute top-12 -right-10 bg-white/90 backdrop-blur-md rounded-xl p-2 px-3 shadow-md border border-slate-100 z-20 items-center gap-2 text-xs font-bold text-[#172033]"
              >
                <ShieldCheck className="w-4 h-4 text-[#16A36A]" />
                <span>100% Privacy Protected</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
