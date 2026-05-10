/**
 * Frame Worker
 * Handles frame rendering in background thread
 */

// Worker message types
interface FrameMessage {
  type: 'render-frame';
  data: {
    frameId: string;
    width: number;
    height: number;
    isStrip: boolean;
  };
}

interface ProgressMessage {
  type: 'progress';
  data: {
    progress: number;
    stage: string;
  };
}

interface ResultMessage {
  type: 'result';
  data: {
    success: boolean;
    result?: string; // Data URL
    error?: string;
  };
}

type WorkerMessage = FrameMessage | ProgressMessage | ResultMessage;

/**
 * Draw classic cream frame
 */
function drawClassicCream(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
}

/**
 * Draw dusty pink frame
 */
function drawDustyPink(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#e8a0b0";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
}

/**
 * Draw teal frame
 */
function drawTeal(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#5cb8b2";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
}

/**
 * Draw amber frame
 */
function drawAmber(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#f5a623";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
}

/**
 * Draw lavender frame
 */
function drawLavender(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#b39ddb";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
}

/**
 * Draw diagonal stripes frame
 */
function drawDiagonalStripes(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  // Draw diagonal stripes
  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.05)";
  ctx.lineWidth = 2;
  
  for (let i = -height; i < width; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + height, height);
    ctx.stroke();
  }
  
  ctx.restore();
}

/**
 * Draw dots frame
 */
function drawDots(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  // Draw decorative dots
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  const dotSize = 2;
  const dotSpacing = 15;
  
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
}

/**
 * Draw hearts frame
 */
function drawHearts(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  // Draw decorative hearts
  ctx.fillStyle = "rgba(233, 30, 99, 0.2)";
  
  function drawHeart(x: number, y: number, size: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.beginPath();
    ctx.moveTo(0, -0.5);
    ctx.bezierCurveTo(-0.5, -1, -1, -0.5, -1, 0);
    ctx.bezierCurveTo(-1, 0.5, -0.5, 1, 0, 1.5);
    ctx.bezierCurveTo(0.5, 1, 1, 0.5, 1, 0);
    ctx.bezierCurveTo(1, -0.5, 0.5, -1, 0, -0.5);
    ctx.fill();
    ctx.restore();
  }
  
  const heartSize = 8;
  const heartSpacing = 30;
  const heartY = height - bottomPadding / 2;
  
  for (let x = framePadding + heartSpacing; x < width - framePadding; x += heartSpacing) {
    drawHeart(x, heartY, heartSize);
  }
}

/**
 * Draw pastel gradient frame
 */
function drawPastelGradient(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
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
}

/**
 * Strip frame rendering functions
 */
function drawClassicCreamStrip(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
}

function drawDustyPinkStrip(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = "#e8a0b0";
  ctx.fillRect(0, 0, width, height);
}

function drawTealStrip(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = "#5cb8b2";
  ctx.fillRect(0, 0, width, height);
}

function drawAmberStrip(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = "#f5a623";
  ctx.fillRect(0, 0, width, height);
}

function drawLavenderStrip(ctx: OffscreenCanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = "#b39ddb";
  ctx.fillRect(0, 0, width, height);
}

/**
 * Frame rendering dispatcher
 */
function renderFrame(frameId: string, width: number, height: number, isStrip: boolean): OffscreenCanvas {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  
  if (!ctx) {
    throw new Error('Failed to get 2D context');
  }
  
  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Dispatch to appropriate frame function
  switch (frameId) {
    case 'classic-cream':
      if (isStrip) {
        drawClassicCreamStrip(ctx, width, height);
      } else {
        drawClassicCream(ctx, width, height);
      }
      break;
    case 'dusty-pink':
      if (isStrip) {
        drawDustyPinkStrip(ctx, width, height);
      } else {
        drawDustyPink(ctx, width, height);
      }
      break;
    case 'teal':
      if (isStrip) {
        drawTealStrip(ctx, width, height);
      } else {
        drawTeal(ctx, width, height);
      }
      break;
    case 'amber':
      if (isStrip) {
        drawAmberStrip(ctx, width, height);
      } else {
        drawAmber(ctx, width, height);
      }
      break;
    case 'lavender':
      if (isStrip) {
        drawLavenderStrip(ctx, width, height);
      } else {
        drawLavender(ctx, width, height);
      }
      break;
    case 'diagonal-stripes':
      if (isStrip) {
        // Simplified strip version
        ctx.fillStyle = "#fffaf0";
        ctx.fillRect(0, 0, width, height);
      } else {
        drawDiagonalStripes(ctx, width, height);
      }
      break;
    case 'dots':
      if (isStrip) {
        // Simplified strip version
        ctx.fillStyle = "#fffaf0";
        ctx.fillRect(0, 0, width, height);
      } else {
        drawDots(ctx, width, height);
      }
      break;
    case 'hearts':
      if (isStrip) {
        // Simplified strip version
        ctx.fillStyle = "#fffaf0";
        ctx.fillRect(0, 0, width, height);
      } else {
        drawHearts(ctx, width, height);
      }
      break;
    case 'pastel-gradient':
      if (isStrip) {
        // Simplified strip version
        ctx.fillStyle = "#fffaf0";
        ctx.fillRect(0, 0, width, height);
      } else {
        drawPastelGradient(ctx, width, height);
      }
      break;
    default:
      // Default frame
      if (isStrip) {
        drawClassicCreamStrip(ctx, width, height);
      } else {
        drawClassicCream(ctx, width, height);
      }
      break;
  }
  
  return canvas;
}

/**
 * Worker message handler
 */
self.addEventListener('message', async (e: MessageEvent<WorkerMessage>) => {
  const { type, data } = e.data;
  
  try {
    if (type === 'render-frame') {
      const { frameId, width, height, isStrip } = data;
      
      self.postMessage({
        type: 'progress',
        data: { progress: 0.2, stage: 'rendering' }
      } as ProgressMessage);
      
      const frameCanvas = renderFrame(frameId, width, height, isStrip);
      
      self.postMessage({
        type: 'progress',
        data: { progress: 0.8, stage: 'finalizing' }
      } as ProgressMessage);
      
      // Convert to blob and return URL
      const blob = await frameCanvas.convertToBlob({ type: 'image/png' });
      const result = URL.createObjectURL(blob);
      
      self.postMessage({
        type: 'result',
        data: { success: true, result }
      } as ResultMessage);
    }
  } catch (error) {
    self.postMessage({
      type: 'result',
      data: { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    } as ResultMessage);
  }
});

// Export for TypeScript
export {};
