import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PhotoboothApp } from "@/features/photobooth/components/photobooth-app";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
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

describe("PhotoboothApp", () => {
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
        {
          id: "photo-draft",
          sessionId: "session-123",
          mediaType: "photo",
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sourceImage: "data:image/jpeg;base64,draft",
          renderedImage: "data:image/jpeg;base64,draft",
          settings: {
            preset: "warm",
            brightness: 108,
            contrast: 101,
            saturation: 116,
            vignette: 8,
          },
          layout: "strip",
          name: "Draft Shot 02",
        },
      ],
    });
  });

  it("hydrates the gallery and separates saved and draft sections", async () => {
    render(<PhotoboothApp currentPage="gallery" />);

    await waitFor(() => {
      expect(screen.getByText("Saved Shot 01")).toBeInTheDocument();
      expect(screen.getByText("Draft Shot 02")).toBeInTheDocument();
    });

    expect(screen.getByText("Saved Picks")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Session Gallery" }),
    ).toBeInTheDocument();
  });

  it("shows a denied-camera message when camera access fails", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
    });

    render(<PhotoboothApp currentPage="camera" />);

    const startCameraButton = await screen.findByRole("button", {
      name: /start camera/i,
    });
    await user.click(startCameraButton);

    await waitFor(() => {
      expect(screen.getByText("Permission denied")).toBeInTheDocument();
    });
  });
});
