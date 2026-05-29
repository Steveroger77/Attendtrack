import React, { useEffect, useState } from 'react';

const NightCityLandscape: React.FC = () => {
  const [stars, setStars] = useState<{ id: number; cx: number; cy: number; r: number; delay: string }[]>([]);

  useEffect(() => {
    // Generate static but offset twinkling star coordinates to avoid high rendering recalculation overhead
    const generatedStars = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      cx: Math.random() * 100, // percentage of viewport width
      cy: Math.random() * 2100,  // top 2100px (sky region)
      r: 0.5 + Math.random() * 0.9,
      delay: `${(Math.random() * 4).toFixed(2)}s`
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div 
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-0 overflow-hidden"
      id="night-city-landscape-container"
    >
      {/* Full landscape canvas SVG wrapper */}
      <svg 
        className="w-full h-full absolute inset-0"
        viewBox="0 0 1600 3000" 
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sky Gradient matching the exact premium warm/midnight skyline profile */}
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" />     {/* Deep pure space black */}
            <stop offset="55%" stopColor="#030306" />    {/* Extreme dark night */}
            <stop offset="100%" stopColor="#07060a" />   {/* Seductive horizon dark */}
          </linearGradient>

          {/* Premium Glowing Filters for The Yellow Window Lights to Create 3D Glow / Bloom */}
          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.2" result="blur1" />
            <feGaussianBlur stdDeviation="3.0" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="extraGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="blur1" />
            <feGaussianBlur stdDeviation="5.0" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Path Light Gradient Wedge */}
          <linearGradient id="pathLightWedge" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="rgba(253, 186, 116, 0.12)" />  {/* Warm golden-yellow glow */}
            <stop offset="100%" stopColor="rgba(7, 6, 10, 0)" />       {/* Blends out */}
          </linearGradient>

          {/* Building Window Gradient (Glow effect emulation inside windows) */}
          <linearGradient id="windowGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ebdca3" />
            <stop offset="60%" stopColor="#bfa136" />
            <stop offset="100%" stopColor="#5f3e11" />
          </linearGradient>

          {/* Symmetrical Arch Doorway Gradient */}
          <linearGradient id="archDoorwayGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#efdf95" />
            <stop offset="50%" stopColor="#ad7f1f" />
            <stop offset="100%" stopColor="#5f3e11" />
          </linearGradient>

          {/* Building Shadows & Facades Gradients styled with absolute night charcoal & black */}
          <linearGradient id="schoolFacade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#050508" />
            <stop offset="50%" stopColor="#0d0d12" />
            <stop offset="100%" stopColor="#030305" />
          </linearGradient>

          <linearGradient id="buildingDark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#040406" />
            <stop offset="100%" stopColor="#010102" />
          </linearGradient>

          <linearGradient id="secondaryBuildingDark" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#030304" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          <linearGradient id="scenicMoonGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>

          <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="50%" stopColor="rgba(226, 232, 240, 0.03)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
        </defs>

        {/* 1. SKY BACKGROUND */}
        <rect width="1600" height="3000" fill="url(#skyGrad)" />

        {/* 2. TWINKLING STARS */}
        <g id="sparkling-stars-layer" className="opacity-60">
          {stars.map((star) => (
            <circle
              key={star.id}
              cx={`${star.cx}%`}
              cy={star.cy} 
              r={star.r}
              fill="#ffffff"
              className="animate-pulse"
              style={{
                animationDelay: star.delay,
                animationDuration: `${2.5 + star.id % 4}s`
              }}
            />
          ))}
        </g>

        {/* 3. SCENIC CRESCENT MOON */}
        <g id="crescent-moon" transform="translate(1330, 300)">
          <circle cx="0" cy="0" r="100" fill="url(#moonGlow)" />
          <path 
            d="M -30,-40 A 55,55 0 1,0 45,55 A 45,47 0 1,1 -30,-40 Z" 
            fill="url(#scenicMoonGrad)" 
            filter="drop-shadow(0px 0px 5px rgba(255, 255, 255, 0.2))"
          />
        </g>

        {/* 4. SILHOUETTES / FAR CITY MATRIX (Distant Horizon Detail) */}
        <g id="scenic-cityscape-bottom-composition" transform="translate(0, 2100)">
        <g id="far-city-layer" opacity="0.15">
          {/* Symmetrical skyscraper profiles on horizon */}
          <rect x="120" y="420" width="100" height="280" fill="#020204" />
          <rect x="250" y="380" width="80" height="320" fill="#010102" />
          <rect x="750" y="390" width="110" height="310" fill="#010102" />
          <rect x="860" y="340" width="4" height="60" fill="#010102" />  {/* mast */}
          <rect x="1280" y="430" width="120" height="270" fill="#020203" />
        </g>

        {/* 5. BACKGROUND GREENERY/TREES LAYERING - Removed for clean modern silhouette */}

        {/* ========================================================= */}
        {/* 6. FOREGROUND BUILDINGS (CRISP ARCHITECTURAL BLUEPRINTS)  */}
        {/* ========================================================= */}
        <g id="city-buildings-foreground-layer">

          {/* --------------------------------------------------------- */}
          {/* A. NEOCLASSICAL LIBRARY PALACE (Building Extreme Left)     */}
          {/* --------------------------------------------------------- */}
          <g id="neoclassical-palace" transform="translate(15, 532)">
            {/* Symmetrical Left Wing background block */}
            <rect x="0" y="210" width="60" height="150" fill="url(#secondaryBuildingDark)" />
            <rect x="-4" y="210" width="68" height="8" fill="#0d0d12" />
            <rect x="15" y="235" width="14" height="30" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4" rx="1" />
            <rect x="15" y="290" width="14" height="30" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4" rx="1" />

            {/* Main Neoclassical backing wall */}
            <rect x="60" y="170" width="280" height="190" fill="url(#buildingDark)" />
            
            {/* Grand Triangular Pediment top roof */}
            <polygon points="40,170 200,95 360,170" fill="#060608" stroke="#0c0c10" strokeWidth="4" />
            
            {/* Circular Medal Emblem in Center Pediment */}
            <circle cx="200" cy="140" r="18" fill="#020204" stroke="#0c0c10" strokeWidth="2" />
            <circle cx="200" cy="140" r="13" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.3" />
            <circle cx="200" cy="140" r="10" fill="#020204" />

            {/* Architrave support layer */}
            <rect x="50" y="170" width="300" height="18" fill="#0c0c10" />

            {/* Glowing Golden Windows behind the pillars (symmetrical columns) */}
            <g id="temple-windows" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4">
              <rect x="85" y="200" width="15" height="36" rx="2" />
              <rect x="85" y="260" width="15" height="36" rx="2" />

              <rect x="135" y="200" width="15" height="36" rx="2" />
              <rect x="135" y="260" width="15" height="36" rx="2" />

              <rect x="185" y="200" width="15" height="36" rx="2" />
              <rect x="185" y="260" width="15" height="36" rx="2" />

              <rect x="235" y="200" width="15" height="36" rx="2" />
              <rect x="235" y="260" width="15" height="36" rx="2" />

              <rect x="285" y="200" width="15" height="36" rx="2" />
              <rect x="285" y="260" width="15" height="36" rx="2" />
            </g>

            {/* Solid Greek Columns/Pillars casting shadow lines */}
            <g id="temple-columns" fill="url(#secondaryBuildingDark)" stroke="#010102" strokeWidth="1">
              <rect x="68" y="188" width="12" height="172" rx="1" />
              <rect x="118" y="188" width="12" height="172" rx="1" />
              <rect x="168" y="188" width="12" height="172" rx="1" />
              <rect x="218" y="188" width="12" height="172" rx="1" />
              <rect x="268" y="188" width="12" height="172" rx="1" />
              <rect x="318" y="188" width="12" height="172" rx="1" />
            </g>

            {/* Entrance steps at the base of columns */}
            <rect x="45" y="352" width="310" height="8" fill="#08080a" />
            <rect x="35" y="360" width="330" height="8" fill="#040405" />

            {/* Symmetrical Right Wing block */}
            <rect x="340" y="210" width="60" height="150" fill="url(#secondaryBuildingDark)" />
            <rect x="336" y="210" width="68" height="8" fill="#0d0d12" />
            <rect x="360" y="235" width="14" height="30" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4" rx="1" />
            <rect x="360" y="290" width="14" height="30" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4" rx="1" />
          </g>

          {/* --------------------------------------------------------- */}
          {/* B. RIBBED OBSERVATORY DOME (Building Center-Left)        */}
          {/* --------------------------------------------------------- */}
          <g id="observatory-dome" transform="translate(440, 590)">
            {/* Connecting corridor */}
            <rect x="-30" y="210" width="40" height="100" fill="#030305" />
            <rect x="-30" y="210" width="40" height="6" fill="#0d0d12" />

            {/* Cylinder tower foundation */}
            <rect x="10" y="140" width="180" height="170" fill="url(#buildingDark)" />
            <rect x="0" y="140" width="200" height="10" fill="#101014" />

            {/* Majestic ribbed dome hood */}
            <path d="M 20,140 A 80,72 0 0,1 180,140 Z" fill="url(#buildingDark)" stroke="#0b0b0e" strokeWidth="2" />
            
            {/* Curved ribs to project 3D rounded depth */}
            <path d="M 100,68 L 100,140" stroke="#07070a" strokeWidth="3" fill="none" />
            <path d="M 100,68 C 65,85 55,115 50,140" stroke="#07070a" strokeWidth="2.5" fill="none" />
            <path d="M 100,68 C 135,85 145,115 150,140" stroke="#07070a" strokeWidth="2.5" fill="none" />

            {/* Dome Peak Spire */}
            <line x1="100" y1="68" x2="100" y2="28" stroke="#0d0d12" strokeWidth="3" />
            <circle cx="100" cy="24" r="5" fill="#cca43b" filter="url(#softGlow)" opacity="0.7" />

            {/* Arched glowing windows under the dome */}
            <g id="dome-arched-windows" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4">
              <rect x="40" y="170" width="22" height="38" rx="11" />
              <rect x="89" y="170" width="22" height="38" rx="11" />
              <rect x="138" y="170" width="22" height="38" rx="11" />

              <rect x="48" y="240" width="18" height="32" rx="2" />
              <rect x="134" y="240" width="18" height="32" rx="2" />
            </g>

            {/* Door base */}
            <rect x="85" y="250" width="30" height="60" fill="#030305" />
            <rect x="88" y="255" width="24" height="55" fill="url(#windowGlow)" opacity="0.12" />
          </g>

          {/* --------------------------------------------------------- */}
          {/* MIDDLE GAP DETAILED CENTRAL BUILDING: CLOCK-SPIRE HALL     */}
          {/* --------------------------------------------------------- */}
          <g id="central-clock-spire-hall" transform="translate(650, 520)">
            {/* Flanking Left Wing block */}
            <rect x="0" y="200" width="70" height="180" fill="url(#secondaryBuildingDark)" />
            <rect x="0" y="200" width="70" height="8" fill="#0d0d12" />
            
            {/* Left Wing Windows */}
            <g fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4">
              <rect x="15" y="225" width="14" height="28" rx="1" />
              <rect x="40" y="225" width="14" height="28" rx="1" />
              <rect x="15" y="275" width="14" height="28" rx="1" />
              <rect x="40" y="275" width="14" height="28" rx="1" />
              <rect x="15" y="325" width="14" height="28" rx="1" />
              <rect x="40" y="325" width="14" height="28" rx="1" />
            </g>

            {/* Flanking Right Wing block */}
            <rect x="180" y="200" width="70" height="180" fill="url(#secondaryBuildingDark)" />
            <rect x="180" y="200" width="70" height="8" fill="#0d0d12" />

            {/* Right Wing Windows */}
            <g fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4">
              <rect x="195" y="225" width="14" height="28" rx="1" />
              <rect x="220" y="225" width="14" height="28" rx="1" />
              <rect x="195" y="275" width="14" height="28" rx="1" />
              <rect x="220" y="275" width="14" height="28" rx="1" />
              <rect x="195" y="325" width="14" height="28" rx="1" />
              <rect x="220" y="325" width="14" height="28" rx="1" />
            </g>

            {/* Main Central Tower Shaft */}
            <rect x="70" y="80" width="110" height="300" fill="url(#schoolFacade)" />
            
            {/* Pyramid Tower Roof */}
            <polygon points="55,80 125,5 195,80" fill="#040406" stroke="#0a0a0f" strokeWidth="4" />
            
            {/* Roof Pinnacle Spire */}
            <line x1="125" y1="5" x2="125" y2="-45" stroke="#0c0c10" strokeWidth="3" />
            <circle cx="125" cy="-48" r="4.5" fill="#cca43b" filter="url(#softGlow)" opacity="0.7" />

            {/* Classic Clock Face */}
            <circle cx="125" cy="120" r="22" fill="#010102" stroke="#0c0c10" strokeWidth="2" />
            <circle cx="125" cy="120" r="16" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.35" />
            {/* Hands */}
            <circle cx="125" cy="120" r="3" fill="#010102" />
            <line x1="125" y1="120" x2="131" y2="114" stroke="#010102" strokeWidth="2.5" />
            <line x1="125" y1="120" x2="125" y2="108" stroke="#010102" strokeWidth="1.8" />

            {/* Inner Tower Windows */}
            <g fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4">
              <rect x="90" y="170" width="15" height="40" rx="2" />
              <rect x="115" y="170" width="15" height="40" rx="2" />
              <rect x="140" y="170" width="15" height="40" rx="2" />
              
              <rect x="90" y="230" width="15" height="40" rx="2" />
              <rect x="115" y="230" width="15" height="40" rx="2" />
              <rect x="140" y="230" width="15" height="40" rx="2" />

              <rect x="90" y="290" width="15" height="40" rx="2" />
              <rect x="115" y="290" width="15" height="40" rx="2" />
              <rect x="140" y="290" width="15" height="40" rx="2" />
            </g>
          </g>

          {/* --------------------------------------------------------- */}
          {/* C. COLLEGIATE GOTHIC TOWER HALL (Building Center-Right)   */}
          {/* --------------------------------------------------------- */}
          <g id="collegiate-tower-complex" transform="translate(930, 510)">
            {/* Left wing block */}
            <rect x="0" y="190" width="120" height="200" fill="url(#buildingDark)" />
            <rect x="-5" y="190" width="130" height="10" fill="#0c0c10" />
            <polygon points="-5,190 60,140 125,190" fill="#050507" />
            <circle cx="60" cy="168" r="10" fill="#010102" />
            <circle cx="60" cy="168" r="7" fill="url(#windowGlow)" filter="url(#softGlow)" />

            <g id="left-wing-windows" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4">
              <rect x="22" y="215" width="18" height="35" rx="2" />
              <rect x="22" y="275" width="18" height="35" rx="2" />
              <rect x="22" y="335" width="18" height="30" rx="2" />

              <rect x="80" y="215" width="18" height="35" rx="2" />
              <rect x="80" y="275" width="18" height="35" rx="2" />
              <rect x="80" y="335" width="18" height="30" rx="2" />
            </g>

            {/* Central Tower structure */}
            <rect x="120" y="110" width="180" height="280" fill="url(#schoolFacade)" />
            
            {/* Pyramidal roof apex */}
            <polygon points="108,110 210,10 312,110" fill="#040406" stroke="#0a0a0f" strokeWidth="4" />
            
            {/* Decorative spires on left/right tower edges */}
            <polygon points="108,110 114,60 126,110" fill="#050507" />
            <polygon points="294,110 306,60 312,110" fill="#050507" />

            {/* The Bell Arch with actual Church Bell inside */}
            <path d="M 180,115 A 30,30 0 0,1 240,115 L 240,165 L 180,165 Z" fill="#010102" />
            <path d="M 180,115 A 30,30 0 0,1 240,115 L 240,165 L 180,165 Z" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4" />
            <path d="M 210,120 C 202,120 200,135 197,143 C 193,146 192,148 192,152 C 198,152 222,152 228,152 C 228,148 227,146 223,143 C 220,135 218,120 210,120 Z" fill="#050508" />
            <circle cx="210" cy="154" r="4.5" fill="#cca43b" filter="url(#softGlow)" opacity="0.7" /> {/* clapper */}

            {/* SMR vertical slot window matrix under the bell chamber */}
            <g id="tower-tall-windows" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4">
              <rect x="138" y="195" width="14" height="42" rx="2" />
              <rect x="162" y="195" width="14" height="42" rx="2" />
              <rect x="186" y="195" width="14" height="42" rx="2" />
              <rect x="210" y="195" width="14" height="42" rx="2" />
              <rect x="234" y="195" width="14" height="42" rx="2" />
              <rect x="258" y="195" width="14" height="42" rx="2" />
            </g>

            {/* GRAND DOUBLE-ARCHWAY PORTAL */}
            <g id="tower-entrance-portal">
              <path d="M 165,390 L 165,300 A 45,45 0 0,1 255,300 L 255,390 Z" fill="#010103" stroke="#050507" strokeWidth="4" />
              <path 
                d="M 169,390 L 169,304 A 41,41 0 0,1 251,304 L 251,390 Z" 
                fill="url(#archDoorwayGlow)" 
                filter="url(#extraGlow)" 
                opacity="0.3" 
              />
              <line x1="210" y1="263" x2="210" y2="390" stroke="#010102" strokeWidth="4" />
              <line x1="169" y1="345" x2="251" y2="345" stroke="#010102" strokeWidth="3" />
            </g>

            {/* Right wing block */}
            <rect x="300" y="190" width="120" height="200" fill="url(#buildingDark)" />
            <rect x="295" y="190" width="130" height="10" fill="#0c0c10" />
            <polygon points="295,190 360,140 425,190" fill="#050507" />
            <circle cx="360" cy="168" r="10" fill="#010102" />
            <circle cx="360" cy="168" r="7" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4" />

            <g id="right-wing-windows" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4">
              <rect x="322" y="215" width="18" height="35" rx="2" />
              <rect x="322" y="275" width="18" height="35" rx="2" />
              <rect x="322" y="335" width="18" height="30" rx="2" />

              <rect x="380" y="215" width="18" height="35" rx="2" />
              <rect x="380" y="275" width="18" height="35" rx="2" />
              <rect x="380" y="335" width="18" height="30" rx="2" />
            </g>
          </g>

          {/* --------------------------------------------------------- */}
          {/* D. LUXURY RESIDENTIAL HIGH-RISE FLAT (Building Far Right)  */}
          {/* --------------------------------------------------------- */}
          <g id="executive-sash-residence" transform="translate(1385, 475)">
            <rect x="0" y="45" width="205" height="380" fill="url(#buildingDark)" />
            <rect x="-8" y="45" width="221" height="15" fill="#0c0c10" />
            
            {/* Horizontal roof safety rails */}
            <path stroke="#0b0b0e" strokeWidth="3" d="M 12,25 L 12,45 M 62,25 L 62,45 M 112,25 L 112,45 M 162,25 L 162,45 M 12,25 L 180,25" />

            {/* Symmetrical matrix grid of double-sash windows */}
            <g id="sash-grid-windows" fill="url(#windowGlow)" filter="url(#softGlow)" opacity="0.4">
              {/* Storey 1 */}
              <rect x="25" y="85" width="25" height="42" rx="2" />
              <rect x="90" y="85" width="25" height="42" rx="2" />
              <rect x="155" y="85" width="25" height="42" rx="2" />

              {/* Storey 2 */}
              <rect x="25" y="155" width="25" height="42" rx="2" />
              <rect x="90" y="155" width="25" height="42" rx="2" />
              <rect x="155" y="155" width="25" height="42" rx="2" />

              {/* Storey 3 */}
              <rect x="25" y="225" width="25" height="42" rx="2" />
              <rect x="90" y="225" width="25" height="42" rx="2" />
              <rect x="155" y="225" width="25" height="42" rx="2" />

              {/* Storey 4 */}
              <rect x="25" y="295" width="25" height="42" rx="2" />
              <rect x="90" y="295" width="25" height="42" rx="2" />
              <rect x="155" y="295" width="25" height="42" rx="2" />

              {/* Storey 5 (partially hidden) */}
              <rect x="25" y="365" width="25" height="35" rx="2" />
              <rect x="90" y="365" width="25" height="35" rx="2" />
              <rect x="155" y="365" width="25" height="35" rx="2" />
            </g>

            {/* Flat commercial awning lights on street level */}
            <rect x="15" y="415" width="115" height="10" fill="url(#windowGlow)" filter="url(#extraGlow)" opacity="0.15" />
          </g>
        </g>

        {/* ========================================================= */}
        {/* 8. GRAND UNIVERSITY PLAZA FOREGROUND PATHWAY              */}
        {/* ========================================================= */}
        <g id="university-grand-courtyard">
          {/* Solid horizontal dark ground paving rect */}
          <rect x="0" y="890" width="1600" height="110" fill="#020204" />

          {/* Glowing Walkway Path Lamps & Golden Wedges Cast */}
          <g id="path-lights-and-wedges">
            {/* Lamp Post #1 Left Bottom */}
            <path d="M 480,900 L 460,860 L 452,860 L 472,900 Z" fill="url(#pathLightWedge)" />
            <circle cx="478" cy="890" r="5" fill="#cca43b" filter="url(#softGlow)" opacity="0.6" />
            <rect x="477" y="890" width="2" height="10" fill="#010103" />

            {/* Lamp Post #1 Right Bottom */}
            <path d="M 1090,900 L 1110,860 L 1118,860 L 1098,900 Z" fill="url(#pathLightWedge)" />
            <circle cx="1092" cy="890" r="5" fill="#cca43b" filter="url(#softGlow)" opacity="0.6" />
            <rect x="1091" y="890" width="2" height="10" fill="#010103" />

            {/* Lamp Post #2 Left Middle */}
            <path d="M 574,820 L 558,790 L 552,790 L 568,820 Z" fill="url(#pathLightWedge)" />
            <circle cx="572" cy="812" r="4.5" fill="#cca43b" filter="url(#softGlow)" opacity="0.6" />
            <rect x="571" y="812" width="2" height="8" fill="#010103" />

            {/* Lamp Post #2 Right Middle */}
            <path d="M 996,820 L 1012,790 L 1018,790 L 1002,820 Z" fill="url(#pathLightWedge)" />
            <circle cx="998" cy="812" r="4.5" fill="#cca43b" filter="url(#softGlow)" opacity="0.6" />
            <rect x="997" y="812" width="2" height="8" fill="#010103" />

            {/* Lamp Post #3 Left Top */}
            <path d="M 662,750 L 650,730 L 645,730 L 657,750 Z" fill="url(#pathLightWedge)" />
            <circle cx="661" cy="744" r="3.5" fill="#cca43b" filter="url(#softGlow)" opacity="0.6" />
            <rect x="660" y="744" width="1.5" height="6" fill="#010103" />

            {/* Lamp Post #3 Right Top */}
            <path d="M 908,750 L 920,730 L 925,730 L 913,750 Z" fill="url(#pathLightWedge)" />
            <circle cx="909" cy="744" r="3.5" fill="#cca43b" filter="url(#softGlow)" opacity="0.6" />
            <rect x="908" y="744" width="1.5" height="6" fill="#010103" />
          </g>
        </g>
        </g>
      </svg>
    </div>
  );
};

export default NightCityLandscape;
