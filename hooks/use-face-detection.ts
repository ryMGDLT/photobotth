"use client";

import { useEffect, useRef, useState } from "react";

export interface FaceLandmarks {
  x: number;
  y: number;
  z?: number;
}

export interface FaceDetectionResult {
  landmarks: FaceLandmarks[] | null;
  isLoading: boolean;
  error: string | null;
}

interface UseFaceDetectionOptions {
  videoElement: HTMLVideoElement | null;
  enabled: boolean;
}

export function useFaceDetection({
  videoElement,
  enabled,
}: UseFaceDetectionOptions): FaceDetectionResult {
  const [landmarks, setLandmarks] = useState<FaceLandmarks[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const faceMeshRef = useRef<any>(null);
  const requestRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !videoElement) {
      // Reset state when disabled or no video - this is cleanup, not cascading render
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLandmarks(null);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    if (isInitializedRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);
    isInitializedRef.current = true;

    const loadFaceMesh = async () => {
      try {
        // Dynamic import to avoid build issues
        const { FaceMesh } = await import("@mediapipe/face_mesh");

        const faceMesh = new FaceMesh({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
          },
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        faceMesh.onResults((results: { multiFaceLandmarks?: Array<Array<{ x: number; y: number; z?: number }>> }) => {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const faceLandmarks = results.multiFaceLandmarks[0];
            setLandmarks(faceLandmarks);
            setError(null);
          } else {
            setLandmarks(null);
          }
          setIsLoading(false);
        });

        faceMeshRef.current = faceMesh;

        // Wait for video to be ready
        if (videoElement.readyState >= 2) {
          const processFrame = async () => {
            if (!videoElement || !enabled || !faceMeshRef.current) {
              return;
            }

            try {
              await faceMeshRef.current.send({ image: videoElement });
            } catch (err) {
              console.error("Face detection error:", err);
            }

            requestRef.current = requestAnimationFrame(processFrame);
          };

          requestRef.current = requestAnimationFrame(processFrame);
        } else {
          videoElement.addEventListener("loadeddata", () => {
            const processFrame = async () => {
              if (!videoElement || !enabled || !faceMeshRef.current) {
                return;
              }

              try {
                await faceMeshRef.current.send({ image: videoElement });
              } catch (err) {
                console.error("Face detection error:", err);
              }

              requestRef.current = requestAnimationFrame(processFrame);
            };

            requestRef.current = requestAnimationFrame(processFrame);
          });
        }
      } catch (err) {
        console.error("Failed to load FaceMesh:", err);
        setError("Failed to initialize face detection");
        setIsLoading(false);
        isInitializedRef.current = false;
      }
    };

    loadFaceMesh();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
      isInitializedRef.current = false;
    };
  }, [videoElement, enabled]);

  return { landmarks, isLoading, error };
}
