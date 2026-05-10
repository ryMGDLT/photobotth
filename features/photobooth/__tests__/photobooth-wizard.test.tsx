import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PhotoboothWizard } from "@/features/photobooth/components/photobooth-wizard";

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: navigationMocks.push,
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

describe("PhotoboothWizard", () => {
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

  it("starts on the camera step by default", async () => {
    render(<PhotoboothWizard />);

    expect(await screen.findByText("Camera")).toBeInTheDocument();
    expect(screen.getByText("1/3")).toBeInTheDocument();
  });

  it("can start on the editor step when requested and a photo exists", async () => {
    render(<PhotoboothWizard initialStep="editor" />);

    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("shows a denied-camera message when camera access fails", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied")),
      },
    });

    render(<PhotoboothWizard initialStep="camera" />);

    const startCameraButton = await screen.findByRole("button", {
      name: /start camera/i,
    });
    await user.click(startCameraButton);

    await waitFor(() => {
      expect(screen.getByText("Permission denied")).toBeInTheDocument();
    });
  });
});
