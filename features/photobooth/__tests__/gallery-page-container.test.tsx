import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GalleryPageContainer } from "@/features/photobooth/components/gallery-page-container";

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: navigationMocks.push,
  }),
  usePathname: () => "/gallery",
}));

const serviceMocks = vi.hoisted(() => ({
  hydrateSessionGallery: vi.fn(),
  createCapture: vi.fn(),
  updatePhotoEdits: vi.fn(),
  changePhotoStatus: vi.fn(),
  deletePhoto: vi.fn(),
  duplicatePhoto: vi.fn(),
  downloadPhoto: vi.fn(),
  getEmptyEditorState: vi.fn(() => ({
    layout: "single" as const,
    settings: {
      preset: "original" as const,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      vignette: 0,
    },
  })),
}));

vi.mock("@/features/photobooth/services/photobooth-storage.service", () => serviceMocks);

describe("GalleryPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    serviceMocks.hydrateSessionGallery.mockResolvedValue({
      sessionId: "session-123",
      photos: [
        {
          id: "photo-saved",
          sessionId: "session-123",
          mediaType: "photo",
          status: "saved",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sourceImage: "data:image/jpeg;base64,saved",
          renderedImage: "data:image/jpeg;base64,saved",
          settings: {
            preset: "original",
            brightness: 100,
            contrast: 100,
            saturation: 100,
            vignette: 0,
          },
          layout: "single",
          name: "Saved Shot 01",
        },
      ],
    });
  });

  it("routes to the start wizard editor step when selecting a photo", async () => {
    const user = userEvent.setup();
    render(<GalleryPageContainer />);

    await waitFor(() => {
      expect(screen.getByText("Saved Shot 01")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /edit this photo/i }));
    expect(navigationMocks.push).toHaveBeenCalledWith("/start?step=editor");
  });
});
