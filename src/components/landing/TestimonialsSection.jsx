import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { TESTIMONIALS, FAQS } from '../../services/mockData';

export default function TestimonialsSection() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <section className="py-20 bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Testimonials Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#C1123F] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Real Community Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
            Trusted by Donors & Families
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
            Discover how connecting nearby donors has helped save precious lives during emergency surgical interventions.
          </p>
        </div>

        {/* Testimonials 3 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative"
            >
              <div>
                {/* Quote Icon & Tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-[#C1123F] border border-rose-200">
                    {t.tag}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-[#172033] italic leading-relaxed">
                  "{t.quote}"
                </p>
              </div>

              {/* Author footer */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#172033] flex items-center gap-1">
                    {t.name}
                    {t.verified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-[#16A36A]" title="Verified member" />
                    )}
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {t.role} • {t.location}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Note on sample testimonials as required by prompt */}
        <p className="mt-4 text-center text-xs text-slate-600 italic">
          * Note: Prototype sample testimonials illustrating typical clinical and patient donor experiences.
        </p>

        {/* FAQ Accordion Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-extrabold text-[#172033]">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Common questions on donor privacy, response protocols, and clinical safety.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#172033] hover:text-[#C1123F] transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#C1123F] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-[#64748B] leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
