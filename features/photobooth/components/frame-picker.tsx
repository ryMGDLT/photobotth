"use client";

import { useEffect, useRef, useState } from "react";
import type { PhotoFrameId } from "@/features/photobooth/types/frame.types";
import { getAllFrames, drawFrame } from "@/features/photobooth/services/frame-registry";

interface FramePickerProps {
  selectedFrame: PhotoFrameId;
  onFrameChange: (frameId: PhotoFrameId) => void;
  disabled?: boolean;
}

export function FramePicker({ selectedFrame, onFrameChange, disabled = false }: FramePickerProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [previewsGenerated, setPreviewsGenerated] = useState(false);

  useEffect(() => {
    const frames = getAllFrames();
    
    frames.forEach((frame, index) => {
      const canvas = canvasRefs.current[index];
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw mini preview
      drawFrame(ctx, canvas.width, canvas.height, frame.id);
    });

    setPreviewsGenerated(true);
  }, []);

  const frames = getAllFrames();

  return (
    <div className="grid grid-cols-4 gap-3">
      {frames.map((frame, index) => {
        const isSelected = selectedFrame === frame.id;
        
        return (
          <div key={frame.id} className="flex flex-col items-center gap-1">
            <button
              type="button"
              className={`relative aspect-[2.5/3.5] w-full rounded-xl border-2 transition-all duration-200 hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 ${
                isSelected
                  ? "border-[color:var(--primary)] ring-2 ring-[color:var(--primary)]/20"
                  : "border-[color:var(--border)] hover:border-[color:var(--primary)]/50"
              }`}
              onClick={() => onFrameChange(frame.id)}
              disabled={disabled}
            >
              <div className="absolute inset-0 flex items-center justify-center p-2">
                <canvas
                  ref={(el) => {
                    canvasRefs.current[index] = el;
                  }}
                  width={60}
                  height={80}
                  className="w-full h-full object-contain rounded-sm"
                  style={{ imageRendering: "crisp-edges" }}
                />
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--primary)]">
                  <svg
                    className="h-3 w-3 text-[color:var(--primary-foreground)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
            <span className="h-8 w-full text-xs font-medium text-[color:var(--foreground)] leading-tight text-center flex items-start justify-center">
              {frame.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
