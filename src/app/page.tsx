import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md backdrop-blur-sm bg-background/80">
        <CardHeader>
          <CardTitle>Celestial Clock</CardTitle>
          <CardDescription>
            The background animates based on your local time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Look behind this card! You'll see a sun or moon moving across the
            sky, reflecting the current time of day. The background colors
            also shift smoothly between day and night.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            This component demonstrates dynamic UI based on real-time data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
