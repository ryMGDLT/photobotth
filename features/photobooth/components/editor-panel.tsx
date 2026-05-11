"use client";

import Image from "next/image";
import { Download, FileMinus, LayoutPanelTop, Sparkles, Star, Wrench } from "lucide-react";
import { useMemo, useState } from "react";

import { toast } from "sonner";
import { StripPhotoSelector } from "@/features/photobooth/components/strip-photo-selector";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  EditorSettings,
  PhotoLayout,
  PhotoRecord,
  PhotoStylePreset,
  PhotoStatus,
  PhotoFrameId,
} from "@/features/photobooth/types/photobooth.types";
import { FramePicker } from "@/features/photobooth/components/frame-picker";

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
  photos: PhotoRecord[];
  settings: EditorSettings;
  layout: PhotoLayout;
  busy: boolean;
  onPresetChange: (preset: PhotoStylePreset) => void;
  onLayoutChange: (layout: PhotoLayout) => void;
  onSliderChange: (field: keyof Omit<EditorSettings, "preset" | "frame">, value: number) => void;
  onFrameChange: (frame: PhotoFrameId) => void;
  onStatusChange: (status: PhotoStatus) => void;
  onDownload: () => void;
  onStripSelectionConfirm: (selectedIds: [string, string, string]) => void;
}

export function EditorPanel({
  activePhoto,
  photos,
  settings,
  layout,
  busy,
  onPresetChange,
  onLayoutChange,
  onSliderChange,
  onFrameChange,
  onStatusChange,
  onDownload,
  onStripSelectionConfirm,
}: EditorPanelProps) {
  const isVideo = activePhoto?.mediaType === "video";
  const [stripSelectorOpen, setStripSelectorOpen] = useState(false);

  // Memoize photo preview to prevent flicker when settings change
  const photoPreview = useMemo(() => {
    if (!activePhoto) return null;

    if (isVideo && activePhoto.renderedVideo) {
      return (
        <video
          src={activePhoto.renderedVideo}
          poster={activePhoto.renderedImage}
          controls
          playsInline
          className="w-auto h-auto max-w-full max-h-[60vh] object-contain rounded-[0.8rem]"
        />
      );
    }

    if (layout === "strip") {
      return (
        <div className="flex flex-col gap-3 rounded-[1.2rem] bg-[#fffaf0] p-4 pb-12 shadow-lg max-h-[60vh] overflow-y-auto">
          <Image
            src={activePhoto.renderedImage}
            alt={activePhoto.name ?? "Strip photo"}
            width={600}
            height={800}
            unoptimized
            className="w-auto h-auto max-w-full object-contain rounded-sm"
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center rounded-[1.2rem] bg-[#fffaf0] p-3 pb-16 shadow-lg">
        <Image
          src={activePhoto.renderedImage}
          alt={activePhoto.name ?? "Selected photobooth shot"}
          width={800}
          height={533}
          unoptimized
          className="w-auto h-auto max-w-full max-h-[60vh] object-contain rounded-sm"
        />
      </div>
    );
    // Only re-render when photo ID, media type, or layout changes - NOT when settings change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePhoto?.id, activePhoto?.mediaType, activePhoto?.renderedImage, activePhoto?.renderedVideo, activePhoto?.stripImages, activePhoto?.name, layout]);

  return (
    <Card className="glass-panel border-white/60">
      <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
        {!activePhoto ? (
          <div className="space-y-4">
            <Skeleton className="aspect-[3/2] w-full rounded-[1.6rem]" />
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
            <div className="flex flex-col gap-4">
              {/* Photo preview - container sizes to content for full frame visibility */}
              <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-white/85 p-2 sm:p-6">
                <div className="flex items-center justify-center py-2 px-2 sm:py-6 sm:px-4">
                  <div className="retro-frame w-full h-fit max-w-full rounded-[1.2rem] bg-[#2a2435] p-3 shadow-xl">
                    {photoPreview}
                  </div>
                </div>
              </div>

              {/* Footer controls */}
              <div className="flex flex-wrap items-center justify-center gap-3 rounded-[1.6rem] border border-[color:var(--border)] bg-white/70 p-4">
                <button
                  type="button"
                  className={`retro-marquee flex items-center gap-2 rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#fff1d3] transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 disabled:opacity-60 ${
                    activePhoto.status === "saved" ? "ring-2 ring-[#fff1d3] ring-offset-2 ring-offset-[#fffaf0]" : ""
                  }`}
                  onClick={() => onStatusChange("saved")}
                  disabled={busy}
                >
                  <Star className={`size-4 transition-transform duration-200 ${activePhoto.status === "saved" ? "fill-current scale-110" : ""}`} />
                  Save
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-2 rounded-full border border-[#c9a67c] bg-[#fffaf0]/95 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition-all duration-200 hover:scale-105 hover:bg-[#f6e0bb] active:scale-95 disabled:opacity-60 ${
                    activePhoto.status === "draft" ? "ring-2 ring-[#c9a67c] ring-offset-2 ring-offset-[#fffaf0]" : ""
                  }`}
                  onClick={() => onStatusChange("draft")}
                  disabled={busy}
                >
                  <FileMinus className="size-4" />
                  Draft
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-[#c9a67c] bg-[#fffaf0]/95 px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition-all duration-200 hover:scale-105 hover:bg-[#f6e0bb] active:scale-95 disabled:opacity-60"
                  onClick={onDownload}
                  disabled={busy}
                >
                  <Download className="size-4" />
                  Download
                </button>
              </div>
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
                            onClick={() => {
                              onPresetChange(preset as PhotoStylePreset);
                              toast("Style applied", { id: "style-change" });
                            }}
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
                          onClick={() => {
                            if (layoutValue === "strip") {
                              setStripSelectorOpen(true);
                            } else {
                              onLayoutChange(layoutValue);
                              toast("Layout set to single frame", { id: "layout-change" });
                            }
                          }}
                          disabled={busy}
                        >
                          {layoutValue === "single" ? "Single Frame" : "Photo Strip"}
                        </button>
                      ))}
                    </div>

                    {activePhoto && (
                      <StripPhotoSelector
                        open={stripSelectorOpen}
                        activePhoto={activePhoto}
                        otherPhotos={photos.filter((p) => p.id !== activePhoto.id)}
                        onConfirm={(ids) => {
                          setStripSelectorOpen(false);
                          onStripSelectionConfirm(ids);
                          toast("Layout set to photo strip", { id: "layout-change" });
                        }}
                        onClose={() => setStripSelectorOpen(false)}
                      />
                    )}
                  </div>

                  <div className="rounded-[1.6rem] border border-[color:var(--border)] bg-white/70 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[color:var(--foreground)]">
                      <LayoutPanelTop className="size-4" />
                      Frame
                    </div>
                    <FramePicker
                      selectedFrame={settings.frame ?? "classic-cream"}
                      onFrameChange={(frame) => {
                        onFrameChange(frame);
                        toast("Style applied", { id: "style-change" });
                      }}
                      disabled={busy}
                    />
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
