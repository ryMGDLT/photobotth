"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { useState } from "react";

import { Dialog, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PhotoRecord } from "@/features/photobooth/types/photobooth.types";

interface StripPhotoSelectorProps {
  open: boolean;
  activePhoto: PhotoRecord;
  otherPhotos: PhotoRecord[];
  onConfirm: (selectedIds: [string, string, string]) => void;
  onClose: () => void;
}

export function StripPhotoSelector({
  open,
  activePhoto,
  otherPhotos,
  onConfirm,
  onClose,
}: StripPhotoSelectorProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const photoOnlyOthers = otherPhotos.filter((p) => p.mediaType === "photo");
  const hasEnough = photoOnlyOthers.length >= 2;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((s) => s !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function handleConfirm() {
    if (selected.length === 2) {
      onConfirm([activePhoto.id, selected[0], selected[1]]);
      setSelected([]);
    }
  }

  function handleClose() {
    setSelected([]);
    onClose();
  }

  const filledSlots = 1 + selected.length;

  return (
    <Dialog open={open} onClose={handleClose} className="max-w-sm sm:max-w-md">
      <DialogTitle>Build your photo strip</DialogTitle>
      <p className="text-sm text-[color:var(--muted-foreground)] -mt-2 mb-4">
        Slot 1 is pre-filled. Pick 2 more to complete your strip.
      </p>

      {!hasEnough ? (
        <div className="rounded-[1.2rem] border border-dashed border-[color:var(--border)] bg-white/50 px-5 py-8 text-center text-sm leading-6 text-[color:var(--muted-foreground)]">
          You need at least 3 photos in your session to create a strip.
          Take more photos first, then try again.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 max-h-[45vh] overflow-y-auto py-1 pr-1">
            {/* Slot 1: active photo — always pre-selected */}
            <div className="relative rounded-xl overflow-hidden border-2 border-[color:var(--primary)] ring-2 ring-[color:var(--primary)]/20">
              <Image
                src={activePhoto.sourceImage}
                alt={activePhoto.name ?? "Slot 1"}
                width={120}
                height={80}
                unoptimized
                className="w-full h-20 object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white text-xs font-bold bg-[color:var(--primary)] rounded-full w-5 h-5 flex items-center justify-center">
                  1
                </span>
              </div>
            </div>

            {/* Remaining photos to pick from */}
            {photoOnlyOthers.map((photo) => {
              const slotIndex = selected.indexOf(photo.id);
              const isSelected = slotIndex !== -1;
              const slotNumber = slotIndex + 2;

              return (
                <button
                  key={photo.id}
                  type="button"
                  className={`relative rounded-xl overflow-hidden border-2 transition-all duration-150 ${
                    isSelected
                      ? "border-[color:var(--primary)] ring-2 ring-[color:var(--primary)]/20"
                      : "border-[color:var(--border)] hover:border-[color:var(--primary)]/50"
                  }`}
                  onClick={() => toggleSelect(photo.id)}
                >
                  <Image
                    src={photo.sourceImage}
                    alt={photo.name ?? "Photo option"}
                    width={120}
                    height={80}
                    unoptimized
                    className="w-full h-20 object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-[color:var(--primary)] rounded-full w-5 h-5 flex items-center justify-center">
                        {slotNumber}
                      </span>
                    </div>
                  )}
                  {!isSelected && selected.length >= 2 && (
                    <div className="absolute inset-0 bg-black/40" />
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-center text-[color:var(--muted-foreground)]">
            {filledSlots}/3 selected
          </p>
        </>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
        {hasEnough && (
          <Button onClick={handleConfirm} disabled={selected.length < 2}>
            <Check className="size-4" />
            Select ({filledSlots}/3)
          </Button>
        )}
      </div>
    </Dialog>
  );
}
