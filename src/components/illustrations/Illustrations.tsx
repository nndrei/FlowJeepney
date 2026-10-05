import React from 'react';

/**
 * Splash Screen Mascot: Exact modernized electric commuter jeepney matching
 * user's mockup with maroon aerodynamic roof dome and white gloss reflection,
 * 5 distinct speed streaks, dark panoramic windshield, almond headlights with amber
 * projector, white aerodynamic body, front wheel hubcap, and soft ground shadow.
 */
export const SplashJeepGraphic: React.FC<{ className?: string }> = ({ className = 'w-56 h-44' }) => {
  return (
    <svg
      viewBox="0 0 220 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Maroon gradients */}
        <linearGradient id="exactRoofGrad" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#9C1438" />
          <stop offset="45%" stopColor="#800020" />
          <stop offset="100%" stopColor="#5C0016" />
        </linearGradient>

        <linearGradient id="exactBumperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8C0D2E" />
          <stop offset="100%" stopColor="#660018" />
        </linearGradient>

        <linearGradient id="exactWindshieldGrad" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#2D3748" />
          <stop offset="50%" stopColor="#1A202C" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <filter id="exactGroundGlow" x="-20%" y="-20%" width="140%" height="150%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>

      {/* 1. Ground Contact Shadow */}
      <ellipse cx="128" cy="154" rx="55" ry="5.5" fill="#94A3B8" opacity="0.4" filter="url(#exactGroundGlow)" />
      <ellipse cx="130" cy="154" rx="40" ry="3.5" fill="#64748B" opacity="0.3" />

      {/* 2. Five Maroon Speed Streaks (matching 02_ejeep_icon_exact) */}
      <g fill="#800020">
        {/* Row 1: Roofline */}
        <rect x="52" y="38" width="28" height="7" rx="3.5" />
        {/* Row 2: Upper Cabin */}
        <rect x="34" y="55" width="46" height="7.5" rx="3.75" />
        {/* Row 3: Mid Beltline (Detached dot + trail) */}
        <rect x="14" y="73" width="14" height="8" rx="4" />
        <rect x="36" y="73" width="42" height="8" rx="4" />
        {/* Row 4: Lower Door */}
        <rect x="30" y="91" width="48" height="7.5" rx="3.75" />
        {/* Row 5: Bumper Accent */}
        <rect x="52" y="107" width="18" height="6.5" rx="3.25" />
      </g>

      {/* 3. Aerodynamic Roof Dome (Maroon) */}
      <path
        d="M78 64C78 30 96 16 130 16H148C172 16 182 28 182 48V62H78V64Z"
        fill="url(#exactRoofGrad)"
      />
      {/* Roof Specular Shine Highlight */}
      <ellipse
        cx="106"
        cy="26"
        rx="10"
        ry="4"
        transform="rotate(-20 106 26)"
        fill="#FFFFFF"
        opacity="0.9"
      />

      {/* 4. White Cabin Structure (Rear pillar & side frame) */}
      <path
        d="M75 62H182C186 62 188 65 188 69L184 116C183.5 123 178 128 171 128H82C76 128 72 123 72 116V69C72 65 75 62 75 62Z"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1.2"
      />
      {/* Rear Maroon Pillar Accent */}
      <path d="M72 64H79V120H75C73 120 72 118 72 116V64Z" fill="#800020" />

      {/* 5. Side Driver Window */}
      <path
        d="M86 46C86 42 89 39 93 39H105C107 39 109 41 109 43V68H86V46Z"
        fill="#1E293B"
      />
      <rect x="89" y="50" width="3" height="9" rx="1.5" fill="#94A3B8" opacity="0.6" />

      {/* 6. Large Panoramic Front Windshield (occupies top half of front face) */}
      <path
        d="M115 36C115 33 118 32 121 32H171C175 32 177.5 34.5 176.5 39L168.5 76C167.5 78.5 165 80 162.5 80H116C114 80 112.5 78.5 113 76.5L115 36Z"
        fill="url(#exactWindshieldGrad)"
      />
      {/* Windshield Gloss Reflections */}
      <path d="M125 36L137 36L129 77L119 77L125 36Z" fill="#FFFFFF" opacity="0.14" />
      <path d="M141 36L149 36L142 77L136 77L141 36Z" fill="#FFFFFF" opacity="0.08" />

      {/* 7. White Front Fascia / Nose (compact automotive hood directly below windshield) */}
      <path
        d="M112 82H170C175 82 178 85 177 90L174 116C173.5 120 170.5 122.5 167 122.5H111C107.5 122.5 105.5 120 105.5 116V89C105.5 85 108 82 112 82Z"
        fill="#FFFFFF"
      />

      {/* 8. Headlights (Sitting directly on the front white nose) */}
      {/* Left Headlight (Angled Almond) */}
      <path
        d="M115 96C119 95 124 98 130 106C125 109 119 109 114 107C112 105 112 101 113 99C113.5 97.5 114.5 96.5 115 96Z"
        fill="#0F172A"
      />
      <circle cx="121" cy="102" r="2.2" fill="#38BDF8" opacity="0.75" />
      <circle cx="120" cy="101" r="1" fill="#FFFFFF" />

      {/* Right Headlight with Warm Glowing Amber Projector Bulb */}
      <path
        d="M161 96C166 99 168.5 102 169.5 106C165 108 159 107 154 104C156 100 158 97 161 96Z"
        fill="#0F172A"
      />
      <circle cx="163" cy="102" r="3.2" fill="#F59E0B" />
      <circle cx="163" cy="102" r="1.4" fill="#FEF3C7" />

      {/* 9. Lower Bumper (Maroon) */}
      <path
        d="M72 120H171C174.5 120 176 122.5 175 126L173 132C171.5 135.5 168.5 137.5 165 137.5H77C73.5 137.5 71.5 135 71 132L70.5 125C70 121.5 72 120 72 120Z"
        fill="url(#exactBumperGrad)"
      />

      {/* White License Slot / Intake Badge */}
      <rect
        x="126"
        y="121.5"
        width="30"
        height="7.5"
        rx="3"
        fill="#FFFFFF"
        stroke="#0F172A"
        strokeWidth="1.2"
      />

      {/* 10. Wheels & Rims */}
      {/* Front Left Wheel */}
      <ellipse cx="98" cy="136" rx="10" ry="13" fill="#0F172A" />
      <ellipse cx="98" cy="136" rx="5.5" ry="7" fill="#FFFFFF" />
      <circle cx="98" cy="136" r="2" fill="#64748B" />

      {/* Right Wheel (Rear peeking) */}
      <ellipse cx="156" cy="138" rx="7" ry="5" fill="#1E293B" />
    </svg>
  );
};

