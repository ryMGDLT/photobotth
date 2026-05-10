import Link from "next/link";
import { Camera, GalleryHorizontal, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export function MainMenu() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel photobooth-grid retro-shadow relative overflow-hidden rounded-[2rem] border border-[#f8e7c8] p-6 shadow-2xl sm:p-8 lg:p-10">
          <div className="retro-dots pointer-events-none absolute inset-0 opacity-45" />
          <div className="relative z-10 mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Badge variant="accent" className="retro-marquee w-fit text-[#fff2d7]">
              Welcome to Flashframe Photobooth
            </Badge>
            <ThemeToggle />
          </div>

          <div className="relative z-10 max-w-2xl space-y-5">
            <h1 className="retro-heading text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Step inside the booth.
            </h1>
            <p className="max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              A local-first photobooth experience with live filters, quick edits,
              and instant downloads. Everything stays on this device.
            </p>
          </div>

          <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
            <Button
              asChild
              size="lg"
              className="retro-marquee w-full rounded-full px-6 text-base text-[#fff2d7] hover:brightness-110 sm:px-8"
            >
              <Link href="/start">
                <Camera className="size-5" />
                Start
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full rounded-full border-[#bf986d] bg-[#fff9ee] px-6 text-base text-[#6b4027] sm:px-8"
            >
              <Link href="/gallery">
                <GalleryHorizontal className="size-5" />
                Gallery
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="w-full rounded-full px-6 text-base sm:px-8"
            >
              <Link href="/about">
                <Info className="size-5" />
                About us
              </Link>
            </Button>
          </div>
        </section>

        <Card className="retro-frame overflow-hidden border-[#edd4a8] bg-[#fff7ea]/90">
          <CardHeader>
            <Badge variant="outline" className="w-fit border-[#c08a55] bg-[#fff8ea] text-[#7b4a2e]">
              IRL Booth Flow
            </Badge>
            <CardTitle className="retro-heading mt-3 text-2xl">
              One session, three steps
            </CardTitle>
            <CardDescription className="text-sm leading-7">
              Start the booth, capture with live filters, then style and download.
              Your shots are stored locally in this browser session only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow step="01" title="Camera" description="Choose your live look, then capture." />
            <InfoRow step="02" title="Edit" description="Tweak the vibe, save, and download." />
            <InfoRow step="03" title="Finish" description="Return to the menu or jump into the gallery." />
          </CardContent>
        </Card>
      </div>
    </main>
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
