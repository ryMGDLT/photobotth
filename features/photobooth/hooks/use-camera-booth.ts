"use client";

import { useRef, useState, useEffect } from "react";
import type {
  CameraEffectPreset,
  CameraFilterPreset,
  CameraPermissionState,
  PhotoRecord,
} from "@/features/photobooth/types/photobooth.types";
import { getCameraFilterCss } from "@/features/photobooth/utils/camera-filters";
import { drawFaceEffect } from "@/features/photobooth/utils/face-renderer";
import { WebGLVHSRenderer } from "@/features/photobooth/utils/webgl-vhs";
import { COUNTDOWN_SECONDS } from "@/features/photobooth/utils/photobooth-helpers";
import { createCapture } from "@/features/photobooth/services/photobooth-storage.service";
import { useFaceDetection } from "@/hooks/use-face-detection";
import type { FaceLandmarks } from "@/hooks/use-face-detection";

const MAX_VIDEO_SECONDS = 8;
const CAPTURE_ASPECT_RATIO = 3 / 2;

function getSourceDimensions(source: HTMLVideoElement | HTMLCanvasElement): {
  width: number;
  height: number;
} {
  if (source instanceof HTMLVideoElement) {
    return {
      width: source.videoWidth || 1280,
      height: source.videoHeight || 720,
    };
  }
  return { width: source.width || 1280, height: source.height || 720 };
}

function getCenterCropRect(
  sourceWidth: number,
  sourceHeight: number,
  targetAspect: number,
): {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
} {
  const sourceAspect = sourceWidth / sourceHeight;
  if (sourceAspect > targetAspect) {
    const sw = Math.round(sourceHeight * targetAspect);
    const sx = Math.round((sourceWidth - sw) / 2);
    return { sx, sy: 0, sw, sh: sourceHeight };
  }

  const sh = Math.round(sourceWidth / targetAspect);
  const sy = Math.round((sourceHeight - sh) / 2);
  return { sx: 0, sy, sw: sourceWidth, sh };
}

function cropLandmarksToRect(
  landmarks: FaceLandmarks[],
  source: { width: number; height: number },
  crop: { sx: number; sy: number; sw: number; sh: number },
): FaceLandmarks[] {
  return landmarks.map((landmark) => {
    const xPx = landmark.x * source.width;
    const yPx = landmark.y * source.height;
    const x = (xPx - crop.sx) / crop.sw;
    const y = (yPx - crop.sy) / crop.sh;
    return {
      ...landmark,
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    };
  });
}

