"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CameraStage } from "@/features/photobooth/components/camera-stage";
import { EditorPanel } from "@/features/photobooth/components/editor-panel";
import { SessionBanner } from "@/features/photobooth/components/session-banner";
import { SessionGallery } from "@/features/photobooth/components/session-gallery";
import { WelcomeScreen } from "@/features/photobooth/components/welcome-screen";
import { downloadPhoto } from "@/features/photobooth/services/photobooth-storage.service";
import type {
  CameraEffectPreset,
  CameraFilterPreset,
  PhotoLayout,
  PhotoStatus,
  PhotoStylePreset,
} from "@/features/photobooth/types/photobooth.types";
import { getCameraFilterCss, getCameraEffectCss } from "@/features/photobooth/utils/camera-filters";
import { createEditorSettings } from "@/features/photobooth/utils/photobooth-presets";
import { usePhotoboothGallery } from "@/features/photobooth/hooks/use-photobooth-gallery";
import { useCameraBooth } from "@/features/photobooth/hooks/use-camera-booth";

interface PhotoboothAppProps {
  currentPage: "welcome" | "camera" | "editor" | "gallery";
}

export function PhotoboothApp({ currentPage }: PhotoboothAppProps) {
  const router = useRouter();
  
  // 1. Gallery and Session State
  const {
    sessionId,
    photos,
    activePhoto,
    activePhotoId,
    setActivePhotoId,
    busy: galleryBusy,
    hydrating,
    error: galleryError,
    setError,
    setPhotos,
    handleStatusChange,
    handleDelete,
    handleDuplicate,
    handleUpdateEdits,
  } = usePhotoboothGallery();

  // 2. Camera Preview Settings
  const [cameraFilter, setCameraFilter] = useState<CameraFilterPreset>("natural");
  const [cameraEffect, setCameraEffect] = useState<CameraEffectPreset>("none");
  const [captureMode, setCaptureMode] = useState<"photo" | "video">("photo");
  const [countdownEnabled, setCountdownEnabled] = useState(true);

  // 3. Camera and Capture Logic
  const {
    videoRef,
    canvasRef,
    webglCanvasRef,
    permissionState,
    countdownValue,
    flashActive,
    busy: cameraBusy,
    isRecording,
    recordingSeconds,
    landmarks,
    rotation,
    setRotation,
    handleStartCamera,
    handleCapture,
    handleStartRecording,
    handleStopRecording,
  } = useCameraBooth({
    sessionId,
    photos,
    cameraFilter,
    cameraEffect,
    onCaptureSuccess: (updatedPhotos, nextActiveId) => {
      setPhotos(updatedPhotos);
      setActivePhotoId(nextActiveId);
      router.push("/editor");
    },
    onError: (msg) => setError(msg),
  });

  // 4. Shared UI State
  const busy = galleryBusy || cameraBusy || hydrating;
  const errorMessage = galleryError;

  // 6. Action Handlers
  const applyEdits = async (nextSettings: any, nextLayout: PhotoLayout) => {
    if (!activePhotoId || activePhoto?.mediaType === "video") return;
    await handleUpdateEdits(activePhotoId, nextSettings, nextLayout);
  };

  const handleDownload = async (photoId?: string) => {
    const target = photos.find((p) => p.id === (photoId ?? activePhotoId));
    if (target) await downloadPhoto(target);
  };

  if (currentPage === "welcome") {
    return (
      <WelcomeScreen
        photoCount={photos.length}
        onStart={() => router.push("/camera")}
      />
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <SessionBanner
        photoCount={photos.length}
        savedCount={photos.filter((p) => p.status === "saved").length}
        sessionId={sessionId || "loading"}
        currentPage={currentPage}
      />

      {currentPage === "camera" && (
        <CameraStage
          permissionState={permissionState}
          activeFilter={cameraFilter}
          activeFilterCss={getCameraFilterCss(cameraFilter)}
          activeEffect={cameraEffect}
          activeEffectCss={getCameraEffectCss(cameraEffect)}
          captureMode={captureMode}
          countdownEnabled={countdownEnabled}
          countdownValue={countdownValue}
          flashActive={flashActive}
          busy={busy}
          isRecording={isRecording}
          recordingSeconds={recordingSeconds}
          errorMessage={errorMessage}
          videoRef={videoRef}
          canvasRef={canvasRef}
          webglCanvasRef={webglCanvasRef}
          landmarks={landmarks}
          rotation={rotation}
          onRotationChange={setRotation}
          onStartCamera={handleStartCamera}
          onCapture={() => handleCapture(countdownEnabled)}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onToggleCountdown={() => setCountdownEnabled((prev) => !prev)}
          onRetake={() => { setActivePhotoId(null); setError(null); }}
          onFilterChange={setCameraFilter}
          onEffectChange={setCameraEffect}
          onCaptureModeChange={setCaptureMode}
        />
      )}

      {currentPage === "editor" && (
        <EditorPanel
          activePhoto={activePhoto}
          settings={activePhoto?.settings ?? createEditorSettings("original")}
          layout={activePhoto?.layout ?? "single"}
          busy={busy}
          onPresetChange={(p: PhotoStylePreset) => applyEdits(createEditorSettings(p), activePhoto?.layout ?? "single")}
          onLayoutChange={(l: PhotoLayout) => applyEdits(activePhoto?.settings, l)}
          onSliderChange={(f, v) => applyEdits({ ...activePhoto?.settings, [f]: v }, activePhoto?.layout ?? "single")}
          onStatusChange={(s: PhotoStatus) => activePhotoId && handleStatusChange(activePhotoId, s)}
          onDownload={() => handleDownload()}
        />
      )}

      {currentPage === "gallery" && (
        <SessionGallery
          photos={photos}
          activePhotoId={activePhotoId}
          busy={busy}
          hydrating={hydrating}
          onSelect={(id) => { setActivePhotoId(id); router.push("/editor"); }}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onStatusChange={handleStatusChange}
        />
      )}
    </main>
  );
}
