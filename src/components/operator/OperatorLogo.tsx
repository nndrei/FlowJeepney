import React from 'react';

interface OperatorLogoProps {
  variant?: 'white' | 'red';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
}

export const OperatorVanIcon: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-8 h-8',
  color = '#DC2626',
}) => {
  return (
    <svg
      viewBox="0 0 100 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Speed Lines */}
      <path
        d="M6 24H28M2 40H22M8 56H26"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Modern Transit Jeepney / Van Silhouette */}
      <path
        d="M32 48L37 26C38 21.5 41.5 18 46 18H74C78.5 18 82 21.5 83.5 25.5L88 38C89.5 42 90 46 90 50V58C90 60 88.5 61.5 86.5 61.5H35.5C33.5 61.5 32 60 32 58V48Z"
        fill={color}
      />
      {/* Windshield */}
      <path
        d="M48 24H72C74.5 24 76.5 26 77.2 28.5L80.5 38H45L48 24Z"
        fill="white"
        opacity="0.95"
      />
      {/* Front Grille & Headlights */}
      <rect x="52" y="44" width="28" height="3" rx="1.5" fill="white" opacity="0.8" />
      <rect x="54" y="50" width="24" height="2.5" rx="1.2" fill="white" opacity="0.6" />
      <circle cx="44" cy="46" r="3" fill="#FEF08A" />
      <circle cx="84" cy="46" r="3" fill="#FEF08A" />
      {/* Bumper */}
      <rect x="42" y="56" width="45" height="3.5" rx="1.75" fill="white" opacity="0.9" />
      {/* Wheels */}
      <circle cx="42" cy="62" r="6" fill="#1E293B" />
      <circle cx="42" cy="62" r="2.5" fill="#E2E8F0" />
      <circle cx="78" cy="62" r="6" fill="#1E293B" />
      <circle cx="78" cy="62" r="2.5" fill="#E2E8F0" />
    </svg>
  );
};

export const OperatorLogo: React.FC<OperatorLogoProps> = ({
  variant = 'red',
  size = 'md',
  showSubtitle = true,
}) => {
  const isWhite = variant === 'white';
  const iconColor = isWhite ? '#FFFFFF' : '#DC2626';

  const sizeClasses = {
    sm: { icon: 'w-7 h-7', title: 'text-base', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', title: 'text-xl', sub: 'text-[11px]' },
    lg: { icon: 'w-14 h-14', title: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'w-20 h-20', title: 'text-3xl', sub: 'text-sm' },
  }[size];

  return (
    <div className="flex flex-col items-center select-none">
      <OperatorVanIcon className={sizeClasses.icon} color={iconColor} />
      <span
        className={`font-bold tracking-tight ${sizeClasses.title} ${
          isWhite ? 'text-white' : 'text-[#DC2626]'
        }`}
      >
        FlowJeep
      </span>
      {showSubtitle && (
        <span
          className={`font-medium tracking-wide uppercase mt-0.5 ${sizeClasses.sub} ${
            isWhite ? 'text-white/80' : 'text-slate-500'
          }`}
        >
          Operator Portal
        </span>
      )}
    </div>
  );
};
