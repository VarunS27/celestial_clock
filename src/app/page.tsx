'use client';

import { useTime } from '@/context/time-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const { effectiveTime, timeMode, setTimeMode, setManualTime, selectedCountry, setSelectedCountry } = useTime();

  // Format the time for display
  const formattedTime = effectiveTime
    ? effectiveTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Loading...';

  const handleTimeModeChange = (mode: 'auto' | 'manual') => {
    setTimeMode(mode);
    if (mode === 'manual') {
      // Optionally set a default manual time when switching
      setManualTime(new Date());
    }
  };

  const handleManualTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timeString = event.target.value;
    // Basic validation, assumes HH:MM format
    const [hours, minutes] = timeString.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const newDate = new Date();
      newDate.setHours(hours, minutes, 0, 0); // Set hours and minutes, reset seconds/ms
      setManualTime(newDate);
    }
  };

   const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.target.value);
    // When country changes, switch back to auto mode to use its timezone
    setTimeMode('auto');
  };


  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-start min-h-[calc(100vh-10rem)] space-y-8">
       <Card className="w-full max-w-md bg-background/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">Current Celestial Time</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-4xl font-bold tabular-nums">
            {formattedTime}
          </p>
           <p className="text-sm text-muted-foreground mt-2">
            Mode: {timeMode === 'auto' ? `Automatic (${selectedCountry || 'Local'})` : 'Manual'}
          </p>
        </CardContent>
      </Card>

      {/* Removed controls from main page, they are now in NavigationBar */}

    </div>
  );
}
