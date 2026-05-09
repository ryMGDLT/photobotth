import type { CameraFilterPreset, CameraEffectPreset } from "@/features/photobooth/types/photobooth.types";

export interface CameraFilterDefinition {
  id: CameraFilterPreset;
  label: string;
  cssFilter: string;
}

export interface CameraEffectDefinition {
  id: CameraEffectPreset;
  label: string;
  cssEffect: string;
}

export const cameraFilters: CameraFilterDefinition[] = [
  {
    id: "natural",
    label: "Natural",
    cssFilter: "none",
  },
  {
    id: "golden-hour",
    label: "Golden Hour",
    cssFilter:
      "brightness(112%) contrast(104%) saturate(132%) sepia(16%) hue-rotate(-10deg)",
  },
  {
    id: "glam",
    label: "Soft Glam",
    cssFilter:
      "brightness(108%) contrast(92%) saturate(118%) sepia(8%) blur(0.2px)",
  },
  {
    id: "cyber-pop",
    label: "Cyber Pop",
    cssFilter:
      "brightness(112%) contrast(124%) saturate(152%) hue-rotate(-18deg)",
  },
  {
    id: "vhs-night",
    label: "VHS Night",
    cssFilter:
      "brightness(96%) contrast(126%) saturate(88%) sepia(22%) hue-rotate(-22deg)",
  },
  {
    id: "vhs-pro",
    label: "VHS Pro (WebGL)",
    cssFilter: "none", // Handled by WebGL renderer
  },
  {
    id: "soft-blur",
    label: "Soft Blur",
    cssFilter:
      "brightness(106%) contrast(94%) saturate(108%) blur(0.45px)",
  },
  {
    id: "sepia",
    label: "Sepia",
    cssFilter:
      "brightness(108%) contrast(98%) saturate(68%) sepia(78%)",
  },
  {
    id: "vintage",
    label: "Vintage",
    cssFilter:
      "brightness(104%) contrast(92%) saturate(82%) sepia(32%) hue-rotate(-5deg)",
  },
  {
    id: "bw",
    label: "B&W Film",
    cssFilter:
      "brightness(106%) contrast(118%) saturate(0%)",
  },
  {
    id: "70s",
    label: "70s Warm",
    cssFilter:
      "brightness(102%) contrast(90%) saturate(92%) sepia(28%) hue-rotate(-12deg)",
  },
  {
    id: "80s",
    label: "80s Neon",
    cssFilter:
      "brightness(114%) contrast(118%) saturate(168%) hue-rotate(-8deg)",
  },
  {
    id: "polaroid",
    label: "Polaroid",
    cssFilter:
      "brightness(108%) contrast(96%) saturate(88%) sepia(18%) hue-rotate(-3deg)",
  },
  {
    id: "cool",
    label: "Cool",
    cssFilter:
      "brightness(104%) contrast(102%) saturate(92%) hue-rotate(15deg)",
  },
  {
    id: "warm",
    label: "Warm",
    cssFilter:
      "brightness(106%) contrast(100%) saturate(110%) sepia(12%) hue-rotate(-8deg)",
  },
  {
    id: "dramatic",
    label: "Dramatic",
    cssFilter:
      "brightness(94%) contrast(132%) saturate(108%)",
  },
  {
    id: "dreamy",
    label: "Dreamy",
    cssFilter:
      "brightness(112%) contrast(88%) saturate(118%) blur(0.3px)",
  },
  {
    id: "fade",
    label: "Fade",
    cssFilter:
      "brightness(116%) contrast(86%) saturate(76%)",
  },
  {
    id: "matte",
    label: "Matte",
    cssFilter:
      "brightness(108%) contrast(92%) saturate(94%)",
  },
  {
    id: "vivid",
    label: "Vivid",
    cssFilter:
      "brightness(108%) contrast(112%) saturate(148%)",
  },
  {
    id: "muted",
    label: "Muted",
    cssFilter:
      "brightness(104%) contrast(94%) saturate(68%)",
  },
  {
    id: "cinema",
    label: "Cinema",
    cssFilter:
      "brightness(98%) contrast(118%) saturate(92%) hue-rotate(-5deg)",
  },
  {
    id: "sunset",
    label: "Sunset",
    cssFilter:
      "brightness(108%) contrast(104%) saturate(138%) sepia(20%) hue-rotate(-15deg)",
  },
  {
    id: "ocean",
    label: "Ocean",
    cssFilter:
      "brightness(104%) contrast(102%) saturate(108%) hue-rotate(20deg)",
  },
  {
    id: "forest",
    label: "Forest",
    cssFilter:
      "brightness(102%) contrast(104%) saturate(112%) hue-rotate(-25deg)",
  },
  {
    id: "noir",
    label: "Noir",
    cssFilter:
      "brightness(102%) contrast(124%) saturate(0%)",
  },
  {
    id: "grain",
    label: "Film Grain",
    cssFilter:
      "brightness(106%) contrast(108%) saturate(98%)",
  },
  {
    id: "clarendon",
    label: "Clarendon",
    cssFilter:
      "brightness(118%) contrast(124%) saturate(132%)",
  },
  {
    id: "gingham",
    label: "Gingham",
    cssFilter:
      "brightness(108%) contrast(96%) saturate(82%) sepia(12%)",
  },
  {
    id: "moon",
    label: "Moon",
    cssFilter:
      "brightness(114%) contrast(92%) saturate(0%) grayscale(100%)",
  },
  {
    id: "lark",
    label: "Lark",
    cssFilter:
      "brightness(112%) contrast(98%) saturate(108%) sepia(8%)",
  },
  {
    id: "reyes",
    label: "Reyes",
    cssFilter:
      "brightness(110%) contrast(88%) saturate(82%) sepia(16%)",
  },
  {
    id: "juniper",
    label: "Juno",
    cssFilter:
      "brightness(108%) contrast(118%) saturate(138%) hue-rotate(-5deg)",
  },
  {
    id: "valencia",
    label: "Valencia",
    cssFilter:
      "brightness(108%) contrast(102%) saturate(118%) sepia(12%) hue-rotate(-8deg)",
  },
  {
    id: "xpro",
    label: "X-Pro II",
    cssFilter:
      "brightness(106%) contrast(122%) saturate(142%) sepia(18%)",
  },
  {
    id: "sierra",
    label: "Sierra",
    cssFilter:
      "brightness(114%) contrast(90%) saturate(78%) sepia(14%)",
  },
  {
    id: "willow",
    label: "Willow",
    cssFilter:
      "brightness(108%) contrast(98%) saturate(20%) grayscale(80%)",
  },
  {
    id: "lofi",
    label: "Lo-Fi",
    cssFilter:
      "brightness(102%) contrast(138%) saturate(128%)",
  },
  {
    id: "inkwell",
    label: "Inkwell",
    cssFilter:
      "brightness(108%) contrast(118%) saturate(0%) grayscale(100%)",
  },
  {
    id: "nashville",
    label: "Nashville",
    cssFilter:
      "brightness(110%) contrast(96%) saturate(108%) sepia(22%) hue-rotate(-15deg)",
  },
  {
    id: "stinson",
    label: "Stinson",
    cssFilter:
      "brightness(114%) contrast(92%) saturate(88%) sepia(18%)",
  },
  {
    id: "vesper",
    label: "Vesper",
    cssFilter:
      "brightness(108%) contrast(104%) saturate(112%) sepia(8%) hue-rotate(-10deg)",
  },
  {
    id: "earlybird",
    label: "Earlybird",
    cssFilter:
      "brightness(108%) contrast(98%) saturate(98%) sepia(24%) hue-rotate(-5deg)",
  },
  {
    id: "brannan",
    label: "Brannan",
    cssFilter:
      "brightness(106%) contrast(112%) saturate(88%) sepia(16%)",
  },
  {
    id: "sutro",
    label: "Sutro",
    cssFilter:
      "brightness(96%) contrast(126%) saturate(82%) sepia(20%)",
  },
  {
    id: "toaster",
    label: "Toaster",
    cssFilter:
      "brightness(108%) contrast(118%) saturate(138%) sepia(18%)",
  },
  {
    id: "walden",
    label: "Walden",
    cssFilter:
      "brightness(112%) contrast(96%) saturate(108%) sepia(16%) hue-rotate(-10deg)",
  },
  {
    id: "hefe",
    label: "Hefe",
    cssFilter:
      "brightness(106%) contrast(122%) saturate(128%) sepia(12%)",
  },
  {
    id: "mayfair",
    label: "Mayfair",
    cssFilter:
      "brightness(108%) contrast(104%) saturate(118%) sepia(8%)",
  },
  {
    id: "hudson",
    label: "Hudson",
    cssFilter:
      "brightness(112%) contrast(98%) saturate(92%) hue-rotate(10deg)",
  },
];

