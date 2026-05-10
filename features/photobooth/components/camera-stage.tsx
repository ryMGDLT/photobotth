"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Clapperboard,
  Maximize,
  Minimize,
  RefreshCcw,
  Search,
  Sparkles,
  TimerReset,
  Video,
  VideoOff,
  Wand2,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaceOverlay } from "@/features/photobooth/components/face-overlay";
import { cameraEffects, cameraFilters } from "@/features/photobooth/utils/camera-filters";
import type { FaceLandmarks } from "@/hooks/use-face-detection";
import type {
  CameraEffectPreset,
  CameraFilterPreset,
  CameraPermissionState,
} from "@/features/photobooth/types/photobooth.types";

interface CameraStageProps {
  permissionState: CameraPermissionState;
  activeFilter: CameraFilterPreset;
  activeFilterCss: string;
  activeEffect: CameraEffectPreset;
  activeEffectCss: string;
  captureMode: "photo" | "video" | "strip";
  countdownEnabled: boolean;
  countdownValue: number | null;
  flashActive: boolean;
  busy: boolean;
  isRecording: boolean;
  recordingSeconds: number;
  errorMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  webglCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  landmarks: FaceLandmarks[] | null;
  rotation: number;
  onRotationChange: (rotation: number) => void;
  onStartCamera: () => Promise<void> | void;
  onCapture: () => Promise<void> | void;
  onStartRecording: () => Promise<void> | void;
  onStopRecording: () => Promise<void> | void;
  onToggleCountdown: () => void;
  onRetake: () => void;
  onFilterChange: (filter: CameraFilterPreset) => void;
  onEffectChange: (effect: CameraEffectPreset) => void;
  onCaptureModeChange: (mode: "photo" | "video" | "strip") => void;
}

