
"use client";

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CelestialBackground() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set isClient to true only on the client-side after mount
    setIsClient(true);

    // Set initial time and start interval timer
    const updateTime = () => setCurrentTime(new Date());
    updateTime(); // Set initial time immediately
    const timer = setInterval(updateTime, 1000); // Update every second

    // Cleanup timer on component unmount
    return () => clearInterval(timer);
  }, []);

  if (!isClient || !currentTime) {
    // Render a static placeholder or nothing during SSR or before time is set
    // Ensure this matches a potential initial state to avoid layout shifts
    return <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-200 to-blue-400" />;
  }

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const seconds = currentTime.getSeconds();
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const totalSecondsInDay = 24 * 3600;

  // Calculate percentage of the day passed (0 to 1)
  const dayPercentage = totalSeconds / totalSecondsInDay;

  // Determine icon and position based on time
  // Define sunrise/sunset more precisely (e.g., 6:00 AM and 6:00 PM)
  const sunriseTime = 6 / 24; // 6 AM as a fraction of the day
  const sunsetTime = 18 / 24; // 6 PM as a fraction of the day

  const isDay = dayPercentage > sunriseTime && dayPercentage < sunsetTime;
  const IconComponent = isDay ? Sun : Moon;

  // Calculate rotation angle (0 degrees at sunrise, 180 degrees at sunset)
  // We map the full 24 hours to a 360 degree rotation for the arc calculation,
  // but the visible movement across the sky is 180 degrees.
  // Angle calculation should make the sun/moon rise at the left horizon (0 deg) and set at the right horizon (180 deg)
  // The actual position along the arc needs 360 degrees for a full day cycle.

  let angle = 0;
  const cycleDuration = sunsetTime - sunriseTime; // Fraction of day that is "daytime" for the arc
  const nightDuration = 1 - cycleDuration;

  if (dayPercentage >= sunriseTime && dayPercentage <= sunsetTime) {
      // Daytime: Map the time from sunrise to sunset to 0-180 degrees
      const daylightPassed = (dayPercentage - sunriseTime) / cycleDuration;
      angle = daylightPassed * 180;
  } else {
      // Nighttime: Map the time from sunset to sunrise to 0-180 degrees for the moon's arc
      let nightPassed;
      if (dayPercentage > sunsetTime) {
          // After sunset but before midnight
          nightPassed = (dayPercentage - sunsetTime) / nightDuration;
      } else {
          // After midnight but before sunrise
          nightPassed = (dayPercentage + (1 - sunsetTime)) / nightDuration;
      }
      // Night angle also moves 0-180, but we only show the Moon
      angle = nightPassed * 180;
      // To ensure the moon starts rising after sunset, we use the same 0-180 range.
  }


  // Background Gradient Calculation - Use hsl CSS variables
  const getGradientColors = () => {
      // Define transition windows around sunrise and sunset (e.g., 1 hour window)
      const transitionDuration = 1 / 24; // 1 hour
      const sunriseStart = sunriseTime - transitionDuration / 2;
      const sunriseEnd = sunriseTime + transitionDuration / 2;
      const sunsetStart = sunsetTime - transitionDuration / 2;
      const sunsetEnd = sunsetTime + transitionDuration / 2;

      let fromColor = 'hsl(var(--night-sky))';
      let toColor = 'hsl(var(--night-sky))'; // Default to night

      if (dayPercentage > sunriseEnd && dayPercentage < sunsetStart) {
          // Daytime
          fromColor = 'hsl(var(--day-sky))';
          toColor = 'hsl(var(--accent-end))'; // Lighter blue towards horizon during day
      } else if (dayPercentage >= sunriseStart && dayPercentage <= sunriseEnd) {
          // Sunrise transition
          const progress = (dayPercentage - sunriseStart) / (sunriseEnd - sunriseStart);
          // Simple linear interpolation for demo; real-world might need color stops
          // Mix night sky with accent-start (orange) and day-sky with accent-end (blue)
          // This needs a more sophisticated color interpolation logic for smooth HSL transitions
          // For simplicity, we'll just shift towards sunrise colors
          fromColor = `hsl(var(--accent-start) / ${progress * 0.5 + 0.5})`; // Fade in orange
          toColor = `hsl(var(--day-sky) / ${progress})`; // Fade in day sky blue
      } else if (dayPercentage >= sunsetStart && dayPercentage <= sunsetEnd) {
          // Sunset transition
          const progress = (dayPercentage - sunsetStart) / (sunsetEnd - sunsetStart);
          // Mix day-sky with accent-start (orange) and night-sky
          fromColor = `hsl(var(--day-sky) / ${1 - progress})`; // Fade out day sky blue
          toColor = `hsl(var(--accent-start) / ${progress * 0.5 + 0.5})`; // Fade in orange towards night
          // toColor = `hsl(var(--night-sky) / ${progress})`; // Fade in night sky
      }
      // Else: Night time (default colors already set)

      return { fromColor, toColor };
  };

  const { fromColor, toColor } = getGradientColors();
  const backgroundStyle = {
    background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
    // Add transition for the background gradient
    transition: 'background 1000ms linear',
  };

  // Use a longer transition duration for smoother movement between seconds
  const iconTransitionDuration = '1000ms'; // Match the interval time

  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden"
      style={backgroundStyle}
    >
      {/* The rotating arc container */}
      <div
        className="absolute w-[150vw] h-[150vw] -left-[25vw] top-[10%] rounded-b-full"
        style={{
          transform: `rotate(${angle - 90}deg)`, // Center the start (0 deg) at the left horizon
          transformOrigin: '50% 100%', // Rotate around bottom-center
          transition: `transform ${iconTransitionDuration} linear`, // Smooth rotation
        }}
      >
        {/* Icon positioned at the top of the arc */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 transform">
           <IconComponent
             className={cn(
               'w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20',
               // Apply HSL colors directly for better theme integration
               isDay ? 'text-[hsl(var(--sun))]' : 'text-[hsl(var(--moon))]'
             )}
             style={{
               // Counter-rotate the icon to keep it upright
               transform: `rotate(-${angle - 90}deg)`,
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
// No changes needed here unless performance becomes an issue
const Stars = () => {
  const [stars, setStars] = useState<Array<{ top: string; left: string; size: string; delay: string }>>([]);

  useEffect(() => {
    // Reduced number of stars for potentially better performance
    const numStars = 50;
    const generateStars = () => {
      const newStars = Array.from({ length: numStars }).map(() => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 1.5 + 0.5}px`, // Star size between 0.5px and 2px
        delay: `${Math.random() * 5}s`, // Random animation delay (longer for less sync)
      }));
      setStars(newStars);
    };
    generateStars();
     // Only generate stars once on mount
  }, []);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {stars.map((star, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-white" // Removed animate-twinkle for performance check
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            // Optionally add back twinkle animation if performance allows
            // animationName: 'twinkle',
            // animationDuration: '3s', // Slower twinkle
            // animationIterationCount: 'infinite',
            // animationDelay: star.delay,
            opacity: Math.random() * 0.5 + 0.3, // Random static opacity
          }}
        />
      ))}
    </div>
  );
};

    