/**
 * City Skyline Silhouette for Splash & Onboarding
 * Buildings extended downward to guarantee zero white gap behind the wave
 */
export const CitySkylineGraphic: React.FC<{ className?: string }> = ({ className = 'w-full h-32' }) => {
  return (
    <svg
      viewBox="0 0 400 160"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Soft atmospheric gradient for background buildings */}
        <linearGradient id="skylineFadeBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.95" />
        </linearGradient>
        {/* Crisp foreground buildings gradient */}
        <linearGradient id="skylineFadeFront" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Soft background building layer */}
      <g fill="url(#skylineFadeBack)">
        <rect x="20" y="50" width="24" height="110" rx="2" />
        <rect x="50" y="65" width="20" height="95" rx="2" />
        <rect x="116" y="38" width="30" height="122" rx="2" />
        <polygon points="131,24 128,38 134,38" />
        <rect x="152" y="58" width="22" height="102" rx="2" />
        <rect x="232" y="44" width="28" height="116" rx="2" />
        <rect x="286" y="32" width="24" height="128" rx="2" />
        <polygon points="298,18 295,32 301,32" />
        <rect x="342" y="54" width="32" height="106" rx="2" />
      </g>

      {/* Foreground crisp skyline layer with tall center tower */}
      <g fill="url(#skylineFadeFront)">
        <rect x="0" y="72" width="24" height="88" rx="2" />
        <rect x="30" y="58" width="24" height="102" rx="2" />
        <rect x="60" y="70" width="32" height="90" rx="2" />
        <rect x="98" y="52" width="24" height="108" rx="2" />

        {/* Center Iconic Skyscraper with antenna spire */}
        <rect x="174" y="28" width="32" height="132" rx="3" />
        <polygon points="190,6 186,28 194,28" />
        <line x1="190" y1="0" x2="190" y2="6" stroke="#94A3B8" strokeWidth="2.5" />

        <rect x="212" y="56" width="28" height="104" rx="2" />
        <rect x="264" y="66" width="28" height="94" rx="2" />
        <rect x="314" y="60" width="30" height="100" rx="2" />
        <rect x="368" y="70" width="32" height="90" rx="2" />
      </g>
    </svg>
  );
};

