import type { FrameDefinition, PhotoFrameId } from "@/features/photobooth/types/frame.types";
import {
  drawMottledTexture,
  drawGrainTexture,
  drawPolkaDotPattern,
  drawTapeElement,
  drawLeafyEmbellishment,
  drawPatternedBorder,
  type TextureOptions,
  type TapeOptions,
  type PolkaDotOptions,
  type LeafyOptions,
  type BorderPatternOptions,
} from "@/features/photobooth/services/frame-drawing-utils";
import { getCurrentWatermarkConfig, autoInitializeWatermark } from "./watermark-config";

export interface WatermarkConfig {
  type: 'text' | 'image';
  content?: string; // For text watermarks
  imageUrl?: string; // For image watermarks
  fontSize?: number; // Custom font size override
  scale?: number; // Scale factor for image watermarks
  opacity?: number; // Opacity override
}

// Custom watermark cache for images
const watermarkImageCache = new Map<string, HTMLImageElement>();

async function loadWatermarkImage(imageUrl: string): Promise<HTMLImageElement> {
  if (watermarkImageCache.has(imageUrl)) {
    return watermarkImageCache.get(imageUrl)!;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      watermarkImageCache.set(imageUrl, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  bottomPadding: number,
  color: string,
  isStrip: boolean = false,
  config?: WatermarkConfig
): Promise<void> {
  const watermarkConfig: WatermarkConfig = config || {
    type: 'text',
    content: 'FLASHFRAME'
  };

  const watermarkY = canvasHeight - bottomPadding / 2;
  
  // Set common properties
  ctx.globalAlpha = watermarkConfig.opacity || 1;
  
  if (watermarkConfig.type === 'image' && watermarkConfig.imageUrl) {
    // Draw image watermark
    try {
      const img = await loadWatermarkImage(watermarkConfig.imageUrl);
      const scale = watermarkConfig.scale || 0.3; // Default 30% of canvas width
      const watermarkWidth = canvasWidth * scale;
      const watermarkHeight = (img.height / img.width) * watermarkWidth;
      
      const x = (canvasWidth - watermarkWidth) / 2;
      const y = watermarkY - watermarkHeight / 2;
      
      // Add shadow for better visibility
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.drawImage(img, x, y, watermarkWidth, watermarkHeight);
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } catch (error) {
      console.warn('Failed to load watermark image, falling back to text:', error);
      // Fallback to text watermark
      watermarkConfig.type = 'text';
      watermarkConfig.content = 'FLASHFRAME';
      return drawWatermark(ctx, canvasWidth, canvasHeight, bottomPadding, color, isStrip, watermarkConfig);
    }
  } else {
    // Draw text watermark
    const fontSize = watermarkConfig.fontSize || (isStrip
      ? Math.max(72, Math.floor(canvasWidth * 0.18))
      : Math.max(96, Math.floor(canvasWidth * 0.22)));
    
    ctx.fillStyle = color;
    ctx.font = `900 ${fontSize}px var(--font-geist-sans), sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Add shadow for better visibility
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(watermarkConfig.content || 'FLASHFRAME', canvasWidth / 2, watermarkY);
    
    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }
  
  // Reset global alpha
  ctx.globalAlpha = 1;
}

// Enhanced synchronous version with custom watermark support
function drawWatermarkSync(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  bottomPadding: number,
  color: string,
  isStrip: boolean = false
): void {
  const watermarkConfig = getCurrentWatermarkConfig();
  const watermarkY = canvasHeight - bottomPadding / 2;
  
  // Set common properties
  ctx.globalAlpha = watermarkConfig.opacity || 1;
  
  if (watermarkConfig.type === 'image' && watermarkConfig.imageUrl) {
    // Try to draw image watermark synchronously
    const cachedImg = watermarkImageCache.get(watermarkConfig.imageUrl);
    if (cachedImg && cachedImg.complete) {
      // Image is loaded and ready
      const scale = watermarkConfig.scale || 0.3;
      const watermarkWidth = canvasWidth * scale;
      const watermarkHeight = (cachedImg.height / cachedImg.width) * watermarkWidth;
      
      const x = (canvasWidth - watermarkWidth) / 2;
      const y = watermarkY - watermarkHeight / 2;
      
      // Add shadow for better visibility
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.drawImage(cachedImg, x, y, watermarkWidth, watermarkHeight);
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      // Image not loaded yet, preload it for next time and fall back to text
      if (!cachedImg) {
        const img = new Image();
        img.onload = () => {
          watermarkImageCache.set(watermarkConfig.imageUrl!, img);
        };
        img.src = watermarkConfig.imageUrl;
      }
      
      // Fallback to text watermark
      drawTextWatermark(ctx, canvasWidth, canvasHeight, bottomPadding, color, isStrip, watermarkConfig);
    }
  } else {
    // Draw text watermark
    drawTextWatermark(ctx, canvasWidth, canvasHeight, bottomPadding, color, isStrip, watermarkConfig);
  }
  
  // Reset global alpha
  ctx.globalAlpha = 1;
}

function drawTextWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  bottomPadding: number,
  color: string,
  isStrip: boolean,
  config: WatermarkConfig
): void {
  const fontSize = config.fontSize || (isStrip
    ? Math.max(72, Math.floor(canvasWidth * 0.18))
    : Math.max(96, Math.floor(canvasWidth * 0.22)));
  
  ctx.fillStyle = color;
  ctx.font = `900 ${fontSize}px var(--font-geist-sans), sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Add shadow for better visibility
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  const watermarkY = canvasHeight - bottomPadding / 2;
  ctx.fillText(config.content || 'FLASHFRAME', canvasWidth / 2, watermarkY);
  
  // Reset shadow
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
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
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#4a445e");
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
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#fffaf0");
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
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#fffaf0");
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
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#fffaf0");
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
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#fffaf0");
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
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#4a445e");
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
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#4a445e");
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
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#4a445e");
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
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#4a445e");
}

// Strip-specific frame drawing functions
function drawClassicCreamStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, width, height);
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#4a445e", true);
}

function drawDustyPinkStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#e8a0b0";
  ctx.fillRect(0, 0, width, height);
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#fffaf0", true);
}

function drawTealStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#5cb8b2";
  ctx.fillRect(0, 0, width, height);
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#fffaf0", true);
}

function drawAmberStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#f5a623";
  ctx.fillRect(0, 0, width, height);
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#fffaf0", true);
}

function drawLavenderStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  ctx.fillStyle = "#b39ddb";
  ctx.fillRect(0, 0, width, height);
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#fffaf0", true);
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
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#4a445e", true);
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
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#4a445e", true);
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
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#4a445e", true);
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
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#4a445e", true);
}

// Complex Frame Implementations

function drawMottledTeal(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  // Draw mottled texture background
  drawMottledTexture(ctx, 0, 0, width, height, {
    baseColor: "#5cb8b2",
    textureColor: "#4a9d94",
    density: 0.2,
    opacity: 0.4,
  });
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  // Add photo area shadow
  ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  // Add yellow tape element on top-right
  drawTapeElement(ctx, {
    x: width - 80,
    y: 15,
    width: 60,
    height: 25,
    color: "#f5d547",
    angle: -0.15,
    opacity: 0.9,
  });
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#fffaf0");
}

function drawTexturedPurple(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  // Draw fine grain texture background
  drawGrainTexture(ctx, 0, 0, width, height, {
    baseColor: "#8b5cf6",
    textureColor: "#6d28d9",
    density: 0.8,
    opacity: 0.15,
  });
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  // Add subtle photo area shadow
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  // Add dark purple tape on top-right
  drawTapeElement(ctx, {
    x: width - 75,
    y: 20,
    width: 55,
    height: 20,
    color: "#6d28d9",
    angle: -0.1,
    opacity: 0.85,
  });
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#fffaf0");
}

function drawCoralPolka(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  // Draw coral background
  ctx.fillStyle = "#fb7185";
  ctx.fillRect(0, 0, width, height);
  
  // Add polka dot pattern
  drawPolkaDotPattern(ctx, 0, 0, width, height, {
    dotColor: "rgba(255, 255, 255, 0.6)",
    spacing: 20,
    size: 8,
    opacity: 0.7,
  });
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  // Add photo area shadow
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  // Add blue tape on top-left
  drawTapeElement(ctx, {
    x: 20,
    y: 15,
    width: 55,
    height: 22,
    color: "#3b82f6",
    angle: 0.12,
    opacity: 0.9,
  });
  
  // Add yellow leafy embellishment on bottom-right
  drawLeafyEmbellishment(ctx, {
    x: width - 60,
    y: height - bottomPadding + 20,
    size: 25,
    color: "#f5d547",
    density: 4,
  });
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#fffaf0");
}

function drawBlueHearts(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 24;
  const bottomPadding = 100;
  
  // Draw blue background
  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(0, 0, width, height);
  
  const photoWidth = width - framePadding * 2;
  const photoHeight = height - framePadding - bottomPadding;
  
  // Add photo area shadow
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  ctx.strokeRect(framePadding, framePadding, photoWidth, photoHeight);
  
  // Add dark blue tape on top-left
  drawTapeElement(ctx, {
    x: 25,
    y: 18,
    width: 50,
    height: 20,
    color: "#1e40af",
    angle: 0.08,
    opacity: 0.9,
  });
  
  // Add heart pattern along bottom edge
  drawPatternedBorder(ctx, framePadding, height - bottomPadding + 10, width - framePadding, height - bottomPadding + 10, {
    shape: 'heart',
    size: 12,
    spacing: 18,
    color: "rgba(255, 255, 255, 0.7)",
    opacity: 0.8,
  });
  
  drawWatermarkSync(ctx, width, height, bottomPadding, "#fffaf0");
}

