import { editorSettingsSchema, sessionGallerySchema } from "@/features/photobooth/schemas/photobooth.schema";

describe("photobooth schema", () => {
  it("accepts a valid session gallery payload", () => {
    const result = sessionGallerySchema.safeParse({
      version: 2,
      sessionId: "session-123",
      photos: [
        {
          id: "photo-123",
          sessionId: "session-123",
          mediaType: "photo",
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sourceImage: "data:image/jpeg;base64,abc",
          renderedImage: "data:image/jpeg;base64,abc",
          settings: {
            preset: "warm",
            brightness: 108,
            contrast: 101,
            saturation: 116,
            vignette: 8,
          },
          layout: "single",
          name: "Draft Shot 01",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects malformed editor values", () => {
    const result = editorSettingsSchema.safeParse({
      preset: "cool",
      brightness: 160,
      contrast: 100,
      saturation: 100,
      vignette: 0,
    });

    expect(result.success).toBe(false);
  });
});