/**
 * Bottom Organic Maroon Wave Graphic
 * Faithfully reproduces the asymmetric flowing curve & silk ribbon layering of the reference image:
 * Higher crest on the left curving down towards the center-right valley, then gently tapering up on the right.
 * Preserves the rich velvety maroon palette (#800020 and its luxurious tones).
 */
export const BottomMaroonWave: React.FC<{ className?: string }> = ({ className = 'w-full h-36' }) => {
  return (
    <svg
      viewBox="0 0 400 160"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Layer 1: Lighter, warm glowing maroon top ribbon crest */}
        <linearGradient id="maroonTopCrestGrad" x1="0%" y1="0%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#A31238" />
          <stop offset="35%" stopColor="#8A0022" />
          <stop offset="70%" stopColor="#800020" />
          <stop offset="100%" stopColor="#960E33" />
        </linearGradient>

        {/* Layer 2: Deep velvety maroon front wave gradient */}
        <linearGradient id="maroonFrontWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#82001F" />
          <stop offset="40%" stopColor="#6E001A" />
          <stop offset="100%" stopColor="#4A0011" />
        </linearGradient>

        {/* Subtle drop shadow between ribbon layers for true 3D depth */}
        <filter id="ribbonInnerShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2D000A" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Layer 1 (Back wave): High peak on left curving down into valley and tapering up on right */}
      <path
        d="M0 64C65 92 140 128 225 128C295 128 355 106 400 84V160H0V64Z"
        fill="url(#maroonTopCrestGrad)"
      />

      {/* Layer 1 Top Crest Highlight Sheen */}
      <path
        d="M0 64C65 92 140 128 225 128C295 128 355 106 400 84L400 87C355 109 295 131 225 131C140 131 65 95 0 67Z"
        fill="#FFFFFF"
        opacity="0.22"
      />

      {/* Layer 2 (Front wave): Flowing organic fold dipping slightly lower */}
      <path
        d="M0 88C75 108 155 136 245 136C315 136 365 122 400 108V160H0V88Z"
        fill="url(#maroonFrontWaveGrad)"
        filter="url(#ribbonInnerShadow)"
      />

      {/* Soft silk gloss contour along the front fold */}
      <path
        d="M0 88C75 108 155 136 245 136C315 136 365 122 400 108L400 111C365 125 315 139 245 139C155 139 75 111 0 91Z"
        fill="#FFFFFF"
        opacity="0.12"
      />
    </svg>
  );
};

/**
 * Onboarding Slide 1: Real-Time Jeepney Tracking Graphic
 * Circular vignette with city silhouette, road, modernized maroon jeepney, and maroon GPS beacon pin.
 */
