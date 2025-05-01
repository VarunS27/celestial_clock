
'use client';

import React from 'react';
import { useTime } from '@/context/time-context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings } from 'lucide-react';

export function NavigationBar() {
  const {
    timeMode,
    setTimeMode,
    manualTime,
    setManualTime,
    selectedCountry,
    setSelectedCountry,
    getAvailableCountries
  } = useTime();

  const handleManualTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timeString = event.target.value;
    if (timeString) {
      const [hours, minutes] = timeString.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDate = new Date();
        newDate.setHours(hours, minutes, 0, 0);
        setManualTime(newDate);
        if (timeMode !== 'manual') {
          setTimeMode('manual'); // Switch to manual mode when time is input
        }
      }
    } else {
      // Clear manual time if input is cleared
      setManualTime(null);
      // Optionally switch back to auto, or keep it manual until explicitly changed
      // setTimeMode('auto');
    }
  };

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    // Switch back to auto mode when a country is selected to use its timezone
    setTimeMode('auto');
  };

  const handleTimeModeChange = (value: 'auto' | 'manual') => {
    setTimeMode(value);
  };

  // Format manual time for the input field (HH:MM)
  const manualTimeValue = manualTime
    ? `${manualTime.getHours().toString().padStart(2, '0')}:${manualTime.getMinutes().toString().padStart(2, '0')}`
    : '';

  const availableCountries = getAvailableCountries();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border h-16 flex items-center justify-between px-4 md:px-8">
      <div className="text-lg font-semibold">Celestial Clock</div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Time Settings</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Time Control</h4>
              <p className="text-sm text-muted-foreground">
                Select automatic (real-time/country) or manual time.
              </p>
            </div>
            <div className="grid gap-2">
              <RadioGroup value={timeMode} onValueChange={handleTimeModeChange}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="auto" id="auto" />
                  <Label htmlFor="auto">Automatic</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="manual" />
                  <Label htmlFor="manual">Manual</Label>
                </div>
              </RadioGroup>
            </div>

            {timeMode === 'auto' && (
              <div className="grid gap-2">
                <Label htmlFor="country-select">Country/Timezone</Label>
                 <Select value={selectedCountry} onValueChange={handleCountryChange}>
                    <SelectTrigger id="country-select" className="w-full">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCountries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
            )}

            {timeMode === 'manual' && (
              <div className="grid gap-2">
                <Label htmlFor="manual-time">Set Manual Time (HH:MM)</Label>
                <Input
                  id="manual-time"
                  type="time"
                  value={manualTimeValue}
                  onChange={handleManualTimeChange}
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </nav>
  );
}
