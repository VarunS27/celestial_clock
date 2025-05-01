
"use client";

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTime } from '@/context/time-context'; // Import useTime hook

export function CelestialBackground() {
  // Get currentTime from context instead of local state
  const { effectiveTime: currentTime } = useTime();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient to true only on the client-side after mount
    // This ensures currentTime from context is ready before rendering dynamic parts
    setIsClient(true);
  }, []);

  // Use a default background if not client-side or currentTime isn't set yet
  const defaultBackground = <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-200 to-blue-400" />;

  if (!isClient || !currentTime) {
    return defaultBackground; // Render default background during SSR or initial client render
  }

  // Keep existing calculations based on the currentTime from context
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const totalSecondsInDay = 24 * 3600;

  // Calculate percentage of the day passed (0 to 1)
  const dayPercentage = totalSeconds / totalSecondsInDay;

  // Determine icon and position based on time
  const sunriseTime = 6 / 24; // 6 AM as a fraction of the day
  const sunsetTime = 18 / 24; // 6 PM as a fraction of the day

  const isDay = dayPercentage >= sunriseTime && dayPercentage < sunsetTime;
  const IconComponent = isDay ? Sun : Moon;

  // --- Arc Position Calculation ---
  let angleRadians = 0;
  const arcRadiusVW = 45; // Use vw for radius to scale with width
  const arcCenterYVH = 50; // Position arc center vertically in the middle (50vh)

  if (isDay) {
    // Daytime: Sun moves from left (180 deg) to right (0 deg) between sunrise and sunset
    const dayProgress = (dayPercentage - sunriseTime) / (sunsetTime - sunriseTime);
    const angleDegrees = 180 - (dayProgress * 180);
    angleRadians = angleDegrees * (Math.PI / 180);
  } else {
    // Nighttime: Moon moves similarly from left to right
    const nightDuration = (1 - sunsetTime) + sunriseTime; // Total duration of night
    let nightProgress = 0;
    if (dayPercentage >= sunsetTime) { // Evening part of night
      nightProgress = (dayPercentage - sunsetTime) / nightDuration;
    } else { // Morning part of night (after midnight)
      nightProgress = ((1 - sunsetTime) + dayPercentage) / nightDuration;
    }
    const angleDegrees = 180 - (nightProgress * 180);
    angleRadians = angleDegrees * (Math.PI / 180);
  }

  // Calculate X and Y position on the arc
  // X: 50vw is center, + cos(angle) * radius
  // Y: arcCenterYVH is base (now 50vh), - sin(angle) * radius (sin is positive in the upper semicircle, Y decreases upwards)
  // We use vw for radius to maintain aspect ratio relative to width
  const iconX = 50 + Math.cos(angleRadians) * arcRadiusVW;
  // Adjust Y radius based on approx 16:9 aspect ratio to make the arc appear more circular on screen
  // Multiplication factor (9/16) converts vw radius to vh equivalent for Y calculation
  const iconY = arcCenterYVH - Math.sin(angleRadians) * arcRadiusVW * (9/16);

  const iconStyle = {
    position: 'absolute' as const,
    left: `${iconX}vw`,
    top: `${iconY}vh`,
    // Use transform to center the icon itself on the calculated point
    transform: 'translate(-50%, -50%)',
    transition: 'left 1000ms linear, top 1000ms linear, color 1000ms linear', // Smooth movement
    filter: isDay ? 'drop-shadow(0 0 15px hsl(var(--sun) / 0.8))' : 'drop-shadow(0 0 10px hsl(var(--moon) / 0.6))',
  };
  // --- End Arc Position Calculation ---


  // Background Gradient Calculation - Use hsl CSS variables
   const getGradientColors = () => {
       // Define transition windows around sunrise and sunset (e.g., 1 hour window = 1/24 = ~0.0417)
       const transitionFraction = 1 / 24; // 1 hour fraction of the day
       const sunriseStart = sunriseTime - transitionFraction / 2;
       const sunriseEnd = sunriseTime + transitionFraction / 2;
       const sunsetStart = sunsetTime - transitionFraction / 2;
       const sunsetEnd = sunsetTime + transitionFraction / 2;

       // Helper for interpolation
       const interpolate = (start: number[], end: number[], factor: number): number[] => {
           // Ensure factor is clamped between 0 and 1
           const clampedFactor = Math.max(0, Math.min(1, factor));
           return start.map((s, i) => s + (end[i] - s) * clampedFactor);
       };


       // Parse HSL string 'hsl(H S% L% / A)' to [H, S, L, A] numbers
       const parseHsl = (hslString: string): number[] | null => {
          // Regex updated to handle optional alpha and potential float values robustly
           const match = hslString.match(
               /hsl\(\s*(\d+(\.\d+)?)\s+(\d+(\.\d+)?)%\s+(\d+(\.\d+)?)%\s*(?:\/\s*(\d+(\.\d+)?)\s*)?\)/
           );
           if (!match) return null;
           return [
               parseFloat(match[1]), // H
               parseFloat(match[3]), // S
               parseFloat(match[5]), // L
               match[7] ? parseFloat(match[7]) : 1, // A (default to 1 if missing)
           ];
       };


       // Convert [H, S, L, A] numbers back to HSL string
       const formatHsl = (hslArray: number[]): string => {
           // Round values for cleaner output, handle potential NaN/Infinity
           const h = Number(hslArray[0]?.toFixed(1) || 0);
           const s = Number(hslArray[1]?.toFixed(1) || 0);
           const l = Number(hslArray[2]?.toFixed(1) || 0);
           const a = Number(hslArray[3]?.toFixed(2) || 1);
           return `hsl(${h} ${s}% ${l}% / ${a})`;
       };


       // Get computed styles for the CSS variables
       let daySkyHslStr = 'hsl(195 53% 75%)'; // Default fallback
       let nightSkyHslStr = 'hsl(220 30% 15%)';
       let accentStartHslStr = 'hsl(30 100% 70%)';
       let accentEndHslStr = 'hsl(210 50% 70%)'; // Typically horizon color

       // Only access computedStyle on the client side
       if (typeof window !== 'undefined') {
           const computedStyle = getComputedStyle(document.documentElement);
           daySkyHslStr = computedStyle.getPropertyValue('--day-sky').trim() || daySkyHslStr;
           nightSkyHslStr = computedStyle.getPropertyValue('--night-sky').trim() || nightSkyHslStr;
           accentStartHslStr = computedStyle.getPropertyValue('--accent-start').trim() || accentStartHslStr;
           accentEndHslStr = computedStyle.getPropertyValue('--accent-end').trim() || accentEndHslStr;
       }

       // Parse colors, providing default fallbacks if parsing fails
       const daySky = parseHsl(daySkyHslStr) || [195, 53, 75, 1];
       const nightSky = parseHsl(nightSkyHslStr) || [220, 30, 15, 1];
       const accentStart = parseHsl(accentStartHslStr) || [30, 100, 70, 1]; // Orange
       const accentEnd = parseHsl(accentEndHslStr) || [210, 50, 70, 1];   // Light blue horizon

       let fromColorArr = nightSky;
       let toColorArr = nightSky; // Default to night horizon

       if (dayPercentage > sunriseEnd && dayPercentage < sunsetStart) {
           // Pure Daytime
           fromColorArr = daySky;
           toColorArr = accentEnd; // Light blue horizon during day
       } else if (dayPercentage >= sunriseStart && dayPercentage <= sunriseEnd) {
           // Sunrise Transition
           const progress = (dayPercentage - sunriseStart) / transitionFraction;
           // Transition from night sky towards accent start (orange) at the top
           fromColorArr = interpolate(nightSky, accentStart, progress);
            // Transition from night sky (horizon) towards accent end (blueish horizon)
           toColorArr = interpolate(nightSky, accentEnd, progress);
       } else if (dayPercentage >= sunsetStart && dayPercentage <= sunsetEnd) {
           // Sunset Transition
           const progress = (dayPercentage - sunsetStart) / transitionFraction;
            // Transition from day sky/accent start (orange peak) towards night sky
           fromColorArr = interpolate(accentStart, nightSky, progress);
            // Transition from accent end (blueish horizon) towards night sky (horizon)
           toColorArr = interpolate(accentEnd, nightSky, progress);
       }
       // Else: Pure Night time (default nightSky colors are already set)

       return { fromColor: formatHsl(fromColorArr), toColor: formatHsl(toColorArr) };
   };


  const { fromColor, toColor } = getGradientColors();
  const backgroundStyle = {
    background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
    transition: 'background 1000ms linear', // Smooth gradient transition
  };


  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden" // Keep overflow hidden
      style={backgroundStyle}
    >
      {/* Render the icon directly positioned */}
      <IconComponent
         className={cn(
           'w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20',
           // Apply HSL colors directly
           isDay ? 'text-[hsl(var(--sun))]' : 'text-[hsl(var(--moon))]'
         )}
         style={iconStyle} // Apply calculated position and transition
       />

      {/* Stars component only shown at night */}
      {!isDay && <Stars />}
    </div>
  );
}


// Simple Stars component for nighttime background
const Stars = () => {
  const [stars, setStars] = useState<Array<{ top: string; left: string; size: string; delay: string }>>([]);

  useEffect(() => {
    const numStars = 50;
    const generateStars = () => {
      const newStars = Array.from({ length: numStars }).map(() => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 1.5 + 0.5}px`, // Star size between 0.5px and 2px
        delay: `${Math.random() * 5}s`, // Random animation delay
      }));
      setStars(newStars);
    };
    generateStars();
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {stars.map((star, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-white"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: Math.random() * 0.5 + 0.3, // Random static opacity
          }}
        />
      ))}
    </div>
  );
};

    
