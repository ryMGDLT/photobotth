import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionNav } from "@/features/photobooth/components/section-nav";
import { ThemeToggle } from "@/components/theme-toggle";

interface SessionBannerProps {
  photoCount: number;
  savedCount: number;
  sessionId: string;
  currentPage: "camera" | "editor" | "gallery";
}

export function SessionBanner({
  photoCount,
  savedCount,
  sessionId,
  currentPage,
}: SessionBannerProps) {
  return (
    <Card className="glass-panel photobooth-grid retro-shadow overflow-hidden border-[#f0dbb8]">
      <CardContent className="px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <Badge variant="accent" className="retro-marquee w-fit text-[#fff0d0]">
                Open Session Photobooth
              </Badge>
              <div className="space-y-2">
                <h1 className="retro-heading text-4xl font-black tracking-tight text-[color:var(--foreground)] sm:text-5xl">
                  FlashFrame keeps the fun local.
                </h1>
                <p className="max-w-xl text-base leading-7 text-[color:var(--muted-foreground)] sm:text-lg">
                  Take retro webcam shots, record short clips, pin your favorites,
                  and refresh without losing them. Everything stays in this browser
                  session only and disappears when the session ends.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard label="Session Shots" value={photoCount} />
              <StatCard label="Saved Picks" value={savedCount} />
              <StatCard label="Session ID" value={sessionId.slice(-6)} />
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SectionNav currentPage={currentPage} />
            <ThemeToggle />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="retro-frame rounded-[1.5rem] px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
