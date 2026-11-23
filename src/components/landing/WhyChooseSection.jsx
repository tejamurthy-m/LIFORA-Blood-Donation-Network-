import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Zap,
  Layers,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function WhyChooseSection() {
  const features = [
    {
      title: 'Easy Donor Discovery',
      description: 'Find compatible donors in seconds using intuitive blood group filters, real-time availability badges, and privacy-shielded profiles.',
      icon: Search,
      color: 'bg-rose-50 text-[#C1123F]',
    },
    {
      title: 'Location-Based Matching',
      description: 'Intelligent spatial matching sorts donors by proximity and hospital route, minimizing transit delay during critical medical moments.',
      icon: MapPin,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'Rapid Response Coordination',
      description: 'Instant automated notification alerts reach verified donors immediately via SMS and in-app priority triggers.',
      icon: Zap,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      title: 'Organized Donation Requests',
      description: 'Transparent 4-stage tracking timeline allows hospital coordinators, patients, and families to view live response status.',
      icon: Layers,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Community-Driven & Voluntary',
      description: 'A genuine network of verified voluntary life-savers dedicated to zero commercial exploitation and ethical healthcare.',
      icon: Users,
      color: 'bg-emerald-50 text-[#16A36A]',
    },
  ];

  return (
    <section id="about-us" className="py-20 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C1123F] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Engineered For Healthcare Reliability
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
            Why Choose LIFORA?
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Bridging the gap between willingness and emergency response with a platform designed for trust, speed, and privacy.
          </p>
        </div>

        {/* Feature Cards Grid (5 items) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`p-7 rounded-3xl border border-slate-200/80 hover:border-[#C1123F]/30 bg-white hover:bg-slate-50/50 shadow-sm hover:shadow-md transition-all duration-300 ${
                  i === 0 ? 'lg:col-span-1' : ''
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-5`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-[#172033] mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            );
          })}

          {/* Special 6th Card: Clinical Safety & Protocol */}
          <div className="p-7 rounded-3xl bg-gradient-to-br from-[#172033] to-[#222E47] text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                100% Medical Protocol Safe
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                We empower clinical teams without interfering in hospital blood-banking protocols. All cross-matches, donor hemoglobin screenings, and infectious disease checks are performed by certified hospital blood banks.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Compliant with National Blood Transfusion Standards</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