// Strip versions of complex frames
function drawMottledTealStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  // Draw mottled texture background
  drawMottledTexture(ctx, 0, 0, width, height, {
    baseColor: "#5cb8b2",
    textureColor: "#4a9d94",
    density: 0.2,
    opacity: 0.4,
  });
  
  // Add yellow tape element on top-right
  drawTapeElement(ctx, {
    x: width - 60,
    y: 12,
    width: 45,
    height: 18,
    color: "#f5d547",
    angle: -0.15,
    opacity: 0.9,
  });
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#fffaf0", true);
}

function drawTexturedPurpleStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  // Draw fine grain texture background
  drawGrainTexture(ctx, 0, 0, width, height, {
    baseColor: "#8b5cf6",
    textureColor: "#6d28d9",
    density: 0.8,
    opacity: 0.15,
  });
  
  // Add dark purple tape on top-right
  drawTapeElement(ctx, {
    x: width - 55,
    y: 15,
    width: 40,
    height: 15,
    color: "#6d28d9",
    angle: -0.1,
    opacity: 0.85,
  });
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#fffaf0", true);
}

function drawCoralPolkaStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  // Draw coral background
  ctx.fillStyle = "#fb7185";
  ctx.fillRect(0, 0, width, height);
  
  // Add polka dot pattern
  drawPolkaDotPattern(ctx, 0, 0, width, height, {
    dotColor: "rgba(255, 255, 255, 0.6)",
    spacing: 16,
    size: 6,
    opacity: 0.7,
  });
  
  // Add blue tape on top-left
  drawTapeElement(ctx, {
    x: 15,
    y: 12,
    width: 40,
    height: 16,
    color: "#3b82f6",
    angle: 0.12,
    opacity: 0.9,
  });
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#fffaf0", true);
}

function drawBlueHeartsStrip(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const framePadding = 22;
  const footerHeight = 84;
  
  // Draw blue background
  ctx.fillStyle = "#3b82f6";
  ctx.fillRect(0, 0, width, height);
  
  // Add dark blue tape on top-left
  drawTapeElement(ctx, {
    x: 18,
    y: 14,
    width: 35,
    height: 14,
    color: "#1e40af",
    angle: 0.08,
    opacity: 0.9,
  });
  
  // Add heart pattern along bottom edge
  drawPatternedBorder(ctx, framePadding, height - footerHeight + 8, width - framePadding, height - footerHeight + 8, {
    shape: 'heart',
    size: 8,
    spacing: 12,
    color: "rgba(255, 255, 255, 0.7)",
    opacity: 0.8,
  });
  
  drawWatermarkSync(ctx, width, height, footerHeight, "#fffaf0", true);
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
  "mottled-teal": {
    id: "mottled-teal",
    name: "Mottled Teal",
    watermarkColor: "#fffaf0",
    draw: drawMottledTeal,
  },
  "textured-purple": {
    id: "textured-purple",
    name: "Textured Purple",
    watermarkColor: "#fffaf0",
    draw: drawTexturedPurple,
  },
  "coral-polka": {
    id: "coral-polka",
    name: "Coral Polka",
    watermarkColor: "#fffaf0",
    draw: drawCoralPolka,
  },
  "blue-hearts": {
    id: "blue-hearts",
    name: "Blue Hearts",
    watermarkColor: "#fffaf0",
    draw: drawBlueHearts,
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
  "mottled-teal": {
    id: "mottled-teal",
    name: "Mottled Teal",
    watermarkColor: "#fffaf0",
    draw: drawMottledTealStrip,
  },
  "textured-purple": {
    id: "textured-purple",
    name: "Textured Purple",
    watermarkColor: "#fffaf0",
    draw: drawTexturedPurpleStrip,
  },
  "coral-polka": {
    id: "coral-polka",
    name: "Coral Polka",
    watermarkColor: "#fffaf0",
    draw: drawCoralPolkaStrip,
  },
  "blue-hearts": {
    id: "blue-hearts",
    name: "Blue Hearts",
    watermarkColor: "#fffaf0",
    draw: drawBlueHeartsStrip,
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
    throw new Error(`Frame not found: ${frameId}`);
  }
  
  frame.draw(ctx, width, height);
}

export function getAllFrames(): FrameDefinition[] {
  return Object.values(FRAME_REGISTRY);
}

export function getDefaultFrame(): PhotoFrameId {
  return "classic-cream";
}

// Auto-initialize custom watermark on module load
autoInitializeWatermark();
