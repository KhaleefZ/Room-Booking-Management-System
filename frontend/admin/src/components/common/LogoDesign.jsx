import React from 'react';

const LogoDesign = ({ className = "h-10 w-auto", color = "currentColor" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Abstract Building/Residency Design */}
      <path 
        d="M20 80V30L50 15L80 30V80" 
        stroke={color} 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M35 80V40L50 32L65 40V80" 
        stroke={color} 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M50 15V80" 
        stroke={color} 
        strokeWidth="2" 
        strokeDasharray="4 4"
      />
      {/* Decorative elements representing 'Intelligence' or 'Management' */}
      <rect x="42" y="45" width="16" height="4" rx="1" fill={color} />
      <rect x="42" y="55" width="16" height="4" rx="1" fill={color} />
      <rect x="42" y="65" width="16" height="4" rx="1" fill={color} />
    </svg>
  );
};

export default LogoDesign;