export function CameraStage({
  permissionState,
  activeFilter,
  activeFilterCss,
  activeEffect,
  activeEffectCss,
  captureMode,
  countdownEnabled,
  countdownValue,
  flashActive,
  busy,
  isRecording,
  recordingSeconds,
  errorMessage,
  videoRef,
  canvasRef,
  webglCanvasRef,
  landmarks,
  rotation,
  onRotationChange,
  onStartCamera,
  onCapture,
  onStartRecording,
  onStopRecording,
  onToggleCountdown,
  onRetake,
  onFilterChange,
  onEffectChange,
  onCaptureModeChange,
}: CameraStageProps) {
  const cameraReady = permissionState === "granted";
  const [filterSearch, setFilterSearch] = useState("");
  const [effectSearch, setEffectSearch] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<"mode" | "filters" | "effects">("mode");
  const cameraContainerRef = useRef<HTMLDivElement>(null);
  const videoSizeRef = useRef({ width: 0, height: 0 });

  // Effects that support face tracking
  const faceTrackedEffects = [
    "cat-ears",
    "devil-horns",
    "angel-halo",
    "glasses",
    "mustache",
    "blush",
    "tears",
    "sweat",
    "angry",
    "surprised",
  ];

  // Automatically enable face tracking when a face-tracked effect is selected
  const shouldUseFaceTracking = faceTrackedEffects.includes(activeEffect);

  // Track video dimensions for overlay scaling
  useEffect(() => {
    if (videoRef.current) {
      const updateVideoSize = () => {
        if (videoRef.current) {
          videoSizeRef.current = {
            width: videoRef.current.videoWidth || 640,
            height: videoRef.current.videoHeight || 480,
          };
        }
      };

      videoRef.current.addEventListener("loadedmetadata", updateVideoSize);
      updateVideoSize();

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener("loadedmetadata", updateVideoSize);
        }
      };
    }
  }, [cameraReady]);

  const filteredFilters = cameraFilters.filter((filter) =>
    filter.label.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const filteredEffects = cameraEffects.filter((effect) =>
    effect.label.toLowerCase().includes(effectSearch.toLowerCase())
  );
  
  const handleRotate = () => {
    onRotationChange((rotation + 90) % 360);
  };

  useEffect(() => {
    if (!sheetOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSheetOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sheetOpen]);

  const toggleFullscreen = () => {
    if (!cameraContainerRef.current) return;

    if (!isFullscreen) {
      cameraContainerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error attempting to exit fullscreen:", err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <Card className="glass-panel retro-shadow overflow-hidden border-[#eedab5]">
      <CardContent className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex justify-center">
          <div
            ref={cameraContainerRef}
            className="retro-frame relative mx-auto w-full max-w-[860px] overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#7a4328,#db9f5d_22%,#f7ebcf_48%,#d6b48a_72%,#7c4529)] p-3 sm:p-5"
          >
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[1.8rem] bg-black/5">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ 
                  filter: activeFilterCss,
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center center"
                }}
                className={`h-full w-full object-cover transition-all duration-300 ${
                  cameraReady && activeFilter !== "vhs-pro" ? "opacity-100" : "opacity-0"
                }`}
              />
              <canvas
                ref={webglCanvasRef}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center center"
                }}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 ${
                  cameraReady && activeFilter === "vhs-pro" ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              />

              {activeEffect !== "none" && cameraReady ? (
                <>
                  {!shouldUseFaceTracking && (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{ background: activeEffectCss }}
                    />
                  )}
                  {shouldUseFaceTracking && landmarks && (
                    <div className="absolute inset-0 pointer-events-none">
                      <FaceOverlay
                        landmarks={landmarks}
                        effect={activeEffect}
                        videoWidth={videoSizeRef.current.width}
                        videoHeight={videoSizeRef.current.height}
                        videoElement={videoRef.current}
                        rotation={rotation}
                      />
                    </div>
                  )}
                </>
              ) : null}

              <canvas ref={canvasRef} className="hidden" />

              {!cameraReady ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <div className="retro-frame rounded-full p-4">
                    {permissionState === "denied" || permissionState === "unavailable" ? (
                      <CameraOff className="size-8 text-[color:var(--foreground)]" />
                    ) : (
                      <Camera className="size-8 text-[color:var(--foreground)]" />
                    )}
                  </div>
                  <div className="max-w-sm space-y-2">
                    <p className="text-lg font-semibold text-[color:var(--foreground)]">
                      {permissionState === "denied"
                        ? "Camera permission was denied."
                        : permissionState === "unavailable"
                          ? "This browser cannot access a webcam here."
                          : "Start your booth when you are ready."}
                    </p>
                    <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
                      {permissionState === "denied"
                        ? "Allow camera access in your browser settings, then try again."
                        : permissionState === "unavailable"
                          ? "A webcam is required for this version of the app."
                          : "We only access the webcam after you ask us to, and photos stay inside this browser session."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="lg"
                    className="rounded-full px-6"
                    onClick={() => void onStartCamera()}
                    disabled={busy || permissionState === "unavailable"}
                  >
                    <Camera className="size-4" />
                    Start Camera
                  </Button>
                </div>
              ) : null}

              {countdownValue ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                  <div className="retro-marquee rounded-full px-8 py-5 text-6xl font-black text-[#fff1d3] shadow-xl">
                    {countdownValue}
                  </div>
                </div>
              ) : null}

              <div
                className={`pointer-events-none absolute inset-0 bg-white transition-opacity duration-200 ${
                  flashActive ? "opacity-80" : "opacity-0"
                }`}
              />

              {cameraReady ? (
                <div className="absolute left-3 top-3">
                  <Badge variant="default" className="retro-marquee gap-2 text-[#fff0d0]">
                    <Wand2 className="size-3.5" />
                    {cameraFilters.find((filter) => filter.id === activeFilter)?.label ?? "Natural"}
                  </Badge>
                </div>
              ) : null}

              {cameraReady ? (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="absolute right-3 top-3 rounded-full border border-[#c9a67c] bg-[#fffaf0] p-2 text-foreground hover:bg-[#f6e0bb] transition z-10"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? (
                    <Minimize className="size-4" />
                  ) : (
                    <Maximize className="size-4" />
                  )}
                </button>
              ) : null}

              {cameraReady ? (
                <button
                  type="button"
                  onClick={handleRotate}
                  className="absolute right-3 top-14 rounded-full border border-[#c9a67c] bg-[#fffaf0] p-2 text-foreground hover:bg-[#f6e0bb] transition z-10"
                  title="Rotate Camera"
                >
                  <RefreshCcw className="size-4" />
                </button>
              ) : null}

              {cameraReady ? (
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={onToggleCountdown}
                    disabled={busy}
                    className={`rounded-full border px-3 py-3 text-foreground transition ${
                      countdownEnabled
                        ? "retro-marquee border-transparent text-[#fff1d3]"
                        : "border-[#c9a67c] bg-[#fffaf0] hover:bg-[#f6e0bb]"
                    }`}
                    title={countdownEnabled ? "Countdown On" : "Countdown Off"}
                  >
                    <TimerReset className="size-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void (
                        captureMode === "photo" || captureMode === "strip"
                          ? onCapture()
                          : isRecording
                            ? onStopRecording()
                            : onStartRecording()
                      )
                    }
                    disabled={busy}
                    className={`rounded-full p-4 transition-transform hover:scale-105 active:scale-95 ${
                      captureMode === "video" && isRecording
                        ? "bg-red-500 text-white"
                        : "retro-marquee text-[#fff1d3]"
                    }`}
                    title={
                      captureMode === "photo"
                        ? "Take Photo"
                        : captureMode === "strip"
                          ? "Take Photo Strip"
                          : isRecording
                            ? "Stop Recording"
                            : "Start Recording"
                    }
                  >
                    {captureMode === "photo" || captureMode === "strip" ? (
                      <Zap className="size-6" />
                    ) : isRecording ? (
                      <VideoOff className="size-6" />
                    ) : (
                      <Video className="size-6" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSheetTab("mode");
                      setSheetOpen(true);
                    }}
                    disabled={busy || isRecording}
                    className="rounded-full border border-[#c9a67c] bg-[#fffaf0] px-3 py-3 text-foreground hover:bg-[#f6e0bb] transition"
                    title="Capture Mode"
                  >
                    <Clapperboard className="size-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSheetTab("filters");
                      setSheetOpen(true);
                    }}
                    disabled={busy}
                    className="rounded-full border border-[#c9a67c] bg-[#fffaf0] px-3 py-3 text-foreground hover:bg-[#f6e0bb] transition"
                    title="Filters"
                  >
                    <Wand2 className="size-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSheetTab("effects");
                      setSheetOpen(true);
                    }}
                    disabled={busy}
                    className="rounded-full border border-[#c9a67c] bg-[#fffaf0] px-3 py-3 text-foreground hover:bg-[#f6e0bb] transition"
                    title="Effects"
                  >
                    <Sparkles className="size-5" />
                  </button>

                  <button
                    type="button"
                    onClick={onRetake}
                    disabled={busy}
                    className="rounded-full border border-[#c9a67c] bg-[#fffaf0] px-3 py-3 text-foreground hover:bg-[#f6e0bb] transition"
                    title="Retake"
                  >
                    <RefreshCcw className="size-5" />
                  </button>
                </div>
              ) : null}

              {isRecording ? (
                <div className="absolute right-12 top-3">
                  <Badge variant="outline" className="gap-2 border-red-300 bg-[#fff0e8] text-red-700">
                    <span className="size-2 rounded-full bg-red-500" />
                    REC {recordingSeconds}s
                  </Badge>
                </div>
              ) : null}

            </div>
          </div>
        </div>

        {sheetOpen ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              onClick={() => setSheetOpen(false)}
              aria-label="Close controls"
            />
            <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl border border-[#c9a67c] bg-[#fffaf0] p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      sheetTab === "mode"
                        ? "retro-marquee border-transparent text-[#fff1d3]"
                        : "border-[#c9a67c] bg-white text-foreground"
                    }`}
                    onClick={() => setSheetTab("mode")}
                  >
                    Mode
                  </button>
                  <button
                    type="button"
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      sheetTab === "filters"
                        ? "retro-marquee border-transparent text-[#fff1d3]"
                        : "border-[#c9a67c] bg-white text-foreground"
                    }`}
                    onClick={() => setSheetTab("filters")}
                  >
                    Filters
                  </button>
                  <button
                    type="button"
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                      sheetTab === "effects"
                        ? "retro-marquee border-transparent text-[#fff1d3]"
                        : "border-[#c9a67c] bg-white text-foreground"
                    }`}
                    onClick={() => setSheetTab("effects")}
                  >
                    Effects
                  </button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full border-[#c9a67c] bg-white"
                  onClick={() => setSheetOpen(false)}
                >
                  Close
                </Button>
              </div>

              {sheetTab === "mode" ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      captureMode === "photo"
                        ? "retro-marquee border-transparent text-[#fff1d3] shadow-sm"
                        : "border-[#c9a67c] bg-white text-foreground hover:bg-[#f6e0bb]"
                    }`}
                    onClick={() => onCaptureModeChange("photo")}
                    disabled={busy || isRecording}
                  >
                    <Camera className="mx-auto mb-1 size-4" />
                    Photo
                  </button>
                  <button
                    type="button"
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      captureMode === "strip"
                        ? "retro-marquee border-transparent text-[#fff1d3] shadow-sm"
                        : "border-[#c9a67c] bg-white text-foreground hover:bg-[#f6e0bb]"
                    }`}
                    onClick={() => onCaptureModeChange("strip")}
                    disabled={busy || isRecording}
                  >
                    <Zap className="mx-auto mb-1 size-4" />
                    Strip
                  </button>
                  <button
                    type="button"
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      captureMode === "video"
                        ? "retro-marquee border-transparent text-[#fff1d3] shadow-sm"
                        : "border-[#c9a67c] bg-white text-foreground hover:bg-[#f6e0bb]"
                    }`}
                    onClick={() => onCaptureModeChange("video")}
                    disabled={busy || isRecording}
                  >
                    <Video className="mx-auto mb-1 size-4" />
                    Video
                  </button>
                </div>
              ) : null}

              {sheetTab === "filters" ? (
                <div>
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search filters..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="w-full rounded-xl border border-[#c9a67c] bg-white px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#c59a66] focus:outline-none focus:ring-2 focus:ring-[#c59a66]/20"
                      />
                    </div>
                  </div>
                  <div className="max-h-[40vh] overflow-y-auto grid grid-cols-2 gap-2 pr-1">
                    {filteredFilters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                          activeFilter === filter.id
                            ? "retro-marquee border-transparent text-[#fff1d3] shadow-sm"
                            : "border-[#c9a67c] bg-white text-foreground hover:bg-[#f6e0bb]"
                        }`}
                        onClick={() => onFilterChange(filter.id)}
                        disabled={busy}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {sheetTab === "effects" ? (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Sparkles className="size-4" />
                      Effects
                      {shouldUseFaceTracking ? (
                        <Badge
                          variant="outline"
                          className="ml-2 gap-1 border-[#c9a67c] bg-white text-[#71452a]"
                        >
                          <span className="size-2 rounded-full bg-green-500" />
                          Face Tracking
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search effects..."
                        value={effectSearch}
                        onChange={(e) => setEffectSearch(e.target.value)}
                        className="w-full rounded-xl border border-[#c9a67c] bg-white px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#c59a66] focus:outline-none focus:ring-2 focus:ring-[#c59a66]/20"
                      />
                    </div>
                  </div>
                  <div className="max-h-[40vh] overflow-y-auto grid grid-cols-2 gap-2 pr-1">
                    {filteredEffects.map((effect) => (
                      <button
                        key={effect.id}
                        type="button"
                        className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                          activeEffect === effect.id
                            ? "retro-marquee border-transparent text-[#fff1d3] shadow-sm"
                            : "border-[#c9a67c] bg-white text-foreground hover:bg-[#f6e0bb]"
                        }`}
                        onClick={() => onEffectChange(effect.id)}
                        disabled={busy}
                      >
                        {effect.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between gap-3">
                <Badge
                  variant="outline"
                  className="rounded-full border-[#c9a67c] bg-white px-4 py-2 text-xs font-semibold tracking-[0.12em] text-[#71452a]"
                >
                  Downloads stay on your device
                </Badge>
                <Button
                  type="button"
                  variant={countdownEnabled ? "secondary" : "outline"}
                  size="sm"
                  className="rounded-full border-[#c9a67c] bg-white text-[#71452a]"
                  onClick={onToggleCountdown}
                  disabled={busy}
                >
                  <TimerReset />
                  {countdownEnabled ? "Countdown On" : "Countdown Off"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {errorMessage ? (
          <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
