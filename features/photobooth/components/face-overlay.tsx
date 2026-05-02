"use client";

import { useEffect, useRef, useState } from "react";
import type { FaceLandmarks } from "@/hooks/use-face-detection";

interface FaceOverlayProps {
  landmarks: FaceLandmarks[] | null;
  effect: string;
  videoWidth: number;
  videoHeight: number;
  videoElement: HTMLVideoElement | null;
}

// MediaPipe Face Mesh landmark indices for key facial features
const LANDMARKS = {
  leftEye: 33,
  rightEye: 362,
  nose: 1,
  mouth: 61,
  leftEar: 234,
  rightEar: 454,
  forehead: 10,
  chin: 152,
  leftCheek: 234,
  rightCheek: 454,
};

export function FaceOverlay({ landmarks, effect, videoWidth, videoHeight, videoElement }: FaceOverlayProps) {
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!videoElement) return;

    const updateSize = () => {
      const rect = videoElement.getBoundingClientRect();
      setDisplaySize({
        width: rect.width,
        height: rect.height,
      });
    };

    updateSize();
    const interval = setInterval(updateSize, 100);

    return () => {
      clearInterval(interval);
    };
  }, [videoElement]);

  if (!landmarks || landmarks.length === 0 || effect === "none" || displaySize.width === 0) {
    return null;
  }

  const getPoint = (index: number) => {
    const landmark = landmarks[index];
    if (!landmark) return { x: 0, y: 0 };
    return {
      x: landmark.x * displaySize.width,
      y: landmark.y * displaySize.height,
    };
  };

  const renderCatEars = () => {
    const leftEar = getPoint(LANDMARKS.leftEar);
    const rightEar = getPoint(LANDMARKS.rightEar);
    const forehead = getPoint(LANDMARKS.forehead);

    const earSize = displaySize.width * 0.15;
    const earHeight = displaySize.width * 0.2;

    return (
      <>
        <ellipse
          cx={leftEar.x - 20}
          cy={leftEar.y - earHeight * 0.5}
          rx={earSize * 0.6}
          ry={earHeight}
          fill="rgba(30,30,30,0.9)"
          transform={`rotate(-15, ${leftEar.x - 20}, ${leftEar.y - earHeight * 0.5})`}
        />
        <ellipse
          cx={rightEar.x + 20}
          cy={rightEar.y - earHeight * 0.5}
          rx={earSize * 0.6}
          ry={earHeight}
          fill="rgba(30,30,30,0.9)"
          transform={`rotate(15, ${rightEar.x + 20}, ${rightEar.y - earHeight * 0.5})`}
        />
      </>
    );
  };

  const renderDevilHorns = () => {
    const leftEar = getPoint(LANDMARKS.leftEar);
    const rightEar = getPoint(LANDMARKS.rightEar);
    const forehead = getPoint(LANDMARKS.forehead);

    const hornWidth = displaySize.width * 0.08;
    const hornHeight = displaySize.width * 0.2;

    return (
      <>
        <path
          d={`M ${leftEar.x - 30} ${leftEar.y - hornHeight * 0.3} L ${leftEar.x - 50} ${leftEar.y - hornHeight} L ${leftEar.x - 10} ${leftEar.y - hornHeight * 0.5} Z`}
          fill="rgba(139,0,0,0.9)"
        />
        <path
          d={`M ${rightEar.x + 30} ${rightEar.y - hornHeight * 0.3} L ${rightEar.x + 50} ${rightEar.y - hornHeight} L ${rightEar.x + 10} ${rightEar.y - hornHeight * 0.5} Z`}
          fill="rgba(139,0,0,0.9)"
        />
      </>
    );
  };

  const renderAngelHalo = () => {
    const forehead = getPoint(LANDMARKS.forehead);
    const haloRadius = displaySize.width * 0.15;
    const haloThickness = 8;

    return (
      <ellipse
        cx={forehead.x}
        cy={forehead.y - haloRadius}
        rx={haloRadius}
        ry={haloRadius * 0.3}
        fill="none"
        stroke="rgba(255,215,0,0.9)"
        strokeWidth={haloThickness}
      />
    );
  };

  const renderGlasses = () => {
    const leftEye = getPoint(LANDMARKS.leftEye);
    const rightEye = getPoint(LANDMARKS.rightEye);
    const nose = getPoint(LANDMARKS.nose);

    const eyeDistance = Math.abs(rightEye.x - leftEye.x);
    const lensRadius = eyeDistance * 0.4;
    const bridgeWidth = eyeDistance * 0.2;

    return (
      <>
        {/* Left lens */}
        <ellipse
          cx={leftEye.x}
          cy={leftEye.y}
          rx={lensRadius}
          ry={lensRadius * 0.6}
          fill="rgba(0,0,0,0.7)"
          stroke="rgba(0,0,0,0.9)"
          strokeWidth={4}
        />
        {/* Right lens */}
        <ellipse
          cx={rightEye.x}
          cy={rightEye.y}
          rx={lensRadius}
          ry={lensRadius * 0.6}
          fill="rgba(0,0,0,0.7)"
          stroke="rgba(0,0,0,0.9)"
          strokeWidth={4}
        />
        {/* Bridge */}
        <line
          x1={leftEye.x + lensRadius}
          y1={leftEye.y}
          x2={rightEye.x - lensRadius}
          y2={rightEye.y}
          stroke="rgba(0,0,0,0.7)"
          strokeWidth={6}
        />
      </>
    );
  };

  const renderMustache = () => {
    const nose = getPoint(LANDMARKS.nose);
    const mouth = getPoint(LANDMARKS.mouth);
    const chin = getPoint(LANDMARKS.chin);

    const mustacheWidth = videoWidth * 0.2;
    const mustacheHeight = videoWidth * 0.05;
    const mustacheY = nose.y + (mouth.y - nose.y) * 0.6;

    return (
      <ellipse
        cx={nose.x}
        cy={mustacheY}
        rx={mustacheWidth}
        ry={mustacheHeight}
        fill="rgba(60,40,20,0.8)"
      />
    );
  };

  const renderBlush = () => {
    const leftCheek = getPoint(LANDMARKS.leftCheek);
    const rightCheek = getPoint(LANDMARKS.rightCheek);

    const blushRadius = displaySize.width * 0.08;

    return (
      <>
        <ellipse
          cx={leftCheek.x}
          cy={leftCheek.y}
          rx={blushRadius}
          ry={blushRadius * 0.8}
          fill="rgba(255,150,150,0.6)"
        />
        <ellipse
          cx={rightCheek.x}
          cy={rightCheek.y}
          rx={blushRadius}
          ry={blushRadius * 0.8}
          fill="rgba(255,150,150,0.6)"
        />
      </>
    );
  };

  const renderTears = () => {
    const leftEye = getPoint(LANDMARKS.leftEye);
    const rightEye = getPoint(LANDMARKS.rightEye);

    const tearRadius = videoWidth * 0.02;
    const tearOffset = videoWidth * 0.03;

    return (
      <>
        <ellipse
          cx={leftEye.x}
          cy={leftEye.y + tearOffset}
          rx={tearRadius}
          ry={tearRadius * 1.5}
          fill="rgba(100,149,237,0.7)"
        />
        <ellipse
          cx={rightEye.x}
          cy={rightEye.y + tearOffset}
          rx={tearRadius}
          ry={tearRadius * 1.5}
          fill="rgba(100,149,237,0.7)"
        />
      </>
    );
  };

  const renderSweat = () => {
    const leftForehead = getPoint(LANDMARKS.forehead);
    const rightForehead = getPoint(LANDMARKS.forehead);

    const sweatRadius = displaySize.width * 0.025;

    return (
      <>
        <ellipse
          cx={leftForehead.x - videoWidth * 0.1}
          cy={leftForehead.y}
          rx={sweatRadius}
          ry={sweatRadius * 1.2}
          fill="rgba(173,216,230,0.8)"
        />
        <ellipse
          cx={rightForehead.x + videoWidth * 0.1}
          cy={rightForehead.y + videoWidth * 0.05}
          rx={sweatRadius}
          ry={sweatRadius * 1.2}
          fill="rgba(173,216,230,0.8)"
        />
      </>
    );
  };

  const renderAngry = () => {
    const leftEye = getPoint(LANDMARKS.leftEye);
    const rightEye = getPoint(LANDMARKS.rightEye);
    const eyebrowOffset = displaySize.width * 0.03;

    return (
      <>
        <line
          x1={leftEye.x - eyebrowOffset * 2}
          y1={leftEye.y - eyebrowOffset}
          x2={leftEye.x + eyebrowOffset * 2}
          y2={leftEye.y + eyebrowOffset}
          stroke="rgba(200,0,0,0.6)"
          strokeWidth={6}
          strokeLinecap="round"
        />
        <line
          x1={rightEye.x - eyebrowOffset * 2}
          y1={rightEye.y + eyebrowOffset}
          x2={rightEye.x + eyebrowOffset * 2}
          y2={rightEye.y - eyebrowOffset}
          stroke="rgba(200,0,0,0.6)"
          strokeWidth={6}
          strokeLinecap="round"
        />
      </>
    );
  };

  const renderSurprised = () => {
    const leftEye = getPoint(LANDMARKS.leftEye);
    const rightEye = getPoint(LANDMARKS.rightEye);

    const eyeRadius = videoWidth * 0.04;

    return (
      <>
        <ellipse
          cx={leftEye.x}
          cy={leftEye.y}
          rx={eyeRadius}
          ry={eyeRadius * 1.3}
          fill="rgba(255,255,255,0.7)"
        />
        <ellipse
          cx={rightEye.x}
          cy={rightEye.y}
          rx={eyeRadius}
          ry={eyeRadius * 1.3}
          fill="rgba(255,255,255,0.7)"
        />
      </>
    );
  };

  const renderEffect = () => {
    switch (effect) {
      case "cat-ears":
        return renderCatEars();
      case "devil-horns":
        return renderDevilHorns();
      case "angel-halo":
        return renderAngelHalo();
      case "glasses":
        return renderGlasses();
      case "mustache":
        return renderMustache();
      case "blush":
        return renderBlush();
      case "tears":
        return renderTears();
      case "sweat":
        return renderSweat();
      case "angry":
        return renderAngry();
      case "surprised":
        return renderSurprised();
      default:
        return null;
    }
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={displaySize.width}
      height={displaySize.height}
      viewBox={`0 0 ${displaySize.width} ${displaySize.height}`}
      preserveAspectRatio="none"
    >
      {renderEffect()}
    </svg>
  );
}
