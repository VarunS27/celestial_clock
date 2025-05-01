
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


  // Calculate rotation angle based on time
  let angle = 0;
  const fullDayDegrees = 360; // A full day cycle maps to 360 degrees rotation
  const cycleStartOffset = sunriseTime * fullDayDegrees; // Offset rotation so sunrise is at the horizon start

  // The angle progresses through 360 degrees over 24 hours.
  // We subtract the offset so that 6 AM corresponds to 0 degrees effective rotation for positioning.
  angle = (dayPercentage * fullDayDegrees - cycleStartOffset + 360) % 360;

  // Position the icon along a 180-degree arc across the top half
  // Map the 360-degree angle to the visual 180-degree arc movement
  // 0 degrees (sunrise) -> transform rotate -90deg
  // 180 degrees (midday) -> transform rotate 0deg
  // 360 degrees (next sunrise) -> transform rotate 270deg (or -90deg)
  // We want angle 0 (sunrise) to map to -90deg rotation, angle 180 (midday) to 0deg, angle 360 (next sunrise) to -90deg.
  // However, the visual arc is only 180 degrees wide. Sun/Moon rises at the left (-90), peaks at top (0), sets at right (+90).
  // Let's simplify: Use dayPercentage directly for arc position.
  // Map 0 (midnight) to 360 (next midnight).
  const rotationAngle = dayPercentage * 360 - 90; // Rotate container so 6am is at -90deg (left horizon)


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
           return start.map((s, i) => s + (end[i] - s) * factor);
       };

       // Parse HSL string 'hsl(H S% L% / A)' to [H, S, L, A] numbers
       const parseHsl = (hslString: string): number[] | null => {
           const match = hslString.match(/hsl\((\d+(\.\d+)?)\s+(\d+(\.\d+)?)%\s+(\d+(\.\d+)?)%(?:\s*\/\s*(\d+(\.\d+)?))?\)/);
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
           return `hsl(${hslArray[0]} ${hslArray[1]}% ${hslArray[2]}% / ${hslArray[3]})`;
       };

       // Get computed styles for the CSS variables
       let daySkyHslStr = 'hsl(195 53% 75%)'; // Default fallback
       let nightSkyHslStr = 'hsl(220 30% 15%)';
       let accentStartHslStr = 'hsl(30 100% 70%)';
       let accentEndHslStr = 'hsl(210 50% 70%)'; // Typically horizon color

       if (typeof window !== 'undefined') {
           const computedStyle = getComputedStyle(document.documentElement);
           daySkyHslStr = computedStyle.getPropertyValue('--day-sky').trim() || daySkyHslStr;
           nightSkyHslStr = computedStyle.getPropertyValue('--night-sky').trim() || nightSkyHslStr;
           accentStartHslStr = computedStyle.getPropertyValue('--accent-start').trim() || accentStartHslStr;
           accentEndHslStr = computedStyle.getPropertyValue('--accent-end').trim() || accentEndHslStr;
       }

       const daySky = parseHsl(daySkyHslStr) || [195, 53, 75, 1];
       const nightSky = parseHsl(nightSkyHslStr) || [220, 30, 15, 1];
       const accentStart = parseHsl(accentStartHslStr) || [30, 100, 70, 1]; // Orange
       const accentEnd = parseHsl(accentEndHslStr) || [210, 50, 70, 1];   // Light blue horizon

       let fromColorArr = nightSky;
       let toColorArr = nightSky;

       if (dayPercentage > sunriseEnd && dayPercentage < sunsetStart) {
           // Pure Daytime
           fromColorArr = daySky;
           toColorArr = accentEnd; // Light blue horizon during day
       } else if (dayPercentage >= sunriseStart && dayPercentage <= sunriseEnd) {
           // Sunrise Transition
           const progress = (dayPercentage - sunriseStart) / transitionFraction;
           // Transition from night sky to accent start (orange) at the top
           fromColorArr = interpolate(nightSky, accentStart, progress);
           // Transition from night sky (horizon) to accent end (blueish horizon)
           toColorArr = interpolate(nightSky, accentEnd, progress);
       } else if (dayPercentage >= sunsetStart && dayPercentage <= sunsetEnd) {
           // Sunset Transition
           const progress = (dayPercentage - sunsetStart) / transitionFraction;
           // Transition from accent start (orange peak) to night sky
           fromColorArr = interpolate(accentStart, nightSky, progress);
           // Transition from accent end (blueish horizon) to night sky (horizon)
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

  // Use a consistent transition duration for icon movement
  const iconTransitionDuration = '1000ms'; // Match potential time update interval

  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden"
      style={backgroundStyle}
    >
      {/* The rotating arc container */}
      <div
        className="absolute w-[150vw] h-[150vw] -left-[25vw] top-[10%] rounded-b-full"
        style={{
          // Use rotationAngle calculated from full day percentage
          transform: `rotate(${rotationAngle}deg)`,
          transformOrigin: '50% 100%', // Rotate around bottom-center
          transition: `transform ${iconTransitionDuration} linear`, // Smooth rotation
        }}
      >
        {/* Icon positioned at the 'top' of the rotated container */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
           <IconComponent
             className={cn(
               'w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20',
               // Apply HSL colors directly
               isDay ? 'text-[hsl(var(--sun))]' : 'text-[hsl(var(--moon))]'
             )}
             style={{
               // Counter-rotate the icon to keep it upright
               transform: `rotate(-${rotationAngle}deg)`,
               transition: `transform ${iconTransitionDuration} linear, color ${iconTransitionDuration} linear`,
               filter: isDay ? 'drop-shadow(0 0 15px hsl(var(--sun) / 0.8))' : 'drop-shadow(0 0 10px hsl(var(--moon) / 0.6))',
             }}
           />
        </div>
      </div>
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
