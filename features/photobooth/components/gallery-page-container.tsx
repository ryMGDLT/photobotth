"use client";

import { useRouter } from "next/navigation";
import { SessionBanner } from "@/features/photobooth/components/session-banner";
import { SessionGallery } from "@/features/photobooth/components/session-gallery";
import { usePhotoboothGallery } from "@/features/photobooth/hooks/use-photobooth-gallery";
import { downloadPhoto } from "@/features/photobooth/services/photobooth-storage.service";

export function GalleryPageContainer() {
  const router = useRouter();
  const {
    sessionId,
    photos,
    activePhotoId,
    setActivePhotoId,
    busy,
    hydrating,
    handleStatusChange,
    handleDelete,
    handleDuplicate,
  } = usePhotoboothGallery();

  const handleDownload = async (photoId?: string) => {
    const target = photos.find((p) => p.id === (photoId ?? activePhotoId));
    if (target) await downloadPhoto(target);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <SessionBanner
        photoCount={photos.length}
        savedCount={photos.filter((p) => p.status === "saved").length}
        sessionId={sessionId || "loading"}
      />
      
      <div className="flex-1 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <SessionGallery
          photos={photos}
          activePhotoId={activePhotoId}
          busy={busy || hydrating}
          hydrating={hydrating}
          onSelect={(id) => {
            setActivePhotoId(id);
            router.push("/start?step=editor");
          }}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onStatusChange={handleStatusChange}
        />
      </div>
    </main>
  );
}
