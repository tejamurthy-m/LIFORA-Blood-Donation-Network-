import React from 'react';
import { Link } from 'react-router-dom';

export default function LiforaLogo({
  variant = 'default', // 'default', 'light', 'minimal'
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  withText = true,
  withTagline = false,
  className = '',
  to = '/'
}) {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', tagline: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-2xl', tagline: 'text-[11px]' },
    lg: { icon: 'w-11 h-11', text: 'text-3xl', tagline: 'text-xs' },
    xl: { icon: 'w-14 h-14', text: 'text-4xl', tagline: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const logoIcon = (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${currentSize.icon}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="liforaGradPrimary" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F04462" />
            <stop offset="100%" stopColor="#C1123F" />
          </linearGradient>
          <linearGradient id="liforaDropGrad" x1="40" y1="35" x2="60" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FFE4E8" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Outer stylized heart envelope */}
        <path
          d="M50 87C50 87 16 63 16 37C16 23.5 26.5 14 39.5 14C45.8 14 50 17.5 50 17.5C50 17.5 54.2 14 60.5 14C73.5 14 84 23.5 84 37C84 63 50 87 50 87Z"
          fill="url(#liforaGradPrimary)"
        />

        {/* Soft light reflection highlight on top-left of heart */}
        <path
          d="M26 27C21 34 22 45 28 55"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeOpacity="0.35"
        />

        {/* Inner pure blood drop suspended at center */}
        <path
          d="M50 31C50 31 38 48 38 58C38 64.6 43.4 70 50 70C56.6 70 62 64.6 62 58C62 48 50 31 50 31Z"
          fill="url(#liforaDropGrad)"
        />

        {/* Core blood droplet dot */}
        <circle cx="50" cy="58" r="4.2" fill="#C1123F" />
      </svg>
    </div>
  );

  const content = (
    <div className={`group inline-flex items-center gap-2.5 select-none transition-all duration-200 ${className}`}>
      {logoIcon}
      {withText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center">
            <span
              className={`font-extrabold tracking-tight ${currentSize.text} ${
                variant === 'light' ? 'text-white' : 'text-[#172033]'
              }`}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              LIFORA
            </span>
          </div>
          {withTagline && (
            <span
              className={`font-medium tracking-wider uppercase mt-1 ${currentSize.tagline} ${
                variant === 'light' ? 'text-slate-300' : 'text-[#64748B]'
              }`}
            >
              Blood Donation Network
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-block focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
