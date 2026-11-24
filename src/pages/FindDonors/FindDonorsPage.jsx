import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  List,
  Map,
  ShieldCheck,
  Heart,
  Send,
  MapPin,
} from 'lucide-react';
import SearchFilters from '../../components/common/SearchFilters';
import DonorCard from '../../components/common/DonorCard';
import DonorMap from './DonorMap';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { donorService } from '../../services/donorService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const CITY_COORDINATES = {
  mumbai: [19.076, 72.8777],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  delhi: [28.7041, 77.1025],
  hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567],
  chennai: [13.0827, 80.2707],
};

export default function FindDonorsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlBloodGroup = searchParams.get('bloodGroup') || 'ALL';

  const [filters, setFilters] = useState({
    bloodGroup: urlBloodGroup,
    city: 'ALL',
    search: '',
    maxDistance: 25,
    onlyAvailable: false,
    sortBy: 'distance',
  });

  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [profileModalDonor, setProfileModalDonor] = useState(null);
  const [requestModalDonor, setRequestModalDonor] = useState(null);
  const [hospitalName, setHospitalName] = useState('Lilavati Hospital, Mumbai');
  const [unitsNeeded, setUnitsNeeded] = useState(1);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const { addToast } = useToast();
  const { user } = useAuth();

  // Load donors whenever filters change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const queryFilters = {
      ...filters,
      userCity: user?.city || 'Mumbai',
      userArea: user?.area || null,
    };

    donorService
      .getDonors(queryFilters)
      .then((data) => {
        if (isMounted) {
          const maxDist = parseFloat(filters.maxDistance);
          const filtered =
            !isNaN(maxDist) && maxDist > 0 && Array.isArray(data)
              ? data.filter((d) => d.distanceKm != null && d.distanceKm <= maxDist)
              : data;
          setDonors(filtered || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [filters, user?.city, user?.area]);

  const getMapCenter = () => {
    if (filters.city && filters.city !== 'ALL') {
      const c = filters.city.toLowerCase().trim();
      if (CITY_COORDINATES[c]) return CITY_COORDINATES[c];
    }
    if (user?.city) {
      const c = user.city.toLowerCase().trim();
      if (CITY_COORDINATES[c]) return CITY_COORDINATES[c];
    }
    return [19.076, 72.8777];
  };

  // Sync URL search param if changed externally
  useEffect(() => {
    const bg = searchParams.get('bloodGroup');
    if (bg && bg !== filters.bloodGroup) {
      setFilters((prev) => ({ ...prev, bloodGroup: bg }));
    }
  }, [searchParams, filters.bloodGroup]);

  const handleResetFilters = () => {
    setFilters({
      bloodGroup: 'ALL',
      city: 'ALL',
      search: '',
      maxDistance: 25,
      onlyAvailable: false,
      sortBy: 'distance',
    });
    setSearchParams({});
  };

  const handleSendDirectRequest = async (e) => {
    e.preventDefault();
    if (!requestModalDonor) return;

    setIsSendingRequest(true);
    try {
      await donorService.sendDirectRequest(requestModalDonor.id, {
        hospitalName,
        unitsNeeded,
        isEmergency,
        requester: user?.name || user?.fullName || 'Verified Patient',
        patientName: user?.name || user?.fullName || 'Verified Patient',
      });

      addToast({
        title: 'Direct Request Dispatched!',
        message: `Notification sent to ${requestModalDonor.name} for ${requestModalDonor.bloodGroup} at ${hospitalName}.`,
        type: 'success',
      });

      setRequestModalDonor(null);
    } catch (err) {
      addToast({
        title: 'Request Failed',
        message: err.message || 'Could not deliver request.',
        type: 'error',
      });
    } finally {
      setIsSendingRequest(false);
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#C1123F] text-xs font-bold border border-rose-200 mb-2">
            <Heart className="w-3.5 h-3.5 fill-[#C1123F]" />
            <span>Verified Blood Donor Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172033] tracking-tight">
            Find Potential Blood Donors Near You
          </h1>
          <p className="text-sm text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
            Search for willing donors by blood group, geographic radius, and real-time availability. All donor profiles are privacy-shielded.
          </p>
        </div>

        {/* View Switcher Tabs: List vs Map */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-[#C1123F] shadow-sm'
                : 'text-slate-600 hover:text-[#172033]'
            }`}
          >
            <List className="w-4 h-4" />
            <span>List View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'map'
                ? 'bg-white text-[#C1123F] shadow-sm'
                : 'text-slate-600 hover:text-[#172033]'
            }`}
          >
            <Map className="w-4 h-4" />
            <span>Map View</span>
          </button>
        </div>
      </div>

      {/* Search Filters Bar */}
      <SearchFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        totalResults={donors.length}
      />

      {/* Medical Safety Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-800">
        <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Privacy & Safety Protocol:</strong> LIFORA safeguards donors by never disclosing personal phone numbers or home addresses. Initial requests are coordinated via encrypted notifications, and medical compatibility is tested by licensed blood bank technicians.
        </div>
      </div>

      {/* Main Results Display */}
      {loading ? (
        <LoadingSkeleton type="card" count={6} />
      ) : donors.length === 0 ? (
        <EmptyState
          title="No Matching Donors Found"
          description="We couldn't find any donors matching your selected blood group or distance radius. Try expanding your radius or selecting 'All Blood Groups'."
          actionLabel="Reset Search Filters"
          onAction={handleResetFilters}
        />
      ) : viewMode === 'map' ? (
        <div className="space-y-4">
          <DonorMap
            donors={donors}
            center={getMapCenter()}
            onSelectDonor={(donor) => setProfileModalDonor(donor)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            {donors.slice(0, 3).map((donor) => (
              <DonorCard
                key={donor.id}
                donor={donor}
                onViewProfile={(d) => setProfileModalDonor(d)}
                onSendRequest={(d) => setRequestModalDonor(d)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {donors.map((donor) => (
            <DonorCard
              key={donor.id}
              donor={donor}
              onViewProfile={(d) => setProfileModalDonor(d)}
              onSendRequest={(d) => setRequestModalDonor(d)}
            />
          ))}
        </div>
      )}

      {/* View Profile Modal */}
      {profileModalDonor && (
        <Modal
          isOpen={!!profileModalDonor}
          onClose={() => setProfileModalDonor(null)}
          title="Verified Donor Profile"
          subtitle="Privacy-safe donor credential overview"
          maxWidth="max-w-lg"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F04462] to-[#C1123F] text-white flex flex-col items-center justify-center font-extrabold shadow-md flex-shrink-0">
                <span className="text-xl leading-none">{profileModalDonor.bloodGroup}</span>
                <span className="text-[9px] uppercase tracking-wider opacity-80 mt-0.5">Type</span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-[#172033]">
                    {profileModalDonor.name}
                  </h3>
                  <StatusBadge status={profileModalDonor.badge} type="badge" size="sm" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profileModalDonor.area}, {profileModalDonor.city}</span>
                  <span>•</span>
                  <span>~{profileModalDonor.distanceKm} km away</span>
                </div>
              </div>
            </div>

            {/* Performance & Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block">Total Donations</span>
                <span className="text-base font-extrabold text-[#172033] mt-0.5 block">
                  {profileModalDonor.totalDonations}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block">Response Rate</span>
                <span className="text-base font-extrabold text-[#16A36A] mt-0.5 block">
                  {profileModalDonor.responseRate || '96%'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-400 block">Avg. Response</span>
                <span className="text-base font-extrabold text-blue-600 mt-0.5 block">
                  {profileModalDonor.avgResponseMinutes || 15}m
                </span>
              </div>
            </div>

            {/* Compatible Recipient Types */}
            <div>
              <span className="text-xs font-bold text-[#172033] block mb-2">
                Compatible Recipient Blood Types:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profileModalDonor.compatibility?.map((type) => (
                  <span
                    key={type}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-[#C1123F] font-bold text-xs border border-rose-200"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Medical disclaimer */}
            <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              * Note: Contact numbers are kept private. Sending a request will deliver a prioritized alert to the donor's mobile device with your hospital details.
            </p>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProfileModalDonor(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = profileModalDonor;
                  setProfileModalDonor(null);
                  setRequestModalDonor(d);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#C1123F] text-white text-xs font-bold hover:bg-[#9E0E32] shadow-sm flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Blood Request</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Send Request Modal */}
      {requestModalDonor && (
        <Modal
          isOpen={!!requestModalDonor}
          onClose={() => setRequestModalDonor(null)}
          title={`Request ${requestModalDonor.bloodGroup} Blood`}
          subtitle={`Dispatches an alert to ${requestModalDonor.name} (~${requestModalDonor.distanceKm} km away)`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSendDirectRequest} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1.5">
                Hospital Name & Location
              </label>
              <input
                type="text"
                required
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="e.g. Lilavati Hospital, Bandra Reclamation"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C1123F]/20 focus:border-[#C1123F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Units Needed
                </label>
                <select
                  value={unitsNeeded}
                  onChange={(e) => setUnitsNeeded(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value={1}>1 Unit</option>
                  <option value={2}>2 Units</option>
                  <option value={3}>3 Units</option>
                  <option value={4}>4 Units</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  Priority
                </label>
                <select
                  value={isEmergency ? 'emergency' : 'urgent'}
                  onChange={(e) => setIsEmergency(e.target.value === 'emergency')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-semibold"
                >
                  <option value="urgent">Urgent (Today)</option>
                  <option value="emergency">Critical Emergency</option>
                </select>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-[#64748B]">
              <span className="font-semibold text-slate-700">Notice: </span>
              A high-priority notification will be sent immediately to the donor. Hospital cross-matching will be confirmed upon arrival.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRequestModalDonor(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingRequest}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#C1123F] hover:bg-[#9E0E32] text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSendingRequest ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
