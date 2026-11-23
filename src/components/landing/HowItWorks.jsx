import React from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Search, HeartHandshake, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HowItWorks() {
  const steps = [
    {
      stepNumber: '01',
      title: 'Create an Account',
      description: 'Register in under 60 seconds as a voluntary donor or recipient. Specify your blood type, location, and emergency availability.',
      icon: UserCheck,
      color: 'from-[#F04462] to-[#C1123F]',
      badge: 'Quick Registration',
      linkText: 'Join the Network',
      linkTo: '/register',
    },
    {
      stepNumber: '02',
      title: 'Find a Match',
      description: 'Search for potential donors based on exact blood group compatibility and distance radius. Filter verified donors with map intelligence.',
      icon: Search,
      color: 'from-blue-600 to-indigo-600',
      badge: 'Location-Based Match',
      linkText: 'Explore Donors',
      linkTo: '/find-donors',
    },
    {
      stepNumber: '03',
      title: 'Connect & Save Lives',
      description: 'Send instant emergency requests or coordinate directly with donors and hospital blood banks under full medical compliance.',
      icon: HeartHandshake,
      color: 'from-emerald-600 to-[#16A36A]',
      badge: 'Verified Lifesaving',
      linkText: 'Request Blood',
      linkTo: '/create-request',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-[#FAF9F6] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C1123F] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Simple 3-Step Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
            How LIFORA Connects Lifesavers
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Eliminating chaos during critical blood shortages through intelligent, privacy-first technology.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-[#C1123F]/20 via-blue-200 to-emerald-200 -translate-y-12 -z-0" />

          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.stepNumber}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 relative flex flex-col justify-between group z-10"
              >
                <div>
                  {/* Top Step Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>

                    <span className="text-3xl font-extrabold text-slate-200 group-hover:text-rose-100 transition-colors">
                      {item.stepNumber}
                    </span>
                  </div>

                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#C1123F] bg-rose-50 px-2.5 py-0.5 rounded-full mb-2">
                    {item.badge}
                  </span>

                  <h3 className="text-xl font-bold text-[#172033] group-hover:text-[#C1123F] transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm text-[#64748B] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100">
                  <Link
                    to={item.linkTo}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#172033] group-hover:text-[#C1123F] transition-colors"
                  >
                    <span>{item.linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
