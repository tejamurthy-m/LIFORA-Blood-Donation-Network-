import React from 'react';
import { Search, MapPin, SlidersHorizontal, RotateCcw, ShieldCheck } from 'lucide-react';

const BLOOD_GROUPS = ['ALL', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const CITIES = ['ALL', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai'];

export default function SearchFilters({
  filters,
  onChange,
  onReset,
  totalResults = 0,
}) {
  const handleFilterChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
      {/* Top Search bar & quick filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Keyword Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by donor name or area..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F] transition-all"
          />
        </div>

        {/* Blood Group Selector */}
        <div>
          <select
            value={filters.bloodGroup || 'ALL'}
            onChange={(e) => handleFilterChange('bloodGroup', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F] transition-all"
          >
            <option value="ALL">All Blood Groups</option>
            {BLOOD_GROUPS.filter((b) => b !== 'ALL').map((bg) => (
              <option key={bg} value={bg}>
                Blood Group: {bg}
              </option>
            ))}
          </select>
        </div>

        {/* City Selector */}
        <div>
          <select
            value={filters.city || 'ALL'}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F] transition-all"
          >
            <option value="ALL">All Locations / Cities</option>
            {CITIES.filter((c) => c !== 'ALL').map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <select
            value={filters.sortBy || 'distance'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F] transition-all"
          >
            <option value="distance">Sort by: Nearest Distance</option>
            <option value="donations">Sort by: Most Donations</option>
            <option value="response">Sort by: Fastest Response</option>
          </select>
        </div>
      </div>

      {/* Second row: Distance Slider & Availability Checkbox */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
        {/* Distance Range */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Max Radius:
          </span>
          <input
            type="range"
            min="2"
            max="25"
            step="1"
            value={filters.maxDistance || 25}
            onChange={(e) => handleFilterChange('maxDistance', e.target.value)}
            className="w-28 sm:w-36 accent-[#C1123F] cursor-pointer"
          />
          <span className="text-xs font-bold text-[#C1123F] min-w-12">
            {filters.maxDistance || 25} km
          </span>
        </div>

        {/* Availability Toggle */}
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!filters.onlyAvailable}
            onChange={(e) => handleFilterChange('onlyAvailable', e.target.checked)}
            className="w-4 h-4 rounded text-[#C1123F] focus:ring-[#C1123F] border-slate-300 accent-[#C1123F]"
          />
          <span className="text-xs font-semibold text-[#172033]">
            Available Now Only
          </span>
        </label>

        {/* Action Counters & Reset */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-slate-500 font-medium">
            Found <strong className="text-[#172033]">{totalResults}</strong> verified donors
          </span>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#C1123F] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
