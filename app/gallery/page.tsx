import { GalleryPageContainer } from "@/features/photobooth/components/gallery-page-container";
import { ErrorBoundary } from "@/components/error-boundary";

export default function GalleryPage() {
  return (
    <ErrorBoundary>
      <GalleryPageContainer />
    </ErrorBoundary>
  );
}
