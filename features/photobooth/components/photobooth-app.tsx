"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CameraStage } from "@/features/photobooth/components/camera-stage";
import { EditorPanel } from "@/features/photobooth/components/editor-panel";
import { SessionBanner } from "@/features/photobooth/components/session-banner";
import { SessionGallery } from "@/features/photobooth/components/session-gallery";
import { WelcomeScreen } from "@/features/photobooth/components/welcome-screen";
import {
  changePhotoStatus,
  createCapture,
  deletePhoto,
  downloadPhoto,
  duplicatePhoto,
  getEmptyEditorState,
  hydrateSessionGallery,
  updatePhotoEdits,
} from "@/features/photobooth/services/photobooth-storage.service";
import type {
  CameraEffectPreset,
  CameraFilterPreset,
  CameraPermissionState,
  EditorSettings,
  PhotoLayout,
  PhotoRecord,
  PhotoStatus,
  PhotoStylePreset,
} from "@/features/photobooth/types/photobooth.types";
import { COUNTDOWN_SECONDS } from "@/features/photobooth/utils/photobooth-helpers";
import { getCameraEffectCss, getCameraFilterCss } from "@/features/photobooth/utils/camera-filters";
import { createEditorSettings } from "@/features/photobooth/utils/photobooth-presets";
import {
  getStoredActiveMediaId,
  setStoredActiveMediaId,
} from "@/features/photobooth/utils/photobooth-helpers";

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

const MAX_VIDEO_SECONDS = 8;

function dataUrlFromBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to convert the recording for local storage."));
    };
    reader.onerror = () =>
      reject(new Error("Unable to read the recording for local storage."));
    reader.readAsDataURL(blob);
  });
}

function drawRetroOverlay(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.save();
  for (let line = 0; line < height; line += 4) {
    context.fillStyle = "rgba(23, 14, 42, 0.04)";
    context.fillRect(0, line, width, 2);
  }

  context.strokeStyle = "rgba(255, 244, 229, 0.72)";
  context.lineWidth = Math.max(8, width * 0.014);
  context.strokeRect(0, 0, width, height);
  context.restore();
}

interface PhotoboothAppProps {
  currentPage: "welcome" | "camera" | "editor" | "gallery";
}