export function getCameraFilterCss(filterPreset: CameraFilterPreset): string {
  return (
    cameraFilters.find((filter) => filter.id === filterPreset)?.cssFilter ?? "none"
  );
}

export const cameraEffects: CameraEffectDefinition[] = [
  {
    id: "none",
    label: "No Effect",
    cssEffect: "none",
  },
  {
    id: "vignette",
    label: "Vignette",
    cssEffect: "radial-gradient(circle, transparent 50%, rgba(0,0,0,0.5) 100%)",
  },
  {
    id: "light-leak",
    label: "Light Leak",
    cssEffect: "linear-gradient(135deg, rgba(255,200,100,0.3) 0%, transparent 50%, rgba(255,150,50,0.2) 100%)",
  },
  {
    id: "film-grain",
    label: "Film Grain",
    cssEffect: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.15%22/%3E%3C/svg%3E')",
  },
  {
    id: "bokeh",
    label: "Bokeh",
    cssEffect: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 20%), radial-gradient(circle at 80% 70%, rgba(255,200,150,0.1) 0%, transparent 25%), radial-gradient(circle at 50% 50%, rgba(200,220,255,0.08) 0%, transparent 30%)",
  },
  {
    id: "scratch",
    label: "Film Scratch",
    cssEffect: "repeating-linear-gradient(90deg, transparent 0px, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
  },
  {
    id: "scanlines",
    label: "Scanlines",
    cssEffect: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
  },
  {
    id: "color-splash",
    label: "Color Splash",
    cssEffect: "linear-gradient(45deg, rgba(255,0,100,0.1) 0%, transparent 50%, rgba(0,200,255,0.1) 100%)",
  },
  {
    id: "warm-glow",
    label: "Warm Glow",
    cssEffect: "radial-gradient(circle, rgba(255,200,100,0.2) 0%, transparent 70%)",
  },
  {
    id: "cool-glow",
    label: "Cool Glow",
    cssEffect: "radial-gradient(circle, rgba(100,200,255,0.2) 0%, transparent 70%)",
  },
  {
    id: "retro-border",
    label: "Retro Border",
    cssEffect: "linear-gradient(to right, #7a4328 5px, transparent 5px), linear-gradient(to left, #7a4328 5px, transparent 5px), linear-gradient(to bottom, #7a4328 5px, transparent 5px), linear-gradient(to top, #7a4328 5px, transparent 5px)",
  },
  {
    id: "double-exposure",
    label: "Double Exposure",
    cssEffect: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
  },
  {
    id: "rain",
    label: "Rain",
    cssEffect: "repeating-linear-gradient(180deg, transparent 0px, transparent 10px, rgba(200,220,255,0.05) 10px, rgba(200,220,255,0.05) 12px)",
  },
  {
    id: "snow",
    label: "Snow",
    cssEffect: "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.3) 0%, transparent 3%), radial-gradient(circle at 30% 60%, rgba(255,255,255,0.2) 0%, transparent 2%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.25) 0%, transparent 2.5%), radial-gradient(circle at 90% 70%, rgba(255,255,255,0.2) 0%, transparent 2%)",
  },
  {
    id: "sun-flare",
    label: "Sun Flare",
    cssEffect: "radial-gradient(circle at 80% 20%, rgba(255,220,100,0.4) 0%, transparent 40%)",
  },
  {
    id: "ghost",
    label: "Ghost",
    cssEffect: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)",
  },
  {
    id: "glitch",
    label: "Glitch",
    cssEffect: "linear-gradient(90deg, transparent 0%, rgba(255,0,0,0.1) 33%, transparent 33%, transparent 66%, rgba(0,255,255,0.1) 66%, transparent 100%)",
  },
  {
    id: "chromatic",
    label: "Chromatic",
    cssEffect: "linear-gradient(90deg, rgba(255,0,0,0.05) 0%, transparent 20%, rgba(0,255,0,0.05) 40%, transparent 60%, rgba(0,0,255,0.05) 80%, transparent 100%)",
  },
  {
    id: "film-burn",
    label: "Film Burn",
    cssEffect: "radial-gradient(circle at 50% 50%, rgba(255,200,100,0.4) 0%, transparent 60%)",
  },
  {
    id: "lens-flare",
    label: "Lens Flare",
    cssEffect: "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.3) 0%, transparent 15%), radial-gradient(circle at 30% 70%, rgba(255,220,150,0.2) 0%, transparent 10%)",
  },
  {
    id: "dust",
    label: "Dust",
    cssEffect: "radial-gradient(circle at 10% 20%, rgba(139,119,101,0.15) 0%, transparent 2%), radial-gradient(circle at 80% 80%, rgba(139,119,101,0.12) 0%, transparent 3%), radial-gradient(circle at 50% 50%, rgba(139,119,101,0.1) 0%, transparent 2.5%)",
  },
  {
    id: "split-tone",
    label: "Split Tone",
    cssEffect: "linear-gradient(180deg, rgba(255,100,100,0.15) 0%, transparent 50%, rgba(100,100,255,0.15) 100%)",
  },
  {
    id: "neon-glow",
    label: "Neon Glow",
    cssEffect: "radial-gradient(circle at 50% 50%, rgba(255,0,255,0.2) 0%, transparent 50%)",
  },
  {
    id: "retro-film",
    label: "Retro Film",
    cssEffect: "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 6px), repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 6px)",
  },
  {
    id: "prism",
    label: "Prism",
    cssEffect: "linear-gradient(45deg, rgba(255,0,0,0.1) 0%, transparent 25%, rgba(0,255,0,0.1) 25%, transparent 50%, rgba(0,0,255,0.1) 50%, transparent 75%, rgba(255,255,0,0.1) 75%, transparent 100%)",
  },
  {
    id: "halftone",
    label: "Halftone",
    cssEffect: "radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1.5px), radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1.5px)",
  },
  {
    id: "noise",
    label: "Noise",
    cssEffect: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.1%22/%3E%3C/svg%3E')",
  },
  {
    id: "film-noir",
    label: "Film Noir",
    cssEffect: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)",
  },
  {
    id: "vintage-teal",
    label: "Vintage Teal",
    cssEffect: "linear-gradient(135deg, rgba(0,128,128,0.15) 0%, transparent 50%, rgba(255,165,0,0.15) 100%)",
  },
  {
    id: "disco",
    label: "Disco",
    cssEffect: "conic-gradient(from 0deg, rgba(255,0,0,0.1) 0deg, transparent 60deg, rgba(0,255,0,0.1) 120deg, transparent 180deg, rgba(0,0,255,0.1) 240deg, transparent 300deg, rgba(255,255,0,0.1) 360deg)",
  },
  {
    id: "sparkle",
    label: "Sparkle",
    cssEffect: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4) 0%, transparent 3%), radial-gradient(circle at 70% 20%, rgba(255,255,255,0.3) 0%, transparent 2%), radial-gradient(circle at 40% 70%, rgba(255,255,255,0.35) 0%, transparent 2.5%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.25) 0%, transparent 2%)",
  },
  {
    id: "heart-frame",
    label: "Heart Frame",
    cssEffect: "radial-gradient(circle at 50% 120%, rgba(255,105,180,0.3) 0%, transparent 50%), radial-gradient(circle at 50% -20%, rgba(255,105,180,0.3) 0%, transparent 50%)",
  },
  {
    id: "star-burst",
    label: "Star Burst",
    cssEffect: "conic-gradient(from 0deg, rgba(255,255,0,0.2) 0deg, transparent 30deg, rgba(255,255,0,0.2) 60deg, transparent 90deg, rgba(255,255,0,0.2) 120deg, transparent 150deg, rgba(255,255,0,0.2) 180deg, transparent 210deg, rgba(255,255,0,0.2) 240deg, transparent 270deg, rgba(255,255,0,0.2) 300deg, transparent 330deg)",
  },
  {
    id: "confetti",
    label: "Confetti",
    cssEffect: "radial-gradient(circle at 15% 25%, rgba(255,0,0,0.3) 0%, transparent 4%), radial-gradient(circle at 85% 15%, rgba(0,255,0,0.3) 0%, transparent 3%), radial-gradient(circle at 45% 75%, rgba(0,0,255,0.3) 0%, transparent 3.5%), radial-gradient(circle at 75% 85%, rgba(255,255,0,0.3) 0%, transparent 4%), radial-gradient(circle at 25% 65%, rgba(255,0,255,0.3) 0%, transparent 3%)",
  },
  {
    id: "butterfly",
    label: "Butterfly",
    cssEffect: "radial-gradient(ellipse at 30% 40%, rgba(255,182,193,0.25) 0%, transparent 25%), radial-gradient(ellipse at 70% 40%, rgba(255,182,193,0.25) 0%, transparent 25%)",
  },
  {
    id: "crown",
    label: "Crown",
    cssEffect: "linear-gradient(180deg, rgba(255,215,0,0.3) 0%, transparent 20%)",
  },
  {
    id: "fire",
    label: "Fire",
    cssEffect: "linear-gradient(0deg, rgba(255,100,0,0.4) 0%, transparent 40%)",
  },
  {
    id: "ice",
    label: "Ice",
    cssEffect: "linear-gradient(0deg, rgba(100,200,255,0.3) 0%, transparent 40%)",
  },
  {
    id: "rainbow-border",
    label: "Rainbow Border",
    cssEffect: "linear-gradient(to right, rgba(255,0,0,0.3) 0%, rgba(255,165,0,0.3) 16%, rgba(255,255,0,0.3) 33%, rgba(0,128,0,0.3) 50%, rgba(0,0,255,0.3) 66%, rgba(75,0,130,0.3) 83%, rgba(238,130,238,0.3) 100%)",
  },
  {
    id: "leaves",
    label: "Leaves",
    cssEffect: "radial-gradient(ellipse at 10% 10%, rgba(34,139,34,0.2) 0%, transparent 15%), radial-gradient(ellipse at 90% 20%, rgba(34,139,34,0.2) 0%, transparent 12%), radial-gradient(ellipse at 20% 90%, rgba(34,139,34,0.2) 0%, transparent 14%)",
  },
  {
    id: "bubbles",
    label: "Bubbles",
    cssEffect: "radial-gradient(circle at 25% 35%, rgba(135,206,250,0.2) 0%, transparent 8%), radial-gradient(circle at 75% 25%, rgba(135,206,250,0.2) 0%, transparent 10%), radial-gradient(circle at 50% 70%, rgba(135,206,250,0.2) 0%, transparent 12%), radial-gradient(circle at 20% 80%, rgba(135,206,250,0.2) 0%, transparent 7%)",
  },
  {
    id: "cat-ears",
    label: "Cat Ears",
    cssEffect: "radial-gradient(ellipse at 30% 8%, rgba(30,30,30,0.8) 0%, transparent 15%), radial-gradient(ellipse at 70% 8%, rgba(30,30,30,0.8) 0%, transparent 15%)",
  },
  {
    id: "devil-horns",
    label: "Devil Horns",
    cssEffect: "radial-gradient(ellipse at 25% 5%, rgba(139,0,0,0.9) 0%, transparent 12%), radial-gradient(ellipse at 75% 5%, rgba(139,0,0,0.9) 0%, transparent 12%)",
  },
  {
    id: "angel-halo",
    label: "Angel Halo",
    cssEffect: "radial-gradient(ellipse at 50% 5%, rgba(255,215,0,0.8) 0%, transparent 8%, transparent 12%, rgba(255,215,0,0.8) 12%, transparent 20%)",
  },
  {
    id: "glasses",
    label: "Glasses",
    cssEffect: "radial-gradient(ellipse at 35% 48%, rgba(0,0,0,0.7) 0%, transparent 15%), radial-gradient(ellipse at 65% 48%, rgba(0,0,0,0.7) 0%, transparent 15%), linear-gradient(90deg, transparent 35%, rgba(0,0,0,0.7) 35%, rgba(0,0,0,0.7) 65%, transparent 65%)",
  },
  {
    id: "mustache",
    label: "Mustache",
    cssEffect: "radial-gradient(ellipse at 50% 58%, rgba(60,40,20,0.8) 0%, transparent 12%, transparent 15%, rgba(60,40,20,0.8) 15%, transparent 25%)",
  },
  {
    id: "blush",
    label: "Blush",
    cssEffect: "radial-gradient(ellipse at 25% 58%, rgba(255,150,150,0.6) 0%, transparent 15%), radial-gradient(ellipse at 75% 58%, rgba(255,150,150,0.6) 0%, transparent 15%)",
  },
  {
    id: "tears",
    label: "Tears",
    cssEffect: "radial-gradient(ellipse at 30% 52%, rgba(100,149,237,0.7) 0%, transparent 5%), radial-gradient(ellipse at 70% 52%, rgba(100,149,237,0.7) 0%, transparent 5%)",
  },
  {
    id: "sweat",
    label: "Sweat",
    cssEffect: "radial-gradient(ellipse at 20% 38%, rgba(173,216,230,0.8) 0%, transparent 6%), radial-gradient(ellipse at 80% 42%, rgba(173,216,230,0.8) 0%, transparent 5%)",
  },
  {
    id: "angry",
    label: "Angry",
    cssEffect: "linear-gradient(45deg, transparent 25%, rgba(200,0,0,0.6) 25%, rgba(200,0,0,0.6) 30%, transparent 30%, transparent 70%, rgba(200,0,0,0.6) 70%, rgba(200,0,0,0.6) 75%, transparent 75%)",
  },
  {
    id: "surprised",
    label: "Surprised",
    cssEffect: "radial-gradient(ellipse at 50% 48%, rgba(255,255,255,0.7) 0%, transparent 18%)",
  },
];

export function getCameraEffectCss(effectPreset: CameraEffectPreset): string {
  return (
    cameraEffects.find((effect) => effect.id === effectPreset)?.cssEffect ?? "none"
  );
}
