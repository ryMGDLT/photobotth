import {
  changePhotoStatus,
  createCapture,
  deletePhoto,
  hydrateSessionGallery,
  updatePhotoEdits,
} from "@/features/photobooth/services/photobooth-storage.service";

vi.mock("@/features/photobooth/services/photo-editor.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/photobooth/services/photo-editor.service")
  >("@/features/photobooth/services/photo-editor.service");

  return {
    ...actual,
    renderPhotoDataUrl: vi.fn(async () => "data:image/jpeg;base64,rendered"),
  };
});

describe("photobooth storage service", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("hydrates and keeps captures inside the current session", async () => {
    const hydrated = await hydrateSessionGallery();
    expect(hydrated.photos).toHaveLength(0);

    const created = await createCapture({
      sessionId: hydrated.sessionId,
      photos: [],
      sourceImage: "data:image/jpeg;base64,source",
    });

    expect(created.photos).toHaveLength(1);
    expect(created.photos[0]?.status).toBe("draft");
    expect(created.photos[0]?.mediaType).toBe("photo");

    const rehydrated = await hydrateSessionGallery();
    expect(rehydrated.sessionId).toBe(hydrated.sessionId);
    expect(rehydrated.photos).toHaveLength(1);
  });

  it("removes stale galleries when a new session is active", async () => {
    const firstSession = await hydrateSessionGallery();
    await createCapture({
      sessionId: firstSession.sessionId,
      photos: [],
      sourceImage: "data:image/jpeg;base64,first",
    });

    window.sessionStorage.clear();
    const secondSession = await hydrateSessionGallery();
    expect(secondSession.sessionId).not.toBe(firstSession.sessionId);
    expect(secondSession.photos).toHaveLength(0);
  });

  it("updates status, edits, and deletion consistently", async () => {
    const hydrated = await hydrateSessionGallery();
    const created = await createCapture({
      sessionId: hydrated.sessionId,
      photos: [],
      sourceImage: "data:image/jpeg;base64,source",
    });

    const photoId = created.photos[0]?.id;
    expect(photoId).toBeTruthy();

    const saved = await changePhotoStatus({
      sessionId: hydrated.sessionId,
      photos: created.photos,
      photoId: photoId!,
      status: "saved",
    });

    expect(saved.photos[0]?.status).toBe("saved");

    const edited = await updatePhotoEdits({
      sessionId: hydrated.sessionId,
      photos: saved.photos,
      photoId: photoId!,
      layout: "strip",
      settings: {
        preset: "pop",
        brightness: 109,
        contrast: 118,
        saturation: 140,
        vignette: 10,
      },
    });

    expect(edited.photos[0]?.layout).toBe("strip");
    expect(edited.photos[0]?.renderedImage).toContain("rendered");

    const afterDelete = await deletePhoto({
      sessionId: hydrated.sessionId,
      photos: edited.photos,
      photoId: photoId!,
    });

    expect(afterDelete.photos).toHaveLength(0);
  });
});
