"use client";

import { Camera, Download, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

interface WelcomeScreenProps {
  photoCount: number;
  onStart: () => void;
}

export function WelcomeScreen({ photoCount, onStart }: WelcomeScreenProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel photobooth-grid retro-shadow relative overflow-hidden rounded-[2rem] border border-[#f8e7c8] p-6 shadow-2xl sm:p-8 lg:p-10">
          <div className="retro-dots pointer-events-none absolute inset-0 opacity-45" />
          <div className="relative z-10 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Badge variant="accent" className="retro-marquee w-fit text-[#fff2d7]">
              Welcome to FlashFrame
            </Badge>
            <ThemeToggle />
          </div>
          <div className="relative z-10 max-w-2xl space-y-5">
            <h1 className="retro-heading text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Start your photobooth session in one tap.
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              Snap live webcam photos, record short retro clips, switch social-style
              camera filters before you shoot, and download your favorites directly
              to this device. Everything stays local to this browser session.
            </p>
          </div>

          <div className="relative z-10 mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="retro-marquee w-full rounded-full px-6 text-base text-[#fff2d7] hover:brightness-110 sm:w-auto sm:px-8" onClick={onStart}>
              <Camera className="size-5" />
              Start Booth
            </Button>
            <Button size="lg" variant="outline" className="w-full rounded-full border-[#bf986d] bg-[#fff9ee] px-6 text-base text-[#6b4027] sm:w-auto sm:px-8" disabled>
              <Download className="size-5" />
              Download-ready shots
            </Button>
          </div>

          <div className="relative z-10 mt-8 grid gap-4 sm:grid-cols-3">
            <FeaturePill
              icon={<Sparkles className="size-5" />}
              title="Live Filters"
              description="Preview the look before you capture."
            />
            <FeaturePill
              icon={<Download className="size-5" />}
              title="Device Download"
              description="Save edited photos straight to your device."
            />
            <FeaturePill
              icon={<ShieldCheck className="size-5" />}
              title="Private Session"
              description={`${photoCount} local shot${photoCount === 1 ? "" : "s"} ready in this browser only.`}
            />
          </div>
        </section>

        <Card className="retro-frame overflow-hidden border-[#edd4a8] bg-[#fff7ea]/90">
          <CardHeader>
            <Badge variant="outline" className="w-fit border-[#c08a55] bg-[#fff8ea] text-[#7b4a2e]">
              How It Works
            </Badge>
            <CardTitle className="retro-heading mt-3 text-2xl">Fast, playful, and local-first</CardTitle>
            <CardDescription className="text-sm leading-7">
              This app is built like a public booth: no login, no upload folder,
              no cloud save. Think vintage mall photobooth meets short-form social
              camera. Refresh-safe during the session, then gone when the session ends.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow step="01" title="Enable the camera" description="Only when you press start." />
            <InfoRow step="02" title="Pick a live filter" description="See the vibe before you capture." />
            <InfoRow step="03" title="Edit and download" description="Pin, draft, and keep your favorites." />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function FeaturePill({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="retro-frame rounded-[1.5rem] p-4">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-[#7a4328] text-[#fff4dd]">
        {icon}
      </div>
      <h2 className="font-bold text-foreground">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function InfoRow({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="retro-frame rounded-[1.4rem] p-4">
      <div className="flex items-start gap-4">
        <div className="retro-marquee flex size-10 items-center justify-center rounded-full text-sm font-black text-[#fff1d3]">
          {step}
        </div>
        <div>
          <h3 className="font-bold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