export const TrackingGraphic: React.FC<{ className?: string }> = ({ className = 'w-64 h-64' }) => {
  return (
    <svg
      viewBox="0 0 280 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Soft circular background vignette */}
      <circle cx="140" cy="130" r="100" fill="#F1F5F9" />

      {/* City silhouette inside vignette */}
      <g fill="#E2E8F0" opacity="0.9">
        <rect x="80" y="90" width="16" height="60" rx="1" />
        <rect x="100" y="75" width="22" height="75" rx="1" />
        <polygon points="111,62 108,75 114,75" />
        <rect x="126" y="85" width="18" height="65" rx="1" />
        <rect x="160" y="80" width="20" height="70" rx="1" />
        <rect x="184" y="95" width="16" height="55" rx="1" />
      </g>

      {/* Curving Asphalt Road */}
      <path
        d="M60 160C100 152 180 152 220 164L230 195C170 185 90 185 50 195L60 160Z"
        fill="#CBD5E1"
      />
      {/* Road Center dashes */}
      <path
        d="M80 174C115 168 165 168 200 178"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeDasharray="6 6"
      />

      {/* Modernized Commuter Jeepney (Maroon) */}
      <g transform="translate(68, 102)">
        {/* Shadow */}
        <ellipse cx="64" cy="58" rx="60" ry="7" fill="#94A3B8" opacity="0.4" />

        {/* Roof / Body Top in Maroon */}
        <path
          d="M6 26C8 18 16 12 28 12H96C112 12 120 18 124 26L126 44C126 48 124 50 120 50H6C4 50 2 48 2 44L6 26Z"
          fill="#800020"
        />
        {/* Side windows strip */}
        <rect x="14" y="19" width="70" height="14" rx="2" fill="#1E293B" />
        <rect x="18" y="21" width="10" height="10" fill="#38BDF8" opacity="0.4" />
        <rect x="32" y="21" width="10" height="10" fill="#38BDF8" opacity="0.4" />
        <rect x="46" y="21" width="10" height="10" fill="#38BDF8" opacity="0.4" />
        <rect x="60" y="21" width="10" height="10" fill="#38BDF8" opacity="0.4" />

        {/* Front windshield */}
        <path
          d="M88 18H106C112 18 116 21 117 26L119 33H88V18Z"
          fill="#0F172A"
        />

        {/* Lower body white accent stripe */}
        <rect x="6" y="37" width="118" height="4" fill="#FFFFFF" opacity="0.9" />

        {/* Front Headlights */}
        <circle cx="121" cy="41" r="3" fill="#FBBF24" />

        {/* Wheels */}
        <circle cx="28" cy="52" r="8" fill="#1E293B" />
        <circle cx="28" cy="52" r="4" fill="#94A3B8" />
        <circle cx="98" cy="52" r="8" fill="#1E293B" />
        <circle cx="98" cy="52" r="4" fill="#94A3B8" />
      </g>

      {/* Floating GPS Location Pin in Maroon */}
      <g transform="translate(180, 52)">
        {/* Glow / Pulse ring */}
        <circle cx="14" cy="18" r="16" fill="#800020" opacity="0.15" />
        {/* Dashed anchor connector */}
        <line x1="14" y1="36" x2="14" y2="70" stroke="#800020" strokeWidth="2" strokeDasharray="3 3" />
        {/* Pin Shape */}
        <path
          d="M14 6C7.5 6 2 11.5 2 18C2 27 14 38 14 38C14 38 26 27 26 18C26 11.5 20.5 6 14 6Z"
          fill="#800020"
        />
        <circle cx="14" cy="17" r="4" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

/**
 * Onboarding Slide 2: Check Passenger Load Graphic
 * Passenger avatars with load status badge and front-facing modernized maroon jeepney.
 */
export const PassengerLoadGraphic: React.FC<{ className?: string }> = ({ className = 'w-64 h-64' }) => {
  return (
    <svg
      viewBox="0 0 280 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background soft glow card */}
      <rect x="40" y="25" width="200" height="210" rx="24" fill="#F8FAFC" />

      {/* Top passenger load indicator card (Maroon tinted) */}
      <rect x="65" y="40" width="70" height="48" rx="10" fill="#FDF2F4" stroke="#F1D1D8" strokeWidth="1" />
      {/* 2 Top Passengers */}
      <g fill="#800020">
        {/* Person 1 */}
        <circle cx="85" cy="54" r="6" />
        <path d="M76 72C76 66 80 63 85 63C90 63 94 66 94 72H76Z" />

        {/* Person 2 */}
        <circle cx="112" cy="54" r="6" />
        <path d="M103 72C103 66 107 63 112 63C117 63 121 66 121 72H103Z" />
      </g>

      {/* Passenger queue / row below (4 passengers) */}
      <g fill="#800020" transform="translate(42, 100)">
        {/* Person A */}
        <circle cx="18" cy="10" r="6.5" />
        <path d="M8 29C8 22 12.5 19 18 19C23.5 19 28 22 28 29H8Z" />

        {/* Person B */}
        <circle cx="44" cy="10" r="6.5" />
        <path d="M34 29C34 22 38.5 19 44 19C49.5 19 54 22 54 29H34Z" />

        {/* Person C */}
        <circle cx="70" cy="10" r="6.5" />
        <path d="M60 29C60 22 64.5 19 70 19C75.5 19 80 22 80 29H60Z" />

        {/* Person D */}
        <circle cx="96" cy="10" r="6.5" />
        <path d="M86 29C86 22 90.5 19 96 19C101.5 19 106 22 106 29H86Z" />
      </g>

      {/* Frontal View of Modern Jeepney in Maroon */}
      <g transform="translate(150, 78)">
        {/* Shadow */}
        <ellipse cx="40" cy="88" rx="35" ry="5" fill="#CBD5E1" />

        {/* Roof Cap */}
        <path
          d="M16 10C16 6 22 4 40 4C58 4 64 6 64 10L68 24H12L16 10Z"
          fill="#800020"
        />

        {/* Windshield */}
        <path
          d="M14 26H66C68 26 69 28 68.5 30L65 52C64.5 54 63 55 61 55H19C17 55 15.5 54 15 52L11.5 30C11 28 12 26 14 26Z"
          fill="#0F172A"
        />
        {/* Windshield divider / mirror */}
        <line x1="40" y1="26" x2="40" y2="55" stroke="#334155" strokeWidth="1.5" />

        {/* Front Hood / Body */}
        <path
          d="M11 56H69C72 56 74 58 74 61V76C74 80 71 83 67 83H13C9 83 6 80 6 76V61C6 58 8 56 11 56Z"
          fill="#800020"
        />

        {/* Front Grille */}
        <rect x="22" y="65" width="36" height="12" rx="3" fill="#FFFFFF" />
        <line x1="26" y1="71" x2="54" y2="71" stroke="#800020" strokeWidth="2" strokeDasharray="3 2" />

        {/* Headlights */}
        <rect x="10" y="62" width="8" height="8" rx="2" fill="#FBBF24" />
        <rect x="62" y="62" width="8" height="8" rx="2" fill="#FBBF24" />

        {/* Tires */}
        <rect x="12" y="80" width="8" height="8" rx="2" fill="#1E293B" />
        <rect x="60" y="80" width="8" height="8" rx="2" fill="#1E293B" />
      </g>
    </svg>
  );
};

/**
 * Onboarding Slide 3: Smarter Routes & Demand Map Graphic
 * Clean street grid card with maroon path, GPS pin, and demand bar chart widget badge.
 */
export const RouteDemandGraphic: React.FC<{ className?: string }> = ({ className = 'w-64 h-64' }) => {
  return (
    <svg
      viewBox="0 0 280 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Map Card Container */}
      <rect x="35" y="30" width="210" height="190" rx="22" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* Map street grid lines */}
      <g stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round">
        {/* Diagonal main avenues */}
        <line x1="50" y1="60" x2="230" y2="150" />
        <line x1="80" y1="40" x2="220" y2="180" />
        <line x1="40" y1="140" x2="180" y2="210" />

        {/* Crossing secondary streets */}
        <line x1="70" y1="180" x2="160" y2="50" />
        <line x1="120" y1="210" x2="220" y2="70" />
        <line x1="170" y1="210" x2="240" y2="120" />
      </g>

      {/* Route Path (Maroon) */}
      <path
        d="M65 75L105 115L135 98L175 160L205 135L220 110"
        stroke="#800020"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dashed accent along route */}
      <path
        d="M65 75L105 115L135 98L175 160L205 135L220 110"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        strokeLinecap="round"
      />

      {/* Intermediate Waypoint nodes */}
      <circle cx="105" cy="115" r="4" fill="#FFFFFF" stroke="#800020" strokeWidth="2" />
      <circle cx="135" cy="98" r="4" fill="#FFFFFF" stroke="#800020" strokeWidth="2" />
      <circle cx="175" cy="160" r="4" fill="#FFFFFF" stroke="#800020" strokeWidth="2" />

      {/* Start Location Pin (Maroon) */}
      <g transform="translate(53, 50)">
        <path
          d="M12 4C7 4 3 8 3 13C3 20 12 28 12 28C12 28 21 20 21 13C21 8 17 4 12 4Z"
          fill="#800020"
        />
        <circle cx="12" cy="12" r="3.5" fill="#FFFFFF" />
      </g>

      {/* Destination Demand Bar Chart Widget Badge */}
      <g transform="translate(195, 78)">
        {/* Floating rounded badge */}
        <rect x="0" y="0" width="36" height="34" rx="8" fill="#FFFFFF" stroke="#800020" strokeWidth="1.8" />
        {/* Rising Demand Bars (Maroon) */}
        <rect x="8" y="18" width="4" height="8" rx="1.5" fill="#800020" />
        <rect x="16" y="12" width="4" height="14" rx="1.5" fill="#800020" />
        <rect x="24" y="7" width="4" height="19" rx="1.5" fill="#800020" />
      </g>
    </svg>
  );
};
