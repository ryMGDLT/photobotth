"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { CameraStage } from "@/features/photobooth/components/camera-stage";
import { EditorPanel } from "@/features/photobooth/components/editor-panel";
import { FinishScreen } from "@/features/photobooth/components/finish-screen";
import { WizardHeader, type WizardStep } from "@/features/photobooth/components/wizard-header";
import { useCameraBooth } from "@/features/photobooth/hooks/use-camera-booth";
import { usePhotoboothGallery } from "@/features/photobooth/hooks/use-photobooth-gallery";
import { downloadPhoto } from "@/features/photobooth/services/photobooth-storage.service";
import type {
  CameraEffectPreset,
  CameraFilterPreset,
  EditorSettings,
  PhotoLayout,
  PhotoStatus,
  PhotoStylePreset,
} from "@/features/photobooth/types/photobooth.types";
import { getCameraEffectCss, getCameraFilterCss } from "@/features/photobooth/utils/camera-filters";
import { createEditorSettings } from "@/features/photobooth/utils/photobooth-presets";

export function PhotoboothWizard({
  initialStep,
}: {
  initialStep?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(() => {
    if (initialStep === "camera" || initialStep === "editor" || initialStep === "finish") {
      return initialStep;
    }
    return "camera";
  });

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
    handleUpdateEdits,
  } = usePhotoboothGallery();

  // Synchronize step state from URL param before first paint to prevent visual flicker
  // This is a legitimate URL-to-state sync pattern
  useLayoutEffect(() => {
    if (hydrating) return;
    if (initialStep === "editor" && !activePhotoId) {
      setStep("camera");
      return;
    }
    if (initialStep === "camera" || initialStep === "editor" || initialStep === "finish") {
      setStep(initialStep);
    }
  }, [activePhotoId, hydrating, initialStep]);

  const [cameraFilter, setCameraFilter] = useState<CameraFilterPreset>("natural");
  const [cameraEffect, setCameraEffect] = useState<CameraEffectPreset>("none");
  const [captureMode, setCaptureMode] = useState<"photo" | "video" | "strip">("photo");
  const [countdownEnabled, setCountdownEnabled] = useState(true);

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
      setStep("editor");
    },
    onError: (msg) => setError(msg),
  });

  const busy = galleryBusy || cameraBusy || hydrating;
  const errorMessage = galleryError;

  const resolvedSettings = useMemo<EditorSettings>(() => {
    if (activePhoto?.settings) return activePhoto.settings;
    return createEditorSettings("original");
  }, [activePhoto]);

  const resolvedLayout = useMemo<PhotoLayout>(() => {
    if (activePhoto?.layout) return activePhoto.layout;
    return "single";
  }, [activePhoto]);

  const applyEdits = async (nextSettings: EditorSettings, nextLayout: PhotoLayout) => {
    if (!activePhotoId || activePhoto?.mediaType === "video") return;
    await handleUpdateEdits(activePhotoId, nextSettings, nextLayout);
  };

  const handleDownload = async (photoId?: string) => {
    const target = photos.find((p) => p.id === (photoId ?? activePhotoId));
    if (target) await downloadPhoto(target);
  };

  const handleExit = () => {
    router.push("/");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <WizardHeader
        step={step}
        photoCount={photos.length}
        savedCount={photos.filter((p) => p.status === "saved").length}
        sessionId={sessionId || "loading"}
        onExit={handleExit}
        onBack={
          step === "editor"
            ? () => setStep("camera")
            : step === "finish"
              ? () => setStep("editor")
              : undefined
        }
      />

      <div className="flex-1 relative">
        {step === "camera" ? (
          <div className="animate-in slide-in-from-bottom-8 fade-in duration-500">
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
              onCapture={() => handleCapture(countdownEnabled, captureMode === "strip" ? "strip" : "single")}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onToggleCountdown={() => setCountdownEnabled((prev) => !prev)}
              onRetake={() => {
                setActivePhotoId(null);
                setError(null);
              }}
              onFilterChange={setCameraFilter}
              onEffectChange={setCameraEffect}
              onCaptureModeChange={setCaptureMode}
            />
          </div>
        ) : null}

        {step === "editor" ? (
          <div className="animate-in slide-in-from-right-8 fade-in duration-500 space-y-4">
            <EditorPanel
              activePhoto={activePhoto}
              settings={resolvedSettings}
              layout={resolvedLayout}
              busy={busy}
              onPresetChange={(p: PhotoStylePreset) => applyEdits(createEditorSettings(p), resolvedLayout)}
              onLayoutChange={(l: PhotoLayout) => applyEdits(resolvedSettings, l)}
              onSliderChange={(field, value) =>
                applyEdits({ ...resolvedSettings, [field]: value }, resolvedLayout)
              }
              onStatusChange={(s: PhotoStatus) => {
                if (activePhotoId) handleStatusChange(activePhotoId, s);
              }}
              onDownload={() => handleDownload()}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full"
                onClick={() => setStep("camera")}
              >
                Back to Camera
              </Button>
              <Button
                size="lg"
                className="rounded-full"
                onClick={() => setStep("finish")}
                disabled={!activePhoto}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : null}

        {step === "finish" ? (
          <FinishScreen
            canDownload={!!activePhoto}
            onDownload={() => void handleDownload()}
            onViewGallery={() => router.push("/gallery")}
            onTakeAnother={() => setStep("camera")}
            onBackToMenu={handleExit}
          />
        ) : null}
      </div>
    </main>
  );
}
