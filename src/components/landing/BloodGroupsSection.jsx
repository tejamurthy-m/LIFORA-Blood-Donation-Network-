import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BLOOD_GROUPS_INFO } from '../../services/mockData';
import BloodGroupCard from '../common/BloodGroupCard';
import { Droplet, Info, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BloodGroupsSection() {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <section className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#C1123F] text-xs font-bold border border-rose-200">
              <Droplet className="w-3.5 h-3.5 fill-[#C1123F]" />
              <span>Blood Group Intelligence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
              Compatible Blood Types & Donors
            </h2>
            <p className="text-sm sm:text-base text-[#64748B] leading-relaxed">
              Click any blood group to instantly inspect donors and compatibility protocols. Every type serves a specific medical purpose.
            </p>
          </div>

          <Link
            to="/find-donors"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#C1123F] hover:text-[#9E0E32] transition-colors self-start md:self-auto"
          >
            <span>View All Donors on Map</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 8 Blood Group Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BLOOD_GROUPS_INFO.map((info) => (
            <BloodGroupCard
              key={info.type}
              info={info}
              isSelected={selectedGroup === info.type}
            />
          ))}
        </div>

        {/* Universal Donor / Recipient Fact Banner */}
        <div className="mt-10 p-6 rounded-3xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#C1123F] text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
              O-
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#172033]">
                Universal Red Cell Donors
              </h4>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                O-negative blood is given to patients of any blood type in trauma and acute emergency cases when patient blood type is not yet known.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#172033] text-white flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-sm">
              AB+
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#172033]">
                Universal Red Cell Recipients
              </h4>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                AB-positive individuals can safely receive red blood cells from any blood type. AB blood donors are also universal plasma donors!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
