"use client";

import Image from "next/image";
import { Copy, Download, Heart, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  PhotoRecord,
  PhotoStatus,
} from "@/features/photobooth/types/photobooth.types";

interface SessionGalleryProps {
  photos: PhotoRecord[];
  activePhotoId: string | null;
  busy: boolean;
  hydrating?: boolean;
  onSelect: (photoId: string) => void;
  onDuplicate: (photoId: string) => void;
  onDelete: (photoId: string) => void;
  onDownload: (photoId: string) => void;
  onStatusChange: (photoId: string, status: PhotoStatus) => void;
}

export function SessionGallery({
  photos,
  activePhotoId,
  busy,
  hydrating = false,
  onSelect,
  onDuplicate,
  onDelete,
  onDownload,
  onStatusChange,
}: SessionGalleryProps) {
  const savedPhotos = photos.filter((photo) => photo.status === "saved");
  const draftPhotos = photos.filter((photo) => photo.status === "draft");

  return (
    <Card className="glass-panel retro-shadow border-[#eedab5]">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="retro-heading">Session Gallery</CardTitle>
            <CardDescription>
              Saved picks stay pinned. Drafts stay editable until the session ends.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="border-[#c39561] bg-[#fff7e8] text-[#7d4a2b]"
          >
            {photos.length} Total
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        {hydrating ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <GalleryColumnSkeleton title="Saved" />
            <GalleryColumnSkeleton title="Drafts" />
          </div>
        ) : (
          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <GalleryColumn
              title="Saved"
              emptyMessage="Pin a photo from the editor to keep it at the top of this session."
              photos={savedPhotos}
              activePhotoId={activePhotoId}
              busy={busy}
              onSelect={onSelect}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onDownload={onDownload}
              onStatusChange={onStatusChange}
            />
            <GalleryColumn
              title="Drafts"
              emptyMessage="Fresh captures land here first so you can keep experimenting."
              photos={draftPhotos}
              activePhotoId={activePhotoId}
              busy={busy}
              onSelect={onSelect}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onDownload={onDownload}
              onStatusChange={onStatusChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface GalleryColumnProps extends SessionGalleryProps {
  title: string;
  emptyMessage: string;
  photos: PhotoRecord[];
}

function GalleryColumn({
  title,
  emptyMessage,
  photos,
  activePhotoId,
  busy,
  onSelect,
  onDuplicate,
  onDelete,
  onDownload,
  onStatusChange,
}: GalleryColumnProps) {
  return (
    <div className="retro-frame rounded-[1.6rem] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[color:var(--foreground)]">
          {title}
        </h3>
        <span className="retro-marquee rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#fff1d3]">
          {photos.length}
        </span>
      </div>

      {photos.length === 0 ? (
        <p className="rounded-[1.4rem] border border-dashed border-[#cbab7c] bg-[#fff8ee] px-4 py-6 text-sm leading-6 text-[color:var(--muted-foreground)]">
          {emptyMessage}
        </p>
      ) : (
        <div className="space-y-4">
          {photos.map((photo) => {
            const active = activePhotoId === photo.id;
            return (
              <article
                key={photo.id}
                className={`rounded-[1.5rem] border p-3 transition ${
                  active
                    ? "border-transparent bg-[#f2ddb8] shadow-sm"
                    : "border-[#d1b182] bg-[#fff9f0]"
                }`}
              >
                <button
                  type="button"
                  className="retro-frame block w-full overflow-hidden rounded-[1.2rem]"
                  onClick={() => onSelect(photo.id)}
                >
                  {photo.mediaType === "video" && photo.renderedVideo ? (
                    <video
                      src={photo.renderedVideo}
                      poster={photo.renderedImage}
                      muted
                      playsInline
                      className="aspect-[4/5] w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={photo.renderedImage}
                      alt={photo.name ?? "Saved photobooth capture"}
                      width={800}
                      height={1000}
                      unoptimized
                      className="aspect-[4/5] w-full object-cover"
                    />
                  )}
                </button>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[color:var(--foreground)]">
                      {photo.name ?? "Untitled shot"}
                    </p>
                    <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                      {photo.mediaType === "video"
                        ? `Video Clip${photo.durationMs ? ` • ${Math.ceil(photo.durationMs / 1000)}s` : ""}`
                        : photo.layout === "strip"
                          ? "Photo Strip"
                          : "Single Frame"}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-full border border-[#cca56f] bg-[#fff7ea] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)] sm:w-auto"
                    onClick={() =>
                      onStatusChange(
                        photo.id,
                        photo.status === "saved" ? "draft" : "saved",
                      )
                    }
                    disabled={busy}
                  >
                    {photo.status}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <IconAction
                    label="Edit"
                    onClick={() => onSelect(photo.id)}
                    icon={<Pencil className="size-4" />}
                  />
                  <IconAction
                    label="Copy"
                    onClick={() => onDuplicate(photo.id)}
                    icon={<Copy className="size-4" />}
                    disabled={busy}
                  />
                  <IconAction
                    label="Download"
                    onClick={() => onDownload(photo.id)}
                    icon={<Download className="size-4" />}
                    disabled={busy}
                  />
                  <IconAction
                    label={photo.status === "saved" ? "Unsave" : "Save"}
                    onClick={() =>
                      onStatusChange(
                        photo.id,
                        photo.status === "saved" ? "draft" : "saved",
                      )
                    }
                    icon={<Heart className="size-4" />}
                    disabled={busy}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 w-full justify-center rounded-full text-red-700 hover:bg-[#fff0ea] hover:text-red-800"
                  onClick={() => onDelete(photo.id)}
                  disabled={busy}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GalleryColumnSkeleton({ title }: { title: string }) {
  return (
    <div className="retro-frame rounded-[1.6rem] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <Skeleton className="h-6 w-12 rounded-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="aspect-[4/5] w-full rounded-[1.4rem]" />
        <Skeleton className="h-5 w-2/3" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

interface IconActionProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

function IconAction({ label, icon, onClick, disabled }: IconActionProps) {
  return (
    <button
      type="button"
      className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-2xl border border-[#caa478] bg-[#fff9f0] px-2 py-3 text-center text-xs font-semibold text-[color:var(--foreground)] transition hover:bg-[#f6e1be] disabled:cursor-not-allowed disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {label}
    </button>
  );
}
