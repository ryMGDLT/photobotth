import type { FrameDefinition, PhotoFrameId } from "@/features/photobooth/types/frame.types";

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  bottomPadding: number,
  color: string,
  isStrip: boolean = false
): void {
  const fontSize = isStrip
    ? Math.max(48, Math.floor(canvasWidth * 0.12))
    : Math.max(64, Math.floor(canvasWidth * 0.15));
  
  ctx.fillStyle = color;
  ctx.font = `900 ${fontSize}px var(--font-geist-sans), sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  const watermarkY = canvasHeight - bottomPadding / 2;
  ctx.fillText("FLASHFRAME", canvasWidth / 2, watermarkY);
}

function drawClassicCream(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  drawWatermark(ctx, width, height, bottomPadding, "#4a445e");
}

function drawDustyPink(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#e8a0b0";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  drawWatermark(ctx, width, height, bottomPadding, "#fffaf0");
}

function drawTeal(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#5cb8b2";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  drawWatermark(ctx, width, height, bottomPadding, "#fffaf0");
}

function drawAmber(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#f5a623";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  drawWatermark(ctx, width, height, bottomPadding, "#fffaf0");
}

function drawLavender(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#b39ddb";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  drawWatermark(ctx, width, height, bottomPadding, "#fffaf0");
}

function drawDiagonalStripes(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  // Draw diagonal stripes on frame borders
  ctx.save();
  ctx.strokeStyle = "rgba(200, 180, 160, 0.3)";
  ctx.lineWidth = 2;
  
  const stripeSpacing = 8;
  
  // Top border stripes
  for (let i = -height; i < width + height; i += stripeSpacing * 2) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + stripeSpacing, 0);
    ctx.lineTo(i + stripeSpacing + height, height);
    ctx.lineTo(i + height, height);
    ctx.closePath();
    ctx.stroke();
  }
  
  ctx.restore();
  
  drawWatermark(ctx, width, height, bottomPadding, "#4a445e");
}

function drawDots(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  // Draw polka dots on frame borders
  ctx.fillStyle = "rgba(200, 180, 160, 0.4)";
  const dotSize = 3;
  const dotSpacing = 12;
  
  // Top border dots
  for (let x = framePadding; x < width - framePadding; x += dotSpacing) {
    ctx.beginPath();
    ctx.arc(x, framePadding / 2, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Bottom border dots
  for (let x = framePadding; x < width - framePadding; x += dotSpacing) {
    ctx.beginPath();
    ctx.arc(x, height - bottomPadding / 2, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Side border dots
  for (let y = framePadding; y < height - bottomPadding; y += dotSpacing) {
    ctx.beginPath();
    ctx.arc(framePadding / 2, y, dotSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width - framePadding / 2, y, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawWatermark(ctx, width, height, bottomPadding, "#4a445e");
}

function drawHearts(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  // Draw small hearts on bottom border
  ctx.fillStyle = "rgba(255, 182, 193, 0.6)";
  
  function drawHeart(x: number, y: number, size: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.beginPath();
    ctx.moveTo(0, -0.3);
    ctx.bezierCurveTo(-0.5, -0.8, -1.5, -0.8, -1.5, -0.3);
    ctx.bezierCurveTo(-1.5, 0.1, -1, 0.5, 0, 1);
    ctx.bezierCurveTo(1, 0.5, 1.5, 0.1, 1.5, -0.3);
    ctx.bezierCurveTo(1.5, -0.8, 0.5, -0.8, 0, -0.3);
    ctx.fill();
    ctx.restore();
  }
  
  const heartSize = 8;
  const heartSpacing = 30;
  const heartY = height - bottomPadding / 2;
  
  for (let x = framePadding + heartSpacing; x < width - framePadding; x += heartSpacing) {
    drawHeart(x, heartY, heartSize);
  }
  
  drawWatermark(ctx, width, height, bottomPadding, "#4a445e");
}

function drawPastelGradient(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#ffb3ba");
  gradient.addColorStop(0.5, "#bae1ff");
  gradient.addColorStop(1, "#ffffba");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  drawWatermark(ctx, width, height, bottomPadding, "#4a445e");
}

// Strip-specific frame drawing functions
function drawClassicCreamStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  drawWatermark(ctx, width, height, footerHeight, "#4a445e", true);
}

function drawDustyPinkStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#e8a0b0";
  ctx.fillRect(0, 0, width, height);
  
  drawWatermark(ctx, width, height, footerHeight, "#fffaf0", true);
}

function drawTealStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#5cb8b2";
  ctx.fillRect(0, 0, width, height);
  
  drawWatermark(ctx, width, height, footerHeight, "#fffaf0", true);
}

function drawAmberStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#f5a623";
  ctx.fillRect(0, 0, width, height);
  
  drawWatermark(ctx, width, height, footerHeight, "#fffaf0", true);
}

function drawLavenderStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#b39ddb";
  ctx.fillRect(0, 0, width, height);
  
  drawWatermark(ctx, width, height, footerHeight, "#fffaf0", true);
}

function drawDiagonalStripesStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  // Draw diagonal stripes on frame borders
  ctx.save();
  ctx.strokeStyle = "rgba(200, 180, 160, 0.3)";
  ctx.lineWidth = 2;
  
  const stripeSpacing = 8;
  
  // Top border stripes
  for (let i = -height; i < width + height; i += stripeSpacing * 2) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + stripeSpacing, 0);
    ctx.lineTo(i + stripeSpacing + height, height);
    ctx.lineTo(i + height, height);
    ctx.closePath();
    ctx.stroke();
  }
  
  ctx.restore();
  
  drawWatermark(ctx, width, height, footerHeight, "#4a445e", true);
}

function drawDotsStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  // Draw polka dots on frame borders
  ctx.fillStyle = "rgba(200, 180, 160, 0.4)";
  const dotSize = 3;
  const dotSpacing = 12;
  
  // Top border dots
  for (let x = framePadding; x < width - framePadding; x += dotSpacing) {
    ctx.beginPath();
    ctx.arc(x, framePadding / 2, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Bottom border dots
  for (let x = framePadding; x < width - framePadding; x += dotSpacing) {
    ctx.beginPath();
    ctx.arc(x, height - footerHeight / 2, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Side border dots
  for (let y = framePadding; y < height - footerHeight; y += dotSpacing) {
    ctx.beginPath();
    ctx.arc(framePadding / 2, y, dotSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width - framePadding / 2, y, dotSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawWatermark(ctx, width, height, footerHeight, "#4a445e", true);
}

function drawHeartsStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  // Draw small hearts on bottom border
  ctx.fillStyle = "rgba(255, 182, 193, 0.6)";
  
  function drawHeart(x: number, y: number, size: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.beginPath();
    ctx.moveTo(0, -0.3);
    ctx.bezierCurveTo(-0.5, -0.8, -1.5, -0.8, -1.5, -0.3);
    ctx.bezierCurveTo(-1.5, 0.1, -1, 0.5, 0, 1);
    ctx.bezierCurveTo(1, 0.5, 1.5, 0.1, 1.5, -0.3);
    ctx.bezierCurveTo(1.5, -0.8, 0.5, -0.8, 0, -0.3);
    ctx.fill();
    ctx.restore();
  }
  
  const heartSize = 6;
  const heartSpacing = 25;
  const heartY = height - footerHeight / 2;
  
  for (let x = framePadding + heartSpacing; x < width - framePadding; x += heartSpacing) {
    drawHeart(x, heartY, heartSize);
  }
  
  drawWatermark(ctx, width, height, footerHeight, "#4a445e", true);
}

function drawPastelGradientStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#ffb3ba");
  gradient.addColorStop(0.5, "#bae1ff");
  gradient.addColorStop(1, "#ffffba");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  drawWatermark(ctx, width, height, footerHeight, "#4a445e", true);
}

export const FRAME_REGISTRY: Record<PhotoFrameId, FrameDefinition> = {
  "classic-cream": {
    id: "classic-cream",
    name: "Classic",
    watermarkColor: "#4a445e",
    draw: drawClassicCream,
  },
  "dusty-pink": {
    id: "dusty-pink",
    name: "Dusty Pink",
    watermarkColor: "#fffaf0",
    draw: drawDustyPink,
  },
  teal: {
    id: "teal",
    name: "Teal",
    watermarkColor: "#fffaf0",
    draw: drawTeal,
  },
  amber: {
    id: "amber",
    name: "Amber",
    watermarkColor: "#fffaf0",
    draw: drawAmber,
  },
  lavender: {
    id: "lavender",
    name: "Lavender",
    watermarkColor: "#fffaf0",
    draw: drawLavender,
  },
  "diagonal-stripes": {
    id: "diagonal-stripes",
    name: "Stripes",
    watermarkColor: "#4a445e",
    draw: drawDiagonalStripes,
  },
  dots: {
    id: "dots",
    name: "Dots",
    watermarkColor: "#4a445e",
    draw: drawDots,
  },
  hearts: {
    id: "hearts",
    name: "Hearts",
    watermarkColor: "#4a445e",
    draw: drawHearts,
  },
  "pastel-gradient": {
    id: "pastel-gradient",
    name: "Pastel",
    watermarkColor: "#4a445e",
    draw: drawPastelGradient,
  },
};

export const STRIP_FRAME_REGISTRY: Record<PhotoFrameId, FrameDefinition> = {
  "classic-cream": {
    id: "classic-cream",
    name: "Classic",
    watermarkColor: "#4a445e",
    draw: drawClassicCreamStrip,
  },
  "dusty-pink": {
    id: "dusty-pink",
    name: "Dusty Pink",
    watermarkColor: "#fffaf0",
    draw: drawDustyPinkStrip,
  },
  teal: {
    id: "teal",
    name: "Teal",
    watermarkColor: "#fffaf0",
    draw: drawTealStrip,
  },
  amber: {
    id: "amber",
    name: "Amber",
    watermarkColor: "#fffaf0",
    draw: drawAmberStrip,
  },
  lavender: {
    id: "lavender",
    name: "Lavender",
    watermarkColor: "#fffaf0",
    draw: drawLavenderStrip,
  },
  "diagonal-stripes": {
    id: "diagonal-stripes",
    name: "Stripes",
    watermarkColor: "#4a445e",
    draw: drawDiagonalStripesStrip,
  },
  dots: {
    id: "dots",
    name: "Dots",
    watermarkColor: "#4a445e",
    draw: drawDotsStrip,
  },
  hearts: {
    id: "hearts",
    name: "Hearts",
    watermarkColor: "#4a445e",
    draw: drawHeartsStrip,
  },
  "pastel-gradient": {
    id: "pastel-gradient",
    name: "Pastel",
    watermarkColor: "#4a445e",
    draw: drawPastelGradientStrip,
  },
};

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frameId: PhotoFrameId,
  isStrip: boolean = false
): void {
  const registry = isStrip ? STRIP_FRAME_REGISTRY : FRAME_REGISTRY;
  const frame = registry[frameId];
  if (!frame) {
    // Fallback to classic cream if frame not found
    const fallbackFrame = registry["classic-cream"];
    fallbackFrame.draw(ctx, width, height);
    return;
  }
  frame.draw(ctx, width, height);
}

export function getAllFrames(): FrameDefinition[] {
  return Object.values(FRAME_REGISTRY);
}

export function getDefaultFrame(): PhotoFrameId {
  return "classic-cream";
}
