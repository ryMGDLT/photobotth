"use client";

import { ArrowLeft, DoorOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export type WizardStep = "camera" | "editor" | "finish";

const stepLabels: Record<WizardStep, { title: string; index: number }> = {
  camera: { title: "Camera", index: 1 },
  editor: { title: "Edit", index: 2 },
  finish: { title: "Finish", index: 3 },
};

export function WizardHeader({
  step,
  photoCount,
  savedCount,
  sessionId,
  onExit,
  onBack,
}: {
  step: WizardStep;
  photoCount: number;
  savedCount: number;
  sessionId: string;
  onExit: () => void;
  onBack?: () => void;
}) {
  const meta = stepLabels[step];

  return (
    <Card className="glass-panel photobooth-grid retro-shadow overflow-hidden border-[#f0dbb8]">
      <CardContent className="px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-3">
              <h1 className="retro-heading text-3xl font-black tracking-tight text-[color:var(--foreground)] sm:text-4xl">
                {meta.title}
              </h1>
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--muted-foreground)]">
                {meta.index}/3
              </span>
            </div>

            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="flex-1 sm:flex-none">
                <ThemeToggle />
              </div>
              {onBack ? (
                <Button size="icon" variant="outline" onClick={onBack} aria-label="Go back">
                  <ArrowLeft className="size-5" />
                </Button>
              ) : null}
              <Button variant="outline" onClick={onExit} className="flex-1 rounded-full sm:flex-none">
                <DoorOpen className="size-4" />
                Exit
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard label="Shots" value={photoCount} />
            <StatCard label="Saved" value={savedCount} />
            <StatCard label="ID" value={sessionId.slice(-6)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="retro-frame rounded-[1.25rem] px-3 py-3 sm:px-4 sm:py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 sm:mt-2 text-lg sm:text-xl font-black text-[color:var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
