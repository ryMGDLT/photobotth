/**
 * Seeded pseudo-random number generator (mulberry32).
 * Produces deterministic values so frame textures render identically
 * across calls — ensuring cache hits are valid.
 */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface TextureOptions {
  baseColor: string;
  textureColor?: string;
  density?: number;
  opacity?: number;
}

export interface TapeOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  angle?: number;
  opacity?: number;
}

export interface PolkaDotOptions {
  dotColor: string;
  spacing: number;
  size: number;
  opacity?: number;
}

export interface LeafyOptions {
  x: number;
  y: number;
  size: number;
  color: string;
  density?: number;
}

export interface BorderPatternOptions {
  shape: 'heart' | 'scallop' | 'circle';
  size: number;
  spacing: number;
  color: string;
  opacity?: number;
}

/**
 * Creates a mottled/speckled texture effect
 */
export function drawMottledTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: TextureOptions
): void {
  const { baseColor, textureColor = '#000000', density = 0.15, opacity = 0.3 } = options;
  
  // Fill base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, width, height);
  
  // Create mottled effect with random speckles
  ctx.save();
  ctx.globalAlpha = opacity;
  
  const speckleCount = Math.floor(width * height * density / 1000);
  const rng = seededRng(width * 31 + height);
  
  for (let i = 0; i < speckleCount; i++) {
    const speckleX = x + rng() * width;
    const speckleY = y + rng() * height;
    const speckleSize = rng() * 3 + 1;
    
    ctx.fillStyle = textureColor;
    ctx.beginPath();
    ctx.arc(speckleX, speckleY, speckleSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

/**
 * Creates a fine grain texture effect
 */
export function drawGrainTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: TextureOptions
): void {
  const { baseColor, textureColor = '#000000', density = 0.8, opacity = 0.1 } = options;
  
  // Fill base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(x, y, width, height);
  
  // Create fine grain effect
  ctx.save();
  ctx.globalAlpha = opacity;
  
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  
  const rng = seededRng(width * 17 + height * 31);
  for (let i = 0; i < data.length; i += 4) {
    if (rng() < density) {
      const offset = Math.floor(rng() * 20 - 10);
      data[i] = Math.min(255, Math.max(0, data[i] + offset));     // Red
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + offset)); // Green
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + offset)); // Blue
    }
    data[i + 3] = 255; // Alpha
  }
  
  ctx.putImageData(imageData, x, y);
  ctx.restore();
}

/**
 * Creates a polka dot pattern
 */
export function drawPolkaDotPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  options: PolkaDotOptions
): void {
  const { dotColor, spacing, size, opacity = 1 } = options;
  
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = dotColor;
  
  for (let dotY = y; dotY < y + height; dotY += spacing) {
    for (let dotX = x; dotX < x + width; dotX += spacing) {
      ctx.beginPath();
      ctx.arc(dotX, dotY, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.restore();
}

/**
 * Draws a tape/sticky note element
 */
export function drawTapeElement(
  ctx: CanvasRenderingContext2D,
  options: TapeOptions
): void {
  const { x, y, width, height, color, angle = -0.1, opacity = 0.9 } = options;
  
  ctx.save();
  
  // Apply rotation
  ctx.translate(x + width / 2, y + height / 2);
  ctx.rotate(angle);
  ctx.translate(-(x + width / 2), -(y + height / 2));
  
  // Draw tape with subtle shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  ctx.fillRect(x, y, width, height);
  
  // Add subtle texture to tape
  ctx.globalAlpha = opacity * 0.3;
  const tapeRng = seededRng(x * 7 + y * 13);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  for (let i = 0; i < 5; i++) {
    const lineX = x + tapeRng() * width;
    const lineY = y + tapeRng() * height;
    ctx.fillRect(lineX, lineY, 1, 1);
  }
  
  ctx.restore();
}

/**
 * Draws a simple leafy/floral embellishment
 */
export function drawLeafyEmbellishment(
  ctx: CanvasRenderingContext2D,
  options: LeafyOptions
): void {
  const { x, y, size, color, density = 3 } = options;
  
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  
  const leafRng = seededRng(x * 11 + y * 23 + size);
  // Draw multiple leaves in a cluster
  for (let i = 0; i < density; i++) {
    const leafX = x + (leafRng() - 0.5) * size;
    const leafY = y + (leafRng() - 0.5) * size;
    const leafSize = size * (0.3 + leafRng() * 0.4);
    const rotation = leafRng() * Math.PI * 2;
    
    ctx.save();
    ctx.translate(leafX, leafY);
    ctx.rotate(rotation);
    
    // Draw simple leaf shape
    ctx.beginPath();
    ctx.moveTo(0, -leafSize);
    ctx.quadraticCurveTo(leafSize * 0.5, -leafSize * 0.5, leafSize * 0.3, 0);
    ctx.quadraticCurveTo(leafSize * 0.1, leafSize * 0.3, 0, leafSize * 0.5);
    ctx.quadraticCurveTo(-leafSize * 0.1, leafSize * 0.3, -leafSize * 0.3, 0);
    ctx.quadraticCurveTo(-leafSize * 0.5, -leafSize * 0.5, 0, -leafSize);
    ctx.fill();
    
    ctx.restore();
  }
  
  ctx.restore();
}

/**
 * Draws a heart shape
 */
function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
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

/**
 * Draws a scallop shape
 */
function drawScallop(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI, true);
  ctx.fill();
}

/**
 * Creates a patterned border along a path
 */
export function drawPatternedBorder(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  options: BorderPatternOptions
): void {
  const { shape, size, spacing, color, opacity = 1 } = options;
  
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = opacity;
  
  const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
  const steps = Math.floor(distance / spacing);
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = startX + (endX - startX) * t;
    const y = startY + (endY - startY) * t;
    
    switch (shape) {
      case 'heart':
        drawHeart(ctx, x, y, size);
        break;
      case 'scallop':
        drawScallop(ctx, x, y, size);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }
  
  ctx.restore();
}

/**
 * Creates a gradient texture overlay
 */
export function drawGradientTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: string[],
  direction: 'horizontal' | 'vertical' | 'diagonal' = 'horizontal'
): void {
  ctx.save();
  
  let gradient: CanvasGradient;
  
  switch (direction) {
    case 'vertical':
      gradient = ctx.createLinearGradient(x, y, x, y + height);
      break;
    case 'diagonal':
      gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      break;
    default: // horizontal
      gradient = ctx.createLinearGradient(x, y, x + width, y);
  }
  
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);
  
  ctx.restore();
}