export function PhotoboothApp({ currentPage }: PhotoboothAppProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingDurationMsRef = useRef(0);
  const recordingAnimationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);
  const [sessionId, setSessionId] = useState("");
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [permissionState, setPermissionState] =
    useState<CameraPermissionState>("idle");
  const [countdownEnabled, setCountdownEnabled] = useState(true);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraFilter, setCameraFilter] =
    useState<CameraFilterPreset>("natural");
  const [cameraEffect, setCameraEffect] =
    useState<CameraEffectPreset>("none");
  const [captureMode, setCaptureMode] = useState<"photo" | "video">("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadGallery() {
      try {
        const hydratedGallery = await hydrateSessionGallery();
        if (!mounted) {
          return;
        }

        setSessionId(hydratedGallery.sessionId);
        setPhotos(hydratedGallery.photos);
        const storedActivePhotoId = getStoredActiveMediaId(window.sessionStorage);
        const defaultActivePhotoId =
          hydratedGallery.photos.find((photo) => photo.id === storedActivePhotoId)?.id ??
          hydratedGallery.photos[0]?.id ??
          null;
        setActivePhotoId(defaultActivePhotoId);
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to restore your local session.",
          );
        }
      } finally {
        if (mounted) {
          setHydrating(false);
        }
      }
    }

    void loadGallery();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      if (recordingAnimationFrameRef.current) {
        window.cancelAnimationFrame(recordingAnimationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setStoredActiveMediaId(window.sessionStorage, activePhotoId);
  }, [activePhotoId]);

  const activePhoto = photos.find((photo) => photo.id === activePhotoId) ?? null;
  const editorState = activePhoto
    ? {
        layout: activePhoto.layout,
        settings: activePhoto.settings,
      }
    : getEmptyEditorState();

  async function handleStartCamera(): Promise<void> {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setPermissionState("unavailable");
      setErrorMessage("This device cannot open a live webcam in the browser.");
      return;
    }

    try {
      setBusy(true);
      setPermissionState("requesting");
      setErrorMessage(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setPermissionState("granted");
    } catch (error) {
      setPermissionState("denied");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Camera permission was denied.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleCapture(): Promise<void> {
    if (!videoRef.current || !canvasRef.current || !sessionId) {
      return;
    }

    if (countdownEnabled) {
      for (let secondsLeft = COUNTDOWN_SECONDS; secondsLeft > 0; secondsLeft -= 1) {
        setCountdownValue(secondsLeft);
        await delay(1000);
      }
    }

    setCountdownValue(null);
    setFlashActive(true);
    window.setTimeout(() => setFlashActive(false), 180);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 960;
    canvas.height = video.videoHeight || 1200;

    const context = canvas.getContext("2d");
    if (!context) {
      setErrorMessage("Canvas capture is unavailable in this browser.");
      return;
    }

    context.filter = getCameraFilterCss(cameraFilter);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.filter = "none";
    const sourceImage = canvas.toDataURL("image/jpeg", 0.92);

    setBusy(true);
    setErrorMessage(null);

    try {
      const nextGallery = await createCapture({
        sessionId,
        photos,
        mediaType: "photo",
        sourceImage,
        cameraFilter,
      });

      setPhotos(nextGallery.photos);
      const nextActivePhotoId = nextGallery.photos[0]?.id ?? null;
      setActivePhotoId(nextActivePhotoId);
      if (nextActivePhotoId) {
        router.push("/editor");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save the new capture.",
      );
    } finally {
      setBusy(false);
    }
  }

  function stopRecordingLoop(): void {
    if (recordingAnimationFrameRef.current) {
      window.cancelAnimationFrame(recordingAnimationFrameRef.current);
      recordingAnimationFrameRef.current = null;
    }
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    recordingStartTimeRef.current = null;
    isRecordingRef.current = false;
  }

  function renderRecordingFrame(): void {
    const video = videoRef.current;
    const canvas = recordingCanvasRef.current;
    if (!video || !canvas || !isRecordingRef.current) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.filter = getCameraFilterCss(cameraFilter);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.filter = "none";
    drawRetroOverlay(context, canvas.width, canvas.height);

    const stamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    context.fillStyle = "rgba(255, 246, 235, 0.88)";
    context.font = "700 28px var(--font-geist-mono), monospace";
    context.fillText(`FLASHFRAME ${stamp}`, 26, canvas.height - 28);

    recordingAnimationFrameRef.current = window.requestAnimationFrame(
      renderRecordingFrame,
    );
  }

  async function finalizeVideoCapture(recordingBlob: Blob): Promise<void> {
    if (!sessionId || !canvasRef.current) {
      return;
    }

    const videoDataUrl = await dataUrlFromBlob(recordingBlob);
    const posterImage = canvasRef.current.toDataURL("image/jpeg", 0.92);

    const nextGallery = await createCapture({
      sessionId,
      photos,
      mediaType: "video",
      sourceImage: posterImage,
      sourceVideo: videoDataUrl,
      renderedVideo: videoDataUrl,
      durationMs: recordingDurationMsRef.current,
      cameraFilter,
    });

    setPhotos(nextGallery.photos);
    const nextActivePhotoId = nextGallery.photos[0]?.id ?? null;
    setActivePhotoId(nextActivePhotoId);
    if (nextActivePhotoId) {
      router.push("/editor");
    }
  }

  async function handleStartRecording(): Promise<void> {
    if (!streamRef.current || !videoRef.current || !canvasRef.current) {
      await handleStartCamera();
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setErrorMessage("This browser cannot record short video clips here.");
      return;
    }

    try {
      setBusy(true);
      setErrorMessage(null);

      const video = videoRef.current;
      const recordingCanvas = recordingCanvasRef.current ?? document.createElement("canvas");
      recordingCanvasRef.current = recordingCanvas;
      recordingCanvas.width = video.videoWidth || 720;
      recordingCanvas.height = video.videoHeight || 960;

      const posterCanvas = canvasRef.current;
      posterCanvas.width = recordingCanvas.width;
      posterCanvas.height = recordingCanvas.height;
      const posterContext = posterCanvas.getContext("2d");
      if (!posterContext) {
        throw new Error("Canvas rendering is unavailable in this browser.");
      }

      posterContext.filter = getCameraFilterCss(cameraFilter);
      posterContext.drawImage(video, 0, 0, posterCanvas.width, posterCanvas.height);
      posterContext.filter = "none";
      drawRetroOverlay(posterContext, posterCanvas.width, posterCanvas.height);

      recordedChunksRef.current = [];
      const stream = recordingCanvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, {
        mimeType,
      });

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        try {
          setBusy(true);
          const recordingBlob = new Blob(recordedChunksRef.current, {
            type: "video/webm",
          });
          await finalizeVideoCapture(recordingBlob);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to save the recorded clip.",
          );
        } finally {
          setBusy(false);
        }
      };

      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingSeconds(0);
      recordingStartTimeRef.current = Date.now();
      recordingDurationMsRef.current = 0;
      recordingTimerRef.current = window.setInterval(() => {
        const startedAt = recordingStartTimeRef.current ?? Date.now();
        const seconds = Math.min(
          MAX_VIDEO_SECONDS,
          Math.max(0, Math.ceil((Date.now() - startedAt) / 1000)),
        );
        recordingDurationMsRef.current = Date.now() - startedAt;
        setRecordingSeconds(seconds);
        if (seconds >= MAX_VIDEO_SECONDS) {
          void handleStopRecording();
        }
      }, 250);

      recorder.start(250);
      renderRecordingFrame();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start recording.",
      );
      stopRecordingLoop();
      setIsRecording(false);
      setRecordingSeconds(0);
    } finally {
      setBusy(false);
    }
  }

  async function handleStopRecording(): Promise<void> {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
      return;
    }

    stopRecordingLoop();
    setIsRecording(false);
    setRecordingSeconds(0);
    mediaRecorderRef.current.stop();
  }

  async function applyEdits(
    nextSettings: EditorSettings,
    nextLayout: PhotoLayout,
  ): Promise<void> {
    if (!activePhotoId || !sessionId || activePhoto?.mediaType === "video") {
      return;
    }

    setBusy(true);
    setErrorMessage(null);

    try {
      const nextGallery = await updatePhotoEdits({
        sessionId,
        photos,
        photoId: activePhotoId,
        settings: nextSettings,
        layout: nextLayout,
      });

      setPhotos(nextGallery.photos);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to apply those edits.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handlePresetChange(preset: PhotoStylePreset): Promise<void> {
    if (activePhoto?.mediaType === "video") {
      return;
    }
    await applyEdits(createEditorSettings(preset), editorState.layout);
  }

  async function handleSliderChange(
    field: keyof Omit<EditorSettings, "preset">,
    value: number,
  ): Promise<void> {
    const nextSettings: EditorSettings = {
      ...editorState.settings,
      [field]: value,
    };
    await applyEdits(nextSettings, editorState.layout);
  }

  async function handleLayoutChange(layout: PhotoLayout): Promise<void> {
    if (activePhoto?.mediaType === "video") {
      return;
    }
    await applyEdits(editorState.settings, layout);
  }

  async function handleStatusChange(status: PhotoStatus): Promise<void> {
    if (!activePhotoId || !sessionId) {
      return;
    }

    setBusy(true);
    try {
      const nextGallery = await changePhotoStatus({
        sessionId,
        photos,
        photoId: activePhotoId,
        status,
      });
      setPhotos(nextGallery.photos);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the photo status.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDuplicate(photoId: string): Promise<void> {
    if (!sessionId) {
      return;
    }

    setBusy(true);
    try {
      const nextGallery = await duplicatePhoto({ sessionId, photos, photoId });
      setPhotos(nextGallery.photos);
      const nextActivePhotoId = nextGallery.photos[0]?.id ?? null;
      setActivePhotoId(nextActivePhotoId);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to duplicate that photo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(photoId: string): Promise<void> {
    if (!sessionId) {
      return;
    }

    setBusy(true);
    try {
      const nextGallery = await deletePhoto({ sessionId, photos, photoId });
      setPhotos(nextGallery.photos);
      setActivePhotoId((currentActivePhotoId) =>
        currentActivePhotoId === photoId ? nextGallery.photos[0]?.id ?? null : currentActivePhotoId,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to delete that photo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleGalleryStatusChange(
    photoId: string,
    status: PhotoStatus,
  ): Promise<void> {
    setActivePhotoId(photoId);
    if (!sessionId) {
      return;
    }

    setBusy(true);
    try {
      const nextGallery = await changePhotoStatus({
        sessionId,
        photos,
        photoId,
        status,
      });
      setPhotos(nextGallery.photos);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update the photo status.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload(photoId?: string): Promise<void> {
    const targetPhoto = photos.find((photo) => photo.id === (photoId ?? activePhotoId));
    if (!targetPhoto) {
      return;
    }

    try {
      await downloadPhoto(targetPhoto);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to download that photo.",
      );
    }
  }

  function handleRetake(): void {
    setActivePhotoId(null);
    setErrorMessage(null);
  }

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
        savedCount={photos.filter((photo) => photo.status === "saved").length}
        sessionId={sessionId || "loading"}
        currentPage={currentPage}
      />

      {currentPage === "camera" ? (
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
          busy={busy || hydrating}
          isRecording={isRecording}
          recordingSeconds={recordingSeconds}
          errorMessage={errorMessage}
          videoRef={videoRef}
          canvasRef={canvasRef}
          onStartCamera={handleStartCamera}
          onCapture={handleCapture}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onToggleCountdown={() => setCountdownEnabled((current) => !current)}
          onRetake={handleRetake}
          onFilterChange={setCameraFilter}
          onEffectChange={setCameraEffect}
          onCaptureModeChange={setCaptureMode}
        />
      ) : null}

      {currentPage === "editor" ? (
        <EditorPanel
          activePhoto={activePhoto}
          settings={editorState.settings}
          layout={editorState.layout}
          busy={busy || hydrating}
          onPresetChange={(preset) => void handlePresetChange(preset)}
          onLayoutChange={(layout) => void handleLayoutChange(layout)}
          onSliderChange={(field, value) => void handleSliderChange(field, value)}
          onStatusChange={(status) => void handleStatusChange(status)}
          onDownload={() => void handleDownload()}
        />
      ) : null}

      {currentPage === "gallery" ? (
        <SessionGallery
          photos={photos}
          activePhotoId={activePhotoId}
          busy={busy || hydrating}
          hydrating={hydrating}
          onSelect={(photoId) => {
            setActivePhotoId(photoId);
            router.push("/editor");
          }}
          onDuplicate={(photoId) => void handleDuplicate(photoId)}
          onDelete={(photoId) => void handleDelete(photoId)}
          onDownload={(photoId) => void handleDownload(photoId)}
          onStatusChange={(photoId, status) =>
            void handleGalleryStatusChange(photoId, status)
          }
        />
      ) : null}
    </main>
  );
}
