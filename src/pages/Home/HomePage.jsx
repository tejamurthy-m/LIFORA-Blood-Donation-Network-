import React from 'react';
import HeroSection from '../../components/landing/HeroSection';
import ImpactStats from '../../components/landing/ImpactStats';
import HowItWorks from '../../components/landing/HowItWorks';
import BloodGroupsSection from '../../components/landing/BloodGroupsSection';
import EmergencyBanner from '../../components/landing/EmergencyBanner';
import WhyChooseSection from '../../components/landing/WhyChooseSection';
import TestimonialsSection from '../../components/landing/TestimonialsSection';

export default function HomePage() {
  return (
    <div className="space-y-0">
      <HeroSection />
      <ImpactStats />
      <HowItWorks />
      <BloodGroupsSection />
      <EmergencyBanner />
      <WhyChooseSection />
      <TestimonialsSection />
    </div>
  );
}
