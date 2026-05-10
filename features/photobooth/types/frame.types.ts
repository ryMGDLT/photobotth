export type PhotoFrameId =
  | "classic-cream"
  | "dusty-pink"
  | "teal"
  | "amber"
  | "lavender"
  | "diagonal-stripes"
  | "dots"
  | "hearts"
  | "pastel-gradient";

export interface FrameDefinition {
  id: PhotoFrameId;
  name: string;
  watermarkColor: string;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}