function drawCroppedFrame(options: {
  context: CanvasRenderingContext2D;
  source: HTMLVideoElement | HTMLCanvasElement;
  sourceDimensions: { width: number; height: number };
  cameraFilter: CameraFilterPreset;
  cameraEffect: CameraEffectPreset;
  rotation: number;
  landmarks: FaceLandmarks[] | null;
  outputWidth: number;
  outputHeight: number;
  crop: { sx: number; sy: number; sw: number; sh: number };
}) {
  const {
    context,
    source,
    sourceDimensions,
    cameraFilter,
    cameraEffect,
    rotation,
    landmarks,
    outputWidth,
    outputHeight,
    crop,
  } = options;

  const rotate = rotation === 90 || rotation === 270;
  const drawWidth = rotate ? outputHeight : outputWidth;
  const drawHeight = rotate ? outputWidth : outputHeight;

  context.save();
  context.translate(outputWidth / 2, outputHeight / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.filter = getCameraFilterCss(cameraFilter);
  context.drawImage(
    source,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  context.filter = "none";
  context.restore();

  if (landmarks) {
    drawFaceEffect(
      context,
      cropLandmarksToRect(landmarks, sourceDimensions, crop),
      cameraEffect,
      outputWidth,
      outputHeight,
      rotation,
    );
  }
}

interface UseCameraBoothOptions {
  sessionId: string;
  photos: PhotoRecord[];
  cameraFilter: CameraFilterPreset;
  cameraEffect: CameraEffectPreset;
  onCaptureSuccess: (photos: PhotoRecord[], nextActiveId: string) => void;
  onError: (message: string) => void;
}

export function useCameraBooth({
  sessionId,
  photos,
  cameraFilter,
  cameraEffect,
  onCaptureSuccess,
  onError,
}: UseCameraBoothOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const webglRendererRef = useRef<WebGLVHSRenderer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingDurationMsRef = useRef(0);
  const recordingAnimationFrameRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  const [permissionState, setPermissionState] = useState<CameraPermissionState>("idle");
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [rotation, setRotation] = useState(0);

  // Face Detection integration
  const faceTrackedEffects = [
    "cat-ears", "devil-horns", "angel-halo", "glasses", "mustache",
    "blush", "tears", "sweat", "angry", "surprised"
  ];
  
  const { landmarks } = useFaceDetection({
    videoElement: videoRef.current,
    enabled: faceTrackedEffects.includes(cameraEffect) && permissionState === "granted",
  });

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      if (recordingAnimationFrameRef.current) window.cancelAnimationFrame(recordingAnimationFrameRef.current);
      if (webglRendererRef.current) webglRendererRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (cameraFilter === "vhs-pro" && videoRef.current && webglCanvasRef.current) {
      if (!webglRendererRef.current) {
        webglRendererRef.current = new WebGLVHSRenderer(
          webglCanvasRef.current,
          videoRef.current,
          () => rotation // Always pass current rotation conceptually, though our shader handles it simply
        );
        webglRendererRef.current.start();
      }
    } else {
      if (webglRendererRef.current) {
        webglRendererRef.current.destroy();
        webglRendererRef.current = null;
      }
    }
  }, [cameraFilter, permissionState, rotation]);

  const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  async function handleStartCamera() {
    if (!navigator?.mediaDevices?.getUserMedia) {
      setPermissionState("unavailable");
      onError("This device cannot open a live webcam in the browser.");
      return;
    }

    try {
      setBusy(true);
      setPermissionState("requesting");

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setPermissionState("granted");
    } catch (err) {
      setPermissionState("denied");
      onError(err instanceof Error ? err.message : "Camera permission was denied.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCapture(countdownEnabled: boolean, captureMode: "single" | "strip" = "single") {
    if (!videoRef.current || !canvasRef.current || !sessionId) return;

    setBusy(true);
    const capturedImages: string[] = [];
    const shotsToTake = captureMode === "strip" ? 3 : 1;

    for (let shot = 0; shot < shotsToTake; shot++) {
      if (countdownEnabled || shot > 0) {
        // Initial countdown is 3s, subsequent countdowns in a strip are 1s
        const seconds = shot === 0 ? COUNTDOWN_SECONDS : 1;
        for (let s = seconds; s > 0; s--) {
          setCountdownValue(s);
          await delay(1000);
        }
      }

      setCountdownValue(null);
      setFlashActive(true);
      window.setTimeout(() => setFlashActive(false), 180);

      const video = videoRef.current;
      const canvas = canvasRef.current;

      const context = canvas.getContext("2d");
      if (!context) {
        onError("Canvas capture is unavailable in this browser.");
        setBusy(false);
        return;
      }

      const sourceElement =
        cameraFilter === "vhs-pro" && webglCanvasRef.current ? webglCanvasRef.current : video;
      const sourceDims = getSourceDimensions(sourceElement);
      const crop = getCenterCropRect(sourceDims.width, sourceDims.height, CAPTURE_ASPECT_RATIO);

      canvas.width = crop.sw;
      canvas.height = crop.sh;
      context.clearRect(0, 0, canvas.width, canvas.height);

      drawCroppedFrame({
        context,
        source: sourceElement,
        sourceDimensions: sourceDims,
        cameraFilter,
        cameraEffect,
        rotation,
        landmarks,
        outputWidth: canvas.width,
        outputHeight: canvas.height,
        crop,
      });

      capturedImages.push(canvas.toDataURL("image/jpeg", 0.92));
      
      // Add a small pause after the flash before the next countdown begins
      if (shot < shotsToTake - 1) {
        await delay(400);
      }
    }

    try {
      const nextGallery = await createCapture({
        sessionId,
        photos,
        mediaType: "photo",
        sourceImage: capturedImages[0],
        stripImages: captureMode === "strip" ? capturedImages : undefined,
        cameraFilter,
        layout: captureMode === "strip" ? "strip" : "single",
      });
      onCaptureSuccess(nextGallery.photos, nextGallery.photos[0].id);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Unable to save capture.");
    } finally {
      setBusy(false);
    }
  }

  // --- Video Recording Logic ---

  function drawRetroOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.save();
    for (let line = 0; line < h; line += 4) {
      ctx.fillStyle = "rgba(23, 14, 42, 0.04)";
      ctx.fillRect(0, line, w, 2);
    }
    ctx.strokeStyle = "rgba(255, 244, 229, 0.72)";
    ctx.lineWidth = Math.max(8, w * 0.014);
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();
  }

  function renderRecordingFrame() {
    const video = videoRef.current;
    const canvas = recordingCanvasRef.current;
    if (!video || !canvas || !isRecordingRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sourceElement =
      cameraFilter === "vhs-pro" && webglCanvasRef.current ? webglCanvasRef.current : video;
    const sourceDims = getSourceDimensions(sourceElement);
    const crop = getCenterCropRect(sourceDims.width, sourceDims.height, CAPTURE_ASPECT_RATIO);

    drawCroppedFrame({
      context: ctx,
      source: sourceElement,
      sourceDimensions: sourceDims,
      cameraFilter,
      cameraEffect,
      rotation,
      landmarks,
      outputWidth: canvas.width,
      outputHeight: canvas.height,
      crop,
    });

    drawRetroOverlay(ctx, canvas.width, canvas.height);

    const stamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    ctx.fillStyle = "rgba(255, 246, 235, 0.88)";
    ctx.font = "700 28px var(--font-geist-mono), monospace";
    ctx.fillText(`FLASHFRAME ${stamp}`, 26, canvas.height - 28);

    recordingAnimationFrameRef.current = window.requestAnimationFrame(renderRecordingFrame);
  }

  async function handleStartRecording() {
    if (!streamRef.current) {
      await handleStartCamera();
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      onError("This browser cannot record video clips.");
      return;
    }

    try {
      setBusy(true);
      const video = videoRef.current!;
      const recordingCanvas = recordingCanvasRef.current ?? document.createElement("canvas");
      recordingCanvasRef.current = recordingCanvas;

      const recordingCrop = getCenterCropRect(
        video.videoWidth || 1280,
        video.videoHeight || 720,
        CAPTURE_ASPECT_RATIO,
      );
      recordingCanvas.width = recordingCrop.sw;
      recordingCanvas.height = recordingCrop.sh;

      recordedChunksRef.current = [];
      const stream = recordingCanvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm",
      });

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => e.data.size > 0 && recordedChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        try {
          setBusy(true);
          const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
          const reader = new FileReader();
          const videoDataUrl = await new Promise<string>((res, rej) => {
            reader.onloadend = () => res(reader.result as string);
            reader.onerror = rej;
            reader.readAsDataURL(blob);
          });

          const posterImage = recordingCanvas.toDataURL("image/jpeg", 0.92);
          const next = await createCapture({
            sessionId, photos, mediaType: "video",
            sourceImage: posterImage, sourceVideo: videoDataUrl, renderedVideo: videoDataUrl,
            durationMs: recordingDurationMsRef.current, cameraFilter,
          });
          onCaptureSuccess(next.photos, next.photos[0].id);
        } catch (err) {
          onError(err instanceof Error ? err.message : "Failed to save video.");
        } finally {
          setBusy(false);
        }
      };

      setIsRecording(true);
      isRecordingRef.current = true;
      setRecordingSeconds(0);
      recordingStartTimeRef.current = Date.now();
      recordingTimerRef.current = window.setInterval(() => {
        const start = recordingStartTimeRef.current!;
        const secs = Math.min(MAX_VIDEO_SECONDS, Math.ceil((Date.now() - start) / 1000));
        recordingDurationMsRef.current = Date.now() - start;
        setRecordingSeconds(secs);
        if (secs >= MAX_VIDEO_SECONDS) handleStopRecording();
      }, 250);

      recorder.start(250);
      renderRecordingFrame();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to start recording.");
      setIsRecording(false);
      isRecordingRef.current = false;
    } finally {
      setBusy(false);
    }
  }

  function handleStopRecording() {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    if (recordingAnimationFrameRef.current) window.cancelAnimationFrame(recordingAnimationFrameRef.current);
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);

    // Stop MediaRecorder and release associated resources
    const recorder = mediaRecorderRef.current;
    const recordingCanvas = recordingCanvasRef.current;

    recorder.onstop = null;
    recorder.ondataavailable = null;
    recorder.stop();

    // Stop all tracks from the canvas capture stream to free resources
    if (recordingCanvas) {
      const stream = recordingCanvas.captureStream(0);
      stream.getTracks().forEach((track) => track.stop());
    }

    isRecordingRef.current = false;
    setIsRecording(false);
    mediaRecorderRef.current = null;
  }

  return {
    videoRef,
    canvasRef,
    webglCanvasRef,
    permissionState,
    countdownValue,
    flashActive,
    busy,
    isRecording,
    recordingSeconds,
    landmarks,
    rotation,
    setRotation,
    handleStartCamera,
    handleCapture,
    handleStartRecording,
    handleStopRecording,
  };
}
