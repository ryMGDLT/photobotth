import type { FaceLandmarks } from "@/hooks/use-face-detection";

// MediaPipe Face Mesh landmark indices for key facial features
export const FACE_LANDMARKS = {
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

export function drawFaceEffect(
  context: CanvasRenderingContext2D,
  landmarks: FaceLandmarks[],
  effect: string,
  width: number,
  height: number,
  rotation: number = 0
): void {
  if (!landmarks || landmarks.length === 0 || effect === "none") {
    return;
  }

  const getPoint = (index: number) => {
    const landmark = landmarks[index];
    if (!landmark) return { x: 0, y: 0 };
    
    // Original coordinates from MediaPipe (0 to 1)
    let x = landmark.x;
    let y = landmark.y;

    // Apply rotation to normalized coordinates
    if (rotation === 90) {
      const temp = x;
      x = 1 - y;
      y = temp;
    } else if (rotation === 180) {
      x = 1 - x;
      y = 1 - y;
    } else if (rotation === 270) {
      const temp = x;
      x = y;
      y = 1 - temp;
    }

    return {
      x: x * width,
      y: y * height,
    };
  };

  context.save();

  switch (effect) {
    case "cat-ears":
      renderCatEars(context, getPoint, width);
      break;
    case "devil-horns":
      renderDevilHorns(context, getPoint, width);
      break;
    case "angel-halo":
      renderAngelHalo(context, getPoint, width);
      break;
    case "glasses":
      renderGlasses(context, getPoint, width);
      break;
    case "mustache":
      renderMustache(context, getPoint, width);
      break;
    case "blush":
      renderBlush(context, getPoint, width);
      break;
    case "tears":
      renderTears(context, getPoint, width);
      break;
    case "sweat":
      renderSweat(context, getPoint, width);
      break;
    case "angry":
      renderAngry(context, getPoint, width);
      break;
    case "surprised":
      renderSurprised(context, getPoint, width);
      break;
  }

  context.restore();
}

function renderCatEars(
  context: CanvasRenderingContext2D,
  getPoint: (i: number) => { x: number; y: number },
  width: number
) {
  const leftEar = getPoint(FACE_LANDMARKS.leftEar);
  const rightEar = getPoint(FACE_LANDMARKS.rightEar);
  const earSize = width * 0.15;
  const earHeight = width * 0.2;

  context.fillStyle = "rgba(30,30,30,0.9)";

  // Left Ear
  context.save();
  context.translate(leftEar.x - 20, leftEar.y - earHeight * 0.5);
  context.rotate((-15 * Math.PI) / 180);
  context.beginPath();
  context.ellipse(0, 0, earSize * 0.6, earHeight, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();

  // Right Ear
  context.save();
  context.translate(rightEar.x + 20, rightEar.y - earHeight * 0.5);
  context.rotate((15 * Math.PI) / 180);
  context.beginPath();
  context.ellipse(0, 0, earSize * 0.6, earHeight, 0, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function renderDevilHorns(
  context: CanvasRenderingContext2D,
  getPoint: (i: number) => { x: number; y: number },
  width: number
) {
  const leftEar = getPoint(FACE_LANDMARKS.leftEar);
  const rightEar = getPoint(FACE_LANDMARKS.rightEar);
  const hornHeight = width * 0.2;

  context.fillStyle = "rgba(139,0,0,0.9)";

  // Left Horn
  context.beginPath();
  context.moveTo(leftEar.x - 30, leftEar.y - hornHeight * 0.3);
  context.lineTo(leftEar.x - 50, leftEar.y - hornHeight);
  context.lineTo(leftEar.x - 10, leftEar.y - hornHeight * 0.5);
  context.closePath();
  context.fill();

  // Right Horn
  context.beginPath();
  context.moveTo(rightEar.x + 30, rightEar.y - hornHeight * 0.3);
  context.lineTo(rightEar.x + 50, rightEar.y - hornHeight);
  context.lineTo(rightEar.x + 10, rightEar.y - hornHeight * 0.5);
  context.closePath();
  context.fill();
}

function renderAngelHalo(
  context: CanvasRenderingContext2D,
  getPoint: (i: number) => { x: number; y: number },
  width: number
) {
  const forehead = getPoint(FACE_LANDMARKS.forehead);
  const haloRadius = width * 0.15;

  context.strokeStyle = "rgba(255,215,0,0.9)";
  context.lineWidth = 8;
  context.beginPath();
  context.ellipse(forehead.x, forehead.y - haloRadius, haloRadius, haloRadius * 0.3, 0, 0, Math.PI * 2);
  context.stroke();
}

function renderGlasses(
  context: CanvasRenderingContext2D,
  getPoint: (i: number) => { x: number; y: number },
  width: number
) {
  const leftEye = getPoint(FACE_LANDMARKS.leftEye);
  const rightEye = getPoint(FACE_LANDMARKS.rightEye);
  const eyeDistance = Math.abs(rightEye.x - leftEye.x);
  const lensRadius = eyeDistance * 0.4;

  context.fillStyle = "rgba(0,0,0,0.7)";
  context.strokeStyle = "rgba(0,0,0,0.9)";
  context.lineWidth = 4;

  // Left Lens
  context.beginPath();
  context.ellipse(leftEye.x, leftEye.y, lensRadius, lensRadius * 0.6, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  // Right Lens
  context.beginPath();
  context.ellipse(rightEye.x, rightEye.y, lensRadius, lensRadius * 0.6, 0, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  // Bridge
  context.strokeStyle = "rgba(0,0,0,0.7)";
  context.lineWidth = 6;
  context.beginPath();
  context.moveTo(leftEye.x + lensRadius, leftEye.y);
  context.lineTo(rightEye.x - lensRadius, rightEye.y);
  context.stroke();
}

function renderMustache(
  context: CanvasRenderingContext2D,
  getPoint: (i: number) => { x: number; y: number },
  width: number
) {
  const nose = getPoint(FACE_LANDMARKS.nose);
  const mouth = getPoint(FACE_LANDMARKS.mouth);
  const mustacheWidth = width * 0.2;
  const mustacheHeight = width * 0.05;
  const mustacheY = nose.y + (mouth.y - nose.y) * 0.6;

  context.fillStyle = "rgba(60,40,20,0.8)";
  context.beginPath();
  context.ellipse(nose.x, mustacheY, mustacheWidth, mustacheHeight, 0, 0, Math.PI * 2);
  context.fill();
}

function renderBlush(
  context: CanvasRenderingContext2D,
  getPoint: (i: number) => { x: number; y: number },
  width: number
) {
  const leftCheek = getPoint(FACE_LANDMARKS.leftCheek);
  const rightCheek = getPoint(FACE_LANDMARKS.rightCheek);
  const blushRadius = width * 0.08;

  context.fillStyle = "rgba(255,150,150,0.6)";

  context.beginPath();
  context.ellipse(leftCheek.x, leftCheek.y, blushRadius, blushRadius * 0.8, 0, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.ellipse(rightCheek.x, rightCheek.y, blushRadius, blushRadius * 0.8, 0, 0, Math.PI * 2);
  context.fill();
}

function renderTears(
  context: CanvasRenderingContext2D,
  getPoint: (i: number) => { x: number; y: number },
  width: number
) {
  const leftEye = getPoint(FACE_LANDMARKS.leftEye);
  const rightEye = getPoint(FACE_LANDMARKS.rightEye);
  const tearRadius = width * 0.02;
  const tearOffset = width * 0.03;

  context.fillStyle = "rgba(100,149,237,0.7)";

  context.beginPath();
  context.ellipse(leftEye.x, leftEye.y + tearOffset, tearRadius, tearRadius * 1.5, 0, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.ellipse(rightEye.x, rightEye.y + tearOffset, tearRadius, tearRadius * 1.5, 0, 0, Math.PI * 2);
  context.fill();
}

function renderSweat(
  context: CanvasRenderingContext2D,
  getPoint: (i: number) => { x: number; y: number },
  width: number
) {
  const forehead = getPoint(FACE_LANDMARKS.forehead);
  const sweatRadius = width * 0.025;

  context.fillStyle = "rgba(173,216,230,0.8)";

  context.beginPath();
  context.ellipse(forehead.x - width * 0.1, forehead.y, sweatRadius, sweatRadius * 1.2, 0, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.ellipse(forehead.x + width * 0.1, forehead.y + width * 0.05, sweatRadius, sweatRadius * 1.2, 0, 0, Math.PI * 2);
  context.fill();
}

function renderAngry(
  context: CanvasRenderingContext2D,
  getPoint: (i: number) => { x: number; y: number },
  width: number
) {
  const leftEye = getPoint(FACE_LANDMARKS.leftEye);
  const rightEye = getPoint(FACE_LANDMARKS.rightEye);
  const eyebrowOffset = width * 0.03;

  context.strokeStyle = "rgba(200,0,0,0.6)";
  context.lineWidth = 6;
  context.lineCap = "round";

  // Left Eyebrow
  context.beginPath();
  context.moveTo(leftEye.x - eyebrowOffset * 2, leftEye.y - eyebrowOffset);
  context.lineTo(leftEye.x + eyebrowOffset * 2, leftEye.y + eyebrowOffset);
  context.stroke();

  // Right Eyebrow
  context.beginPath();
  context.moveTo(rightEye.x - eyebrowOffset * 2, rightEye.y + eyebrowOffset);
  context.lineTo(rightEye.x + eyebrowOffset * 2, rightEye.y - eyebrowOffset);
  context.stroke();
}

function renderSurprised(
  context: CanvasRenderingContext2D,
  getPoint: (i: number) => { x: number; y: number },
  width: number
) {
  const leftEye = getPoint(FACE_LANDMARKS.leftEye);
  const rightEye = getPoint(FACE_LANDMARKS.rightEye);
  const eyeRadius = width * 0.04;

  context.fillStyle = "rgba(255,255,255,0.7)";

  context.beginPath();
  context.ellipse(leftEye.x, leftEye.y, eyeRadius, eyeRadius * 1.3, 0, 0, Math.PI * 2);
  context.fill();

  context.beginPath();
  context.ellipse(rightEye.x, rightEye.y, eyeRadius, eyeRadius * 1.3, 0, 0, Math.PI * 2);
  context.fill();
}
