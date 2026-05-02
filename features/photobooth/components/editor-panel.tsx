"use client";

import Image from "next/image";
import { Download, LayoutPanelTop, Sparkles, Star, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  EditorSettings,
  PhotoLayout,
  PhotoRecord,
  PhotoStylePreset,
  PhotoStatus,
} from "@/features/photobooth/types/photobooth.types";

const presetLabels: Record<PhotoStylePreset, string> = {
  original: "Original",
  classic: "Classic",
  noir: "Noir",
  warm: "Warm",
  cool: "Cool",
  pop: "Pop",
};

interface EditorPanelProps {
  activePhoto: PhotoRecord | null;
  settings: EditorSettings;
  layout: PhotoLayout;
  busy: boolean;
  onPresetChange: (preset: PhotoStylePreset) => void;
  onLayoutChange: (layout: PhotoLayout) => void;
  onSliderChange: (field: keyof Omit<EditorSettings, "preset">, value: number) => void;
  onStatusChange: (status: PhotoStatus) => void;
  onDownload: () => void;
}

export function EditorPanel({
  activePhoto,
  settings,
  layout,
  busy,
  onPresetChange,
  onLayoutChange,
  onSliderChange,
  onStatusChange,
  onDownload,
}: EditorPanelProps) {
  const isVideo = activePhoto?.mediaType === "video";

  return (
    <Card className="glass-panel border-white/60">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle>Edit + Style</CardTitle>
            <CardDescription>
              {isVideo
                ? "Short clips keep the live booth filter and retro vibe from the moment you record."
                : "Choose a preset, fine-tune the mood, then pin your favorite."}
            </CardDescription>
          </div>
          <Badge variant={activePhoto ? "secondary" : "outline"}>
            {activePhoto
              ? `${activePhoto.status} ${activePhoto.mediaType}`
              : "No Shot"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        {!activePhoto ? (
          <div className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full rounded-[1.6rem]" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-12 rounded-full" />
              <Skeleton className="h-12 rounded-full" />
              <Skeleton className="h-12 rounded-full" />
            </div>
            <div className="rounded-[1.6rem] border border-dashed border-[color:var(--border)] bg-white/50 px-5 py-8 text-center text-sm leading-6 text-[color:var(--muted-foreground)]">
              Take a photo or record a clip to unlock booth actions.
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(19rem,0.6fr)] lg:items-stretch">
            <div className="overflow-hidden rounded-[1.6rem] border border-[color:var(--border)] bg-white/85">
              {isVideo && activePhoto.renderedVideo ? (
                <video
                  src={activePhoto.renderedVideo}
                  poster={activePhoto.renderedImage}
                  controls
                  playsInline
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <Image
                  src={activePhoto.renderedImage}
                  alt={activePhoto.name ?? "Selected photobooth shot"}
                  width={800}
                  height={1000}
                  unoptimized
                  className="aspect-[4/5] w-full object-cover"
                />
              )}
            </div>

            <div className="flex flex-col gap-5">
              {isVideo ? (
                <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-white/70 p-4 text-sm leading-6 text-muted-foreground">
                  Video editing stays intentionally simple in this version. Your clip
                  already includes the live social-style filter and the retro booth
                  treatment from recording time, so it is ready to save or download.
                </div>
              ) : (
                <>
                  <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-white/70 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                      <Sparkles className="size-4" />
                      Style Presets
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(presetLabels).map(([preset, label]) => {
                        const selected = settings.preset === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                              selected
                                ? "border-transparent bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                                : "border-[color:var(--border)] bg-white text-[color:var(--foreground)] hover:bg-[color:var(--secondary)]"
                            }`}
                            onClick={() => onPresetChange(preset as PhotoStylePreset)}
                            disabled={busy}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-white/70 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                      <LayoutPanelTop className="size-4" />
                      Layout
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["single", "strip"] as const).map((layoutValue) => (
                        <button
                          key={layoutValue}
                          type="button"
                          className={`rounded-2xl border px-3 py-3 text-sm font-semibold capitalize transition ${
                            layout === layoutValue
                              ? "border-transparent bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
                              : "border-[color:var(--border)] bg-white text-[color:var(--foreground)] hover:bg-[color:var(--secondary)]"
                          }`}
                          onClick={() => onLayoutChange(layoutValue)}
                          disabled={busy}
                        >
                          {layoutValue === "single" ? "Single Frame" : "Photo Strip"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-white/70 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                      <Wrench className="size-4" />
                      Fine Tune
                    </div>
                    <div className="space-y-4">
                      <SliderField
                        label="Brightness"
                        min={50}
                        max={150}
                        value={settings.brightness}
                        onChange={(value) => onSliderChange("brightness", value)}
                      />
                      <SliderField
                        label="Contrast"
                        min={50}
                        max={150}
                        value={settings.contrast}
                        onChange={(value) => onSliderChange("contrast", value)}
                      />
                      <SliderField
                        label="Saturation"
                        min={0}
                        max={200}
                        value={settings.saturation}
                        onChange={(value) => onSliderChange("saturation", value)}
                      />
                      <SliderField
                        label="Vignette"
                        min={0}
                        max={100}
                        value={settings.vignette}
                        onChange={(value) => onSliderChange("vignette", value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid gap-3">
                <Button
                  type="button"
                  size="lg"
                  className="w-full rounded-full"
                  onClick={() => onStatusChange("saved")}
                  disabled={busy}
                >
                  <Star className="size-4" />
                  Save
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="secondary"
                  className="w-full rounded-full"
                  onClick={() => onStatusChange("draft")}
                  disabled={busy}
                >
                  Keep Draft
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={onDownload}
                  disabled={busy}
                >
                  <Download className="size-4" />
                  {isVideo ? "Download Clip" : "Download to Device"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SliderFieldProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}

function SliderField({ label, min, max, value, onChange }: SliderFieldProps) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-[color:var(--foreground)]">
        <span>{label}</span>
        <span className="text-[color:var(--muted-foreground)]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[color:var(--secondary)] accent-[color:var(--primary)]"
      />
    </label>
  );
}
