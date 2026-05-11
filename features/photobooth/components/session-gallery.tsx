"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Copy, Download, Heart, Pencil, Trash2, ChevronLeft, ChevronRight, LayoutGrid, Bookmark, FileText, ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  PhotoRecord,
  PhotoStatus,
} from "@/features/photobooth/types/photobooth.types";

type FilterMode = "all" | "saved" | "draft";
type SortMode = "newest" | "oldest";

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
  const [previewPhoto, setPreviewPhoto] = useState<PhotoRecord | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortMode>("newest");

  const filteredPhotos = photos
    .filter((p) => filter === "all" || p.status === filter)
    .sort((a, b) =>
      sort === "newest"
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  const heroPhoto = filteredPhotos[0] ?? null;
  const gridPhotos = filteredPhotos.slice(1);

  const savedPhotos = photos.filter((p) => p.status === "saved");
  const draftPhotos = photos.filter((p) => p.status === "draft");

  // Keyboard navigation inside modal
  const navigateModal = useCallback(
    (dir: "prev" | "next") => {
      if (!previewPhoto) return;
      const idx = filteredPhotos.findIndex((p) => p.id === previewPhoto.id);
      if (idx === -1) return;
      const next = dir === "prev" ? idx - 1 : idx + 1;
      if (next >= 0 && next < filteredPhotos.length) {
        setPreviewPhoto(filteredPhotos[next]);
      }
    },
    [previewPhoto, filteredPhotos]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!previewPhoto) return;
      if (e.key === "ArrowLeft") navigateModal("prev");
      if (e.key === "ArrowRight") navigateModal("next");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [previewPhoto, navigateModal]);

  if (hydrating) {
    return <GallerySkeleton />;
  }

  const previewIdx = previewPhoto
    ? filteredPhotos.findIndex((p) => p.id === previewPhoto.id)
    : -1;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500 space-y-6">
      {/* Filter Bar */}
      <Card className="glass-panel retro-shadow border-[#eedab5]">
        <CardContent className="px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <FilterPill
                active={filter === "all"}
                onClick={() => setFilter("all")}
                icon={<LayoutGrid className="size-3" />}
                label="All"
                count={photos.length}
              />
              <FilterPill
                active={filter === "saved"}
                onClick={() => setFilter("saved")}
                icon={<Bookmark className="size-3" />}
                label="Saved"
                count={savedPhotos.length}
              />
              <FilterPill
                active={filter === "draft"}
                onClick={() => setFilter("draft")}
                icon={<FileText className="size-3" />}
                label="Drafts"
                count={draftPhotos.length}
              />
            </div>

            {/* Sort toggle */}
            <button
              type="button"
              className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#cca56f] bg-[#fff7ea] px-3 py-1.5 text-xs font-semibold text-[color:var(--muted-foreground)] transition hover:bg-[#f6e1be]"
              onClick={() => setSort((s) => s === "newest" ? "oldest" : "newest")}
            >
              <ArrowUpDown className="size-3" />
              {sort === "newest" ? "Newest" : "Oldest"}
            </button>
          </div>
        </CardContent>
      </Card>

      {photos.length === 0 ? (
        <Card className="glass-panel border-[#eedab5]">
          <CardContent className="px-6 py-16 text-center">
            <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
              No photos yet. Head to the booth and take your first shot!
            </p>
          </CardContent>
        </Card>
      ) : filteredPhotos.length === 0 ? (
        <Card className="glass-panel border-[#eedab5]">
          <CardContent className="px-6 py-16 text-center">
            <p className="text-sm leading-6 text-[color:var(--muted-foreground)]">
              No photos match this filter.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Hero Photo */}
          {heroPhoto && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-600">
              <HeroPhoto
                photo={heroPhoto}
                active={activePhotoId === heroPhoto.id}
                busy={busy}
                onPreview={() => setPreviewPhoto(heroPhoto)}
                onSelect={onSelect}
                onStatusChange={onStatusChange}
              />
            </div>
          )}

          {/* Thumbnail Grid */}
          {gridPhotos.length > 0 && (
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            >
              {gridPhotos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="animate-in fade-in zoom-in-95 duration-300"
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                >
                  <PhotoThumbnail
                    photo={photo}
                    active={activePhotoId === photo.id}
                    onPreview={() => setPreviewPhoto(photo)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewPhoto} onClose={() => setPreviewPhoto(null)}>
        {previewPhoto && (
          <div className="flex flex-col gap-4">
            {/* Modal header */}
            <div className="flex items-start justify-between gap-3 pr-8">
              <div>
                <DialogTitle className="mb-0.5">
                  {previewPhoto.name ?? "Photo Preview"}
                </DialogTitle>
                <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                  {previewPhoto.mediaType === "video"
                    ? `Video Clip${previewPhoto.durationMs ? ` · ${Math.ceil(previewPhoto.durationMs / 1000)}s` : ""}`
                    : previewPhoto.layout === "strip"
                      ? "Photo Strip"
                      : "Single Frame"}
                  {" · "}
                  <span className={previewPhoto.status === "saved" ? "text-green-600" : "text-[color:var(--muted-foreground)]"}>
                    {previewPhoto.status === "saved" ? "Saved" : "Draft"}
                  </span>
                </p>
              </div>
              {/* Keyboard nav hint */}
              <span className="hidden sm:block text-xs text-[color:var(--muted-foreground)] mt-1 shrink-0">
                ← → to navigate
              </span>
            </div>

            {/* Photo display */}
            <div className="retro-frame mx-auto w-full max-w-full rounded-[1.6rem] bg-[#fff8ee] p-3">
              {previewPhoto.mediaType === "video" && previewPhoto.renderedVideo ? (
                <video
                  src={previewPhoto.renderedVideo}
                  poster={previewPhoto.renderedImage}
                  controls
                  playsInline
                  className="w-full h-auto max-h-[50vh] object-contain rounded-[1.2rem]"
                />
              ) : previewPhoto.layout === "strip" ? (
                <div className="retro-scrollbar flex flex-col gap-3 max-h-[55vh] overflow-y-auto rounded-[1.2rem] bg-[#fffaf0] p-4 pb-10 shadow-lg">
                  {(previewPhoto.stripImages?.length ? previewPhoto.stripImages : [previewPhoto.renderedImage]).map((img, idx) => (
                    <Image
                      key={idx}
                      src={img}
                      alt={`Strip photo ${idx + 1}`}
                      width={600}
                      height={400}
                      unoptimized
                      className="w-full h-auto object-contain rounded-sm"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-[1.2rem] bg-[#fffaf0] p-3 shadow-lg">
                  <Image
                    src={previewPhoto.renderedImage}
                    alt={previewPhoto.name ?? "Photo preview"}
                    width={900}
                    height={600}
                    unoptimized
                    className="w-full h-auto max-h-[55vh] object-contain rounded-sm"
                  />
                </div>
              )}
            </div>

            {/* Navigation arrows */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#cca56f] bg-[#fff7ea] transition hover:bg-[#f6e1be] disabled:opacity-30"
                onClick={() => navigateModal("prev")}
                disabled={previewIdx <= 0}
                aria-label="Previous photo"
              >
                <ChevronLeft className="size-5" />
              </button>
              <span className="text-xs text-[color:var(--muted-foreground)]">
                {previewIdx + 1} / {filteredPhotos.length}
              </span>
              <button
                type="button"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#cca56f] bg-[#fff7ea] transition hover:bg-[#f6e1be] disabled:opacity-30"
                onClick={() => navigateModal("next")}
                disabled={previewIdx >= filteredPhotos.length - 1}
                aria-label="Next photo"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            {/* Action row */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center">
              <Button
                size="sm"
                className="rounded-full retro-marquee text-[#fff1d3]"
                onClick={() => {
                  onSelect(previewPhoto.id);
                  setPreviewPhoto(null);
                }}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => onDownload(previewPhoto.id)}
                disabled={busy}
              >
                <Download className="size-4" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => onDuplicate(previewPhoto.id)}
                disabled={busy}
              >
                <Copy className="size-4" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  onStatusChange(
                    previewPhoto.id,
                    previewPhoto.status === "saved" ? "draft" : "saved"
                  )
                }
                disabled={busy}
              >
                <Heart className={`size-4 ${previewPhoto.status === "saved" ? "fill-current text-rose-500" : ""}`} />
                {previewPhoto.status === "saved" ? "Unsave" : "Save"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="col-span-2 sm:col-span-1 rounded-full text-red-700 hover:bg-[#fff0ea] hover:text-red-800"
                onClick={() => {
                  onDelete(previewPhoto.id);
                  setPreviewPhoto(null);
                }}
                disabled={busy}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

// --- Hero Photo ---

function HeroPhoto({
  photo,
  active,
  busy,
  onPreview,
  onSelect,
  onStatusChange,
}: {
  photo: PhotoRecord;
  active: boolean;
  busy: boolean;
  onPreview: () => void;
  onSelect: (id: string) => void;
  onStatusChange: (id: string, status: PhotoStatus) => void;
}) {
  return (
    <Card className={`glass-panel retro-shadow overflow-hidden border-2 transition-all duration-300 ${active ? "border-[color:var(--primary)]" : "border-[#eedab5]"}`}>
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Hero image */}
          <button
            type="button"
            className="group relative block w-full cursor-pointer overflow-hidden lg:w-[60%]"
            onClick={onPreview}
          >
            {photo.mediaType === "video" && photo.renderedVideo ? (
              <video
                src={photo.renderedVideo}
                poster={photo.renderedImage}
                muted
                playsInline
                className="w-full h-64 sm:h-80 lg:h-96 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            ) : (
              <Image
                src={photo.renderedImage}
                alt={photo.name ?? "Hero photo"}
                width={1200}
                height={800}
                unoptimized
                className="w-full h-64 sm:h-80 lg:h-96 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/20 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-sm font-semibold bg-black/50 rounded-full px-4 py-2">
                Preview
              </span>
            </div>
            {/* Status badge */}
            <div className="absolute top-3 left-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${photo.status === "saved" ? "bg-[color:var(--primary)] text-[#fff1d3]" : "bg-black/40 text-white"}`}>
                {photo.status === "saved" ? "★ Saved" : "Draft"}
              </span>
            </div>
          </button>

          {/* Hero info panel */}
          <div className="flex flex-col justify-between gap-4 p-5 lg:w-[40%]">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--muted-foreground)]">
                {photo.mediaType === "video"
                  ? `Video Clip${photo.durationMs ? ` · ${Math.ceil(photo.durationMs / 1000)}s` : ""}`
                  : photo.layout === "strip" ? "Photo Strip" : "Single Frame"}
              </p>
              <h3 className="retro-heading text-xl font-black text-[color:var(--foreground)] leading-tight">
                {photo.name ?? "Untitled shot"}
              </h3>
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {new Date(photo.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                className="w-full rounded-full retro-marquee text-[#fff1d3]"
                onClick={() => onSelect(photo.id)}
              >
                <Pencil className="size-4" />
                Edit this photo
              </Button>
              <button
                type="button"
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-[#cca56f] bg-[#fff7ea] px-3 py-2 text-xs font-semibold transition hover:bg-[#f6e1be] disabled:opacity-50"
                onClick={() => onStatusChange(photo.id, photo.status === "saved" ? "draft" : "saved")}
                disabled={busy}
              >
                <Heart className={`size-4 ${photo.status === "saved" ? "fill-current text-rose-500" : ""}`} />
                {photo.status === "saved" ? "Remove from Saved" : "Save this photo"}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Thumbnail ---

function PhotoThumbnail({
  photo,
  active,
  onPreview,
}: {
  photo: PhotoRecord;
  active: boolean;
  onPreview: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      type="button"
      className={`group relative block w-full overflow-hidden rounded-[1.2rem] border-2 transition-all duration-200 ${
        active
          ? "border-[color:var(--primary)] shadow-md"
          : "border-[#d1b182] hover:border-[color:var(--primary)]/60"
      } ${pressed ? "scale-95" : "hover:scale-[1.03] hover:shadow-lg"}`}
      onClick={onPreview}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
    >
      <div className="aspect-square w-full overflow-hidden bg-[#fff8ee]">
        {photo.mediaType === "video" && photo.renderedVideo ? (
          <video
            src={photo.renderedVideo}
            poster={photo.renderedImage}
            muted
            playsInline
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 group-hover:brightness-110"
          />
        ) : (
          <Image
            src={photo.renderedImage}
            alt={photo.name ?? "Photo"}
            width={400}
            height={400}
            unoptimized
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 group-hover:brightness-110"
          />
        )}
      </div>

      {/* Status dot */}
      {photo.status === "saved" && (
        <div className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-[color:var(--primary)] shadow-sm ring-2 ring-white" />
      )}

      {/* Hover label */}
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 rounded-[1rem]">
        <span className="w-full truncate px-2 pb-2 text-center text-xs font-semibold text-white">
          {photo.name ?? "View"}
        </span>
      </div>
    </button>
  );
}

// --- Filter Pill ---

function FilterPill({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      className={`flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
        active
          ? "border-transparent bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
          : "border-[#cca56f] bg-[#fff7ea] text-[color:var(--muted-foreground)] hover:bg-[#f6e1be]"
      }`}
      onClick={onClick}
    >
      {icon}
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/20" : "bg-[#f0dbb8]"}`}>
        {count}
      </span>
    </button>
  );
}

// --- Skeleton ---

function GallerySkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card className="glass-panel border-[#eedab5]">
        <CardContent className="px-4 py-3 sm:px-6">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-20 rounded-full" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-64 sm:h-80 w-full rounded-[1.6rem]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-[1.2rem]" />
        ))}
      </div>
    </div>
  );
}
