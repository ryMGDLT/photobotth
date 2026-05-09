"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Clapperboard,
  Download,
  Maximize,
  Minimize,
  RefreshCcw,
  Search,
  TimerReset,
  Video,
  VideoOff,
  Wand2,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  captureMode: "photo" | "video";
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
  onCaptureModeChange: (mode: "photo" | "video") => void;
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
  const [showPreviewControls, setShowPreviewControls] = useState(false);
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
    <Card className="glass-panel retro-shadow overflow-hidden border-[#eedab5] my-8">
      <CardHeader className="pb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle>Live Camera Booth</CardTitle>
            <CardDescription>
              Preview your filter before capture, then download the final photo to
              this device.
            </CardDescription>
          </div>
          <Badge
            variant={cameraReady ? "accent" : "outline"}
            className={cameraReady ? "retro-marquee text-[#fff0d0]" : "border-[#c39561] bg-[#fff7e8] text-[#7d4a2b]"}
          >
            {cameraReady ? "Camera Ready" : "Waiting"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-8 pb-8 sm:px-10 sm:pb-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-stretch">
          <div ref={cameraContainerRef} className="retro-frame relative mx-auto w-full max-w-[540px] overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#7a4328,#db9f5d_22%,#f7ebcf_48%,#d6b48a_72%,#7c4529)] p-4 sm:p-6 lg:mx-0 lg:h-full">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[1.8rem] bg-black/5">
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
                <button
                  type="button"
                  onClick={() => setShowPreviewControls((prev) => !prev)}
                  className="absolute right-14 top-3 rounded-full border border-[#c9a67c] bg-[#fffaf0] p-2 text-foreground hover:bg-[#f6e0bb] transition z-10"
                  title={showPreviewControls ? "Hide Controls" : "Show Controls"}
                >
                  <Wand2 className="size-4" />
                </button>
              ) : null}

              {isRecording ? (
                <div className="absolute right-12 top-3">
                  <Badge variant="outline" className="gap-2 border-red-300 bg-[#fff0e8] text-red-700">
                    <span className="size-2 rounded-full bg-red-500" />
                    REC {recordingSeconds}s
                  </Badge>
                </div>
              ) : null}

              {cameraReady ? (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <button
                    type="button"
                    onClick={() =>
                      void (
                        captureMode === "photo"
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
                        : isRecording
                          ? "Stop Recording"
                          : "Start Recording"
                    }
                  >
                    {captureMode === "photo" ? (
                      <Zap className="size-6" />
                    ) : isRecording ? (
                      <VideoOff className="size-6" />
                    ) : (
                      <Video className="size-6" />
                    )}
                  </button>
                </div>
              ) : null}

              {cameraReady && showPreviewControls ? (
                <div className="absolute left-4 right-4 bottom-20 rounded-2xl border border-[#c9a67c] bg-[#fffaf0]/95 backdrop-blur-sm p-4 shadow-lg">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Wand2 className="size-4" />
                      Filters & Effects
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPreviewControls(false)}
                      className="rounded-full p-1 text-foreground hover:bg-[#f6e0bb] transition"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        className="w-full rounded-xl border border-[#c9a67c] bg-[#fffaf0] px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#c59a66] focus:outline-none focus:ring-2 focus:ring-[#c59a66]/20"
                      />
                    </div>
                  </div>
                  <div className="max-h-32 overflow-y-auto grid grid-cols-3 gap-2 pr-1 mb-3">
                    {filteredFilters.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                          activeFilter === filter.id
                            ? "retro-marquee border-transparent text-[#fff1d3] shadow-sm"
                            : "border-[#c9a67c] bg-[#fffaf0] text-foreground hover:bg-[#f6e0bb]"
                        }`}
                        onClick={() => onFilterChange(filter.id)}
                        disabled={busy}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  <div className="max-h-32 overflow-y-auto grid grid-cols-3 gap-2 pr-1">
                    {filteredEffects.map((effect) => (
                      <button
                        key={effect.id}
                        type="button"
                        className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                          activeEffect === effect.id
                            ? "retro-marquee border-transparent text-[#fff1d3] shadow-sm"
                            : "border-[#c9a67c] bg-[#fffaf0] text-foreground hover:bg-[#f6e0bb]"
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
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="retro-frame rounded-[1.6rem] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Clapperboard className="size-4" />
                Capture Mode
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                    captureMode === "photo"
                      ? "retro-marquee border-transparent text-[#fff1d3] shadow-sm"
                      : "border-[#c9a67c] bg-[#fffaf0] text-foreground hover:bg-[#f6e0bb]"
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
                    captureMode === "video"
                      ? "retro-marquee border-transparent text-[#fff1d3] shadow-sm"
                      : "border-[#c9a67c] bg-[#fffaf0] text-foreground hover:bg-[#f6e0bb]"
                  }`}
                  onClick={() => onCaptureModeChange("video")}
                  disabled={busy || isRecording}
                >
                  <Video className="mx-auto mb-1 size-4" />
                  Video
                </button>
              </div>
            </div>

            <div className="retro-frame rounded-[1.6rem] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Wand2 className="size-4" />
                Live Camera Filters
              </div>
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search filters..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    className="w-full rounded-xl border border-[#c9a67c] bg-[#fffaf0] px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#c59a66] focus:outline-none focus:ring-2 focus:ring-[#c59a66]/20"
                  />
                </div>
              </div>
              <div className="max-h-[12rem] overflow-y-auto grid grid-cols-2 gap-2 pr-1">
                {filteredFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      activeFilter === filter.id
                        ? "retro-marquee border-transparent text-[#fff1d3] shadow-sm"
                        : "border-[#c9a67c] bg-[#fffaf0] text-foreground hover:bg-[#f6e0bb]"
                    }`}
                    onClick={() => onFilterChange(filter.id)}
                    disabled={busy}
                  >
                    {filter.label}
                  </button>
                ))}
                {filteredFilters.length === 0 && (
                  <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">
                    No filters found
                  </p>
                )}
              </div>
            </div>

            <div className="retro-frame rounded-[1.6rem] p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Wand2 className="size-4" />
                Effects
                {shouldUseFaceTracking && (
                  <Badge variant="outline" className="ml-2 gap-1 border-[#c9a67c] bg-[#fffaf0] text-[#71452a]">
                    <span className="size-2 rounded-full bg-green-500" />
                    Face Tracking
                  </Badge>
                )}
              </div>
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search effects..."
                    value={effectSearch}
                    onChange={(e) => setEffectSearch(e.target.value)}
                    className="w-full rounded-xl border border-[#c9a67c] bg-[#fffaf0] px-9 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#c59a66] focus:outline-none focus:ring-2 focus:ring-[#c59a66]/20"
                  />
                </div>
              </div>
              <div className="max-h-[12rem] overflow-y-auto grid grid-cols-2 gap-2 pr-1">
                {filteredEffects.map((effect) => (
                  <button
                    key={effect.id}
                    type="button"
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      activeEffect === effect.id
                        ? "retro-marquee border-transparent text-[#fff1d3] shadow-sm"
                        : "border-[#c9a67c] bg-[#fffaf0] text-foreground hover:bg-[#f6e0bb]"
                    }`}
                    onClick={() => onEffectChange(effect.id)}
                    disabled={busy}
                  >
                    {effect.label}
                  </button>
                ))}
                {filteredEffects.length === 0 && (
                  <p className="col-span-2 py-4 text-center text-sm text-muted-foreground">
                    No effects found
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                size="lg"
                className="retro-marquee w-full rounded-full px-4 text-[#fff1d3] hover:brightness-110 sm:col-span-2"
                onClick={() =>
                  void (
                    cameraReady
                      ? captureMode === "photo"
                        ? onCapture()
                        : isRecording
                          ? onStopRecording()
                          : onStartRecording()
                      : onStartCamera()
                  )
                }
                disabled={busy || permissionState === "unavailable"}
              >
                {captureMode === "photo" ? (
                  <Zap className="size-4" />
                ) : isRecording ? (
                  <VideoOff className="size-4" />
                ) : (
                  <Video className="size-4" />
                )}
                {cameraReady
                  ? captureMode === "photo"
                    ? "Take Photo"
                    : isRecording
                      ? "Stop Recording"
                      : "Record Clip"
                  : "Enable Camera"}
              </Button>

              <Button
                type="button"
                variant={countdownEnabled ? "secondary" : "outline"}
                size="lg"
                className="w-full rounded-full border-[#c59a66] bg-[#fff7ea] px-4 text-[#71452a]"
                onClick={onToggleCountdown}
                disabled={busy}
              >
                <TimerReset className="size-4" />
                {countdownEnabled ? "Countdown On" : "Countdown Off"}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full rounded-full border-[#c59a66] bg-[#fff7ea] px-4 text-[#71452a]"
                onClick={onRetake}
                disabled={busy}
              >
                <RefreshCcw className="size-4" />
                Ready for Retake
              </Button>

              <Badge variant="outline" className="flex min-h-11 w-full items-center justify-center rounded-full border-[#c59a66] bg-[#fff7ea] px-4 py-2 text-center normal-case tracking-normal text-[#71452a] sm:col-span-2">
                <Download className="mr-2 size-4" />
                <span className="min-w-0 break-words">
                  Downloads stay on the user&apos;s device
                </span>
              </Badge>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
