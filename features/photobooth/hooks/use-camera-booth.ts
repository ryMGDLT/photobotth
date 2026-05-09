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
import { COUNTDOWN_SECONDS } from "@/features/photobooth/utils/photobooth-helpers";
import { createCapture } from "@/features/photobooth/services/photobooth-storage.service";
import { useFaceDetection } from "@/hooks/use-face-detection";
import type { FaceLandmarks } from "@/hooks/use-face-detection";

const MAX_VIDEO_SECONDS = 8;

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
    };
  }, []);

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

  async function handleCapture(countdownEnabled: boolean) {
    if (!videoRef.current || !canvasRef.current || !sessionId) return;

    if (countdownEnabled) {
      for (let s = COUNTDOWN_SECONDS; s > 0; s--) {
        setCountdownValue(s);
        await delay(1000);
      }
    }

    setCountdownValue(null);
    setFlashActive(true);
    window.setTimeout(() => setFlashActive(false), 180);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Adjust canvas size based on rotation
    if (rotation === 90 || rotation === 270) {
      canvas.width = video.videoHeight || 1200;
      canvas.height = video.videoWidth || 960;
    } else {
      canvas.width = video.videoWidth || 960;
      canvas.height = video.videoHeight || 1200;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      onError("Canvas capture is unavailable in this browser.");
      return;
    }

    context.save();
    // Move to center of canvas and rotate
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((rotation * Math.PI) / 180);
    
    // Draw image centered
    context.filter = getCameraFilterCss(cameraFilter);
    if (rotation === 90 || rotation === 270) {
      context.drawImage(video, -canvas.height / 2, -canvas.width / 2, canvas.height, canvas.width);
    } else {
      context.drawImage(video, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    }
    context.filter = "none";
    context.restore();

    if (landmarks) {
      drawFaceEffect(context, landmarks, cameraEffect, canvas.width, canvas.height, rotation);
    }

    const sourceImage = canvas.toDataURL("image/jpeg", 0.92);

    setBusy(true);
    try {
      const nextGallery = await createCapture({
        sessionId,
        photos,
        mediaType: "photo",
        sourceImage,
        cameraFilter,
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
    
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    
    ctx.filter = getCameraFilterCss(cameraFilter);
    if (rotation === 90 || rotation === 270) {
      ctx.drawImage(video, -canvas.height / 2, -canvas.width / 2, canvas.height, canvas.width);
    } else {
      ctx.drawImage(video, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    }
    ctx.filter = "none";
    ctx.restore();

    if (landmarks) {
      drawFaceEffect(ctx, landmarks, cameraEffect, canvas.width, canvas.height, rotation);
    }

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
      
      if (rotation === 90 || rotation === 270) {
        recordingCanvas.width = video.videoHeight || 960;
        recordingCanvas.height = video.videoWidth || 720;
      } else {
        recordingCanvas.width = video.videoWidth || 720;
        recordingCanvas.height = video.videoHeight || 960;
      }

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

          const posterImage = canvasRef.current!.toDataURL("image/jpeg", 0.92);
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
    isRecordingRef.current = false;
    setIsRecording(false);
    mediaRecorderRef.current.stop();
  }

  return {
    videoRef,
    canvasRef,
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
