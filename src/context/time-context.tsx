
'use client';

import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';

// List of sample countries and their approximate UTC offsets
// In a real app, use a library like moment-timezone or Intl.DateTimeFormat for accurate timezone handling
const countryTimezones: { [key: string]: number } = {
  'Local': 0, // Placeholder for user's local time offset (handled separately)
  'USA (New York)': -4, // EDT
  'UK (London)': 1,    // BST
  'Japan (Tokyo)': 9,
  'Australia (Sydney)': 10, // AEST
  'India (New Delhi)': 5.5,
};

interface TimeContextType {
  effectiveTime: Date | null; // The time used by the application (auto or manual)
  timeMode: 'auto' | 'manual'; // 'auto' follows real-time or selected country, 'manual' uses user-set time
  setTimeMode: (mode: 'auto' | 'manual') => void;
  manualTime: Date | null; // The time set manually by the user
  setManualTime: (time: Date | null) => void;
  selectedCountry: string; // Key from countryTimezones
  setSelectedCountry: (country: string) => void;
  getAvailableCountries: () => string[];
}

const TimeContext = createContext<TimeContextType | undefined>(undefined);

export const TimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timeMode, setTimeMode] = useState<'auto' | 'manual'>('auto');
  const [manualTime, setManualTime] = useState<Date | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('Local'); // Default to local time
  const [isClient, setIsClient] = useState(false);

  // Update current time every second only in auto mode
  useEffect(() => {
    setIsClient(true);
    let intervalId: NodeJS.Timeout | null = null;

    if (timeMode === 'auto') {
      intervalId = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }

    // Clear interval if mode changes or component unmounts
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [timeMode]); // Rerun effect when timeMode changes

  // Calculate the effective time based on mode and country selection
  const effectiveTime = useMemo(() => {
    if (!isClient) return null; // Avoid hydration mismatch

    if (timeMode === 'manual' && manualTime) {
      return manualTime;
    }

    // Auto mode: calculate based on selected country's timezone offset
    if (timeMode === 'auto') {
       if (selectedCountry === 'Local') {
           // Use the unmodified current time for local
           return currentTime;
       }

       const offsetHours = countryTimezones[selectedCountry];
       if (offsetHours !== undefined) {
          // Calculate UTC time first
          const utcHours = currentTime.getUTCHours();
          const utcMinutes = currentTime.getUTCMinutes();
          const utcSeconds = currentTime.getUTCSeconds();

          // Apply offset (handle potential floating point offsets like India)
          const targetHours = utcHours + Math.trunc(offsetHours);
          const fractionalOffsetMinutes = (offsetHours % 1) * 60;
          const targetMinutes = utcMinutes + fractionalOffsetMinutes;
          const targetSeconds = utcSeconds; // Keep seconds aligned with UTC seconds


          // Create a new date object representing the time in the target timezone
          // Note: This Date object itself will still be in the user's system timezone internally,
          // but the hour, minute, second values will represent the selected country's time.
          // Components using this time should rely on getHours(), getMinutes() etc.
          const adjustedTime = new Date(currentTime); // Start with a copy
          adjustedTime.setUTCHours(targetHours, targetMinutes, targetSeconds);

          // Important: Return a new Date object derived from UTC components
          // representing the target timezone's time, but DO NOT convert it
          // back to the local timezone string representation here.
          // Let the consumer (e.g., CelestialBackground) use getHours(), etc.
          const finalTime = new Date(0); // Start with Epoch
          finalTime.setUTCFullYear(currentTime.getUTCFullYear());
          finalTime.setUTCMonth(currentTime.getUTCMonth());
          finalTime.setUTCDate(currentTime.getUTCDate()); // Keep date components aligned for simplicity
          // We adjust hours/minutes/seconds based on offset
          finalTime.setUTCHours(targetHours, targetMinutes, targetSeconds);


          // The date part might shift due to timezone differences. We need to adjust it.
          // Create a Date object based on the calculated UTC time components.
          // This lets the Date object handle day rollovers correctly.
          const targetDate = new Date(Date.UTC(
              currentTime.getUTCFullYear(),
              currentTime.getUTCMonth(),
              currentTime.getUTCDate(),
              targetHours,
              targetMinutes,
              targetSeconds
          ));

          return targetDate;

       }
     }

    // Fallback to current local time if something goes wrong
    return currentTime;

  }, [isClient, timeMode, manualTime, currentTime, selectedCountry]);

  const getAvailableCountries = useCallback(() => Object.keys(countryTimezones), []);

  return (
    <TimeContext.Provider value={{
      effectiveTime,
      timeMode,
      setTimeMode,
      manualTime,
      setManualTime,
      selectedCountry,
      setSelectedCountry,
      getAvailableCountries
    }}>
      {children}
    </TimeContext.Provider>
  );
};

export const useTime = (): TimeContextType => {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
};
