import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, HeartHandshake, MapPin, Sparkles, Info } from 'lucide-react';
import { INITIAL_STATS } from '../../services/mockData';

function Counter({ endValue, duration = 2 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * endValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [endValue, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export default function ImpactStats() {
  const stats = [
    {
      label: 'Registered Donors',
      value: INITIAL_STATS.registeredDonors,
      suffix: '+',
      icon: Users,
      desc: 'Active voluntary life-savers',
      color: 'from-[#F04462] to-[#C1123F]',
    },
    {
      label: 'Requests Fulfilled',
      value: INITIAL_STATS.requestsFulfilled,
      suffix: '+',
      icon: HeartHandshake,
      desc: 'Verified clinical deliveries',
      color: 'from-emerald-500 to-[#16A36A]',
    },
    {
      label: 'Cities Connected',
      value: INITIAL_STATS.citiesConnected,
      suffix: '+',
      icon: MapPin,
      desc: 'Pan-national network footprint',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Lives Impacted',
      value: INITIAL_STATS.livesImpacted,
      suffix: '+',
      icon: Sparkles,
      desc: 'Direct patients & families helped',
      color: 'from-amber-500 to-rose-600',
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="text-center sm:text-left flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-md flex-shrink-0`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#172033] tracking-tight">
                    <Counter endValue={item.value} />
                    <span>{item.suffix}</span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-[#172033] mt-1">
                    {item.label}
                  </div>
                  <div className="text-xs text-[#64748B] mt-0.5 hidden sm:block">
                    {item.desc}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Clear demonstration note as requested */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-[#64748B]">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Demonstration Network Statistics: Figures represent prototype platform simulation and aggregate test data.
          </span>
        </div>
      </div>
    </section>
  );
}
