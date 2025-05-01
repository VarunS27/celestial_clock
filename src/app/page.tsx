'use client';

// Removed unused imports: useTime, Card, CardContent, CardHeader, CardTitle

export default function Home() {
  // Time context logic is still used by NavigationBar and CelestialBackground,
  // but no longer needed directly on this page for display.

  return (
    <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-start min-h-[calc(100vh-4rem)] space-y-8">
      {/* Content removed - The page now primarily shows the background */}
      {/* The NavigationBar provides the controls */}
    </div>
  );
}
