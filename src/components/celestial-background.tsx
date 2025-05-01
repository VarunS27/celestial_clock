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
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60 * 1000); // Update every minute

    // Cleanup timer on component unmount
    return () => clearInterval(timer);
  }, []);

  if (!isClient || !currentTime) {
    // Render a static placeholder or nothing during SSR or before time is set
    return <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-200 to-blue-400" />;
  }

  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const totalMinutesInDay = 24 * 60;

  // Calculate percentage of the day passed (0 to 1)
  const dayPercentage = totalMinutes / totalMinutesInDay;

  // Determine icon and position based on time
  // Sunrise around 6 AM (0.25), Sunset around 6 PM (0.75)
  const isDay = dayPercentage > 0.25 && dayPercentage < 0.75;
  const IconComponent = isDay ? Sun : Moon;

  // Calculate rotation angle (0 degrees at 6 AM, 180 degrees at 6 PM)
  // We map the 12 hours of daylight (6 AM to 6 PM) to 180 degrees rotation.
  let angle = 0;
  if (isDay) {
    // Normalize percentage within the 12-hour daylight period
    const daylightPercentage = (dayPercentage - 0.25) / 0.5; // Map 0.25-0.75 to 0-1
    angle = daylightPercentage * 180;
  } else {
    // Handle night time rotation (6 PM to 6 AM)
    let nightPercentage;
    if (dayPercentage >= 0.75) {
      // Time is between 6 PM and midnight
      nightPercentage = (dayPercentage - 0.75) / 0.5; // Map 0.75-1.0 to 0-0.5
    } else {
      // Time is between midnight and 6 AM
      nightPercentage = (dayPercentage / 0.25 + 1) / 2; // Map 0-0.25 to 0.5-1.0
    }
    angle = nightPercentage * 180;
    // Add 180 degrees offset because it's night
    // angle += 180; // We only show the moon during night, rotating 0-180
  }

  // Background Gradient Calculation
  const getGradientColors = () => {
    // Smooth transition around sunrise (e.g., 5-7 AM) and sunset (e.g., 5-7 PM)
    const sunriseStart = 5 / 24;
    const sunriseEnd = 7 / 24;
    const sunsetStart = 17 / 24;
    const sunsetEnd = 19 / 24;

    let fromColor = 'hsl(var(--night-sky))';
    let toColor = 'hsl(var(--night-sky))'; // Default to night

    if (dayPercentage > sunriseEnd && dayPercentage < sunsetStart) {
      // Daytime
      fromColor = 'hsl(var(--day-sky))';
      toColor = 'hsl(var(--accent-end))'; // Light blue towards horizon
    } else if (dayPercentage >= sunriseStart && dayPercentage <= sunriseEnd) {
      // Sunrise transition
      const transitionProgress = (dayPercentage - sunriseStart) / (sunriseEnd - sunriseStart);
      // Interpolate between night and day colors
      // This is a simplified interpolation. Real interpolation would be more complex.
      fromColor = `hsl(var(--accent-start) / ${1 - transitionProgress})`;
      toColor = `hsl(var(--day-sky) / ${transitionProgress})`;
    } else if (dayPercentage >= sunsetStart && dayPercentage <= sunsetEnd) {
      // Sunset transition
      const transitionProgress = (dayPercentage - sunsetStart) / (sunsetEnd - sunsetStart);
      fromColor = `hsl(var(--day-sky) / ${1 - transitionProgress})`;
      toColor = `hsl(var(--accent-start) / ${transitionProgress})`;
      // toColor = `hsl(var(--night-sky) / ${transitionProgress})`;
    }
    // Else: Night time (default)

    return { fromColor, toColor };
  };

  const { fromColor, toColor } = getGradientColors();
  const backgroundStyle = {
    background: `linear-gradient(to bottom, ${fromColor}, ${toColor})`,
  };

  return (
    <div
      className="absolute inset-0 -z-10 overflow-hidden transition-colors duration-1000"
      style={backgroundStyle}
    >
      <div
        className="absolute w-[150vw] h-[150vw] -left-[25vw] top-[10%] rounded-b-full"
        style={{
          transform: `rotate(${angle - 90}deg)`, // Adjust rotation origin to bottom center
          transformOrigin: '50% 100%',
          transition: 'transform 1s linear', // Smooth rotation
        }}
      >
        {/* Position the icon at the top center of the rotating arc */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 transform">
           <IconComponent
             className={cn(
               'w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 transition-colors duration-1000',
               isDay ? 'text-yellow-400' : 'text-gray-200' // Direct color application for sun/moon
             )}
             style={{
               // Counter-rotate the icon to keep it upright
               transform: `rotate(-${angle - 90}deg)`,
               transition: 'transform 1s linear, color 1s linear',
               filter: isDay ? 'drop-shadow(0 0 15px hsl(var(--sun) / 0.8))' : 'drop-shadow(0 0 10px hsl(var(--moon) / 0.6))',
             }}
           />
        </div>
      </div>
      {/* Optional: Add stars for night */}
      {!isDay && <Stars />}
    </div>
  );
}


// Simple Stars component for nighttime background
const Stars = () => {
  const [stars, setStars] = useState<Array<{ top: string; left: string; size: string; delay: string }>>([]);

  useEffect(() => {
    const generateStars = () => {
      const newStars = Array.from({ length: 100 }).map(() => ({
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 1.5 + 0.5}px`, // Star size between 0.5px and 2px
        delay: `${Math.random() * 2}s`, // Random animation delay
      }));
      setStars(newStars);
    };
    generateStars();
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      {stars.map((star, index) => (
        <div
          key={index}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationName: 'twinkle',
            animationDuration: '2s',
            animationIterationCount: 'infinite',
            animationDelay: star.delay,
            opacity: 0.7, // Initial opacity for twinkle effect
          }}
        />
      ))}
    </div>
  );
};
