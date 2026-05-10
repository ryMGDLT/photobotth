"use client";

import { useEffect, useState } from "react";
import type {
  HydratedSessionGallery,
  PhotoRecord,
  PhotoStatus,
  PhotoStylePreset,
  EditorSettings,
  PhotoLayout,
  PhotoFrameId,
} from "@/features/photobooth/types/photobooth.types";
import {
  hydrateSessionGallery,
  changePhotoStatus,
  deletePhoto,
  duplicatePhoto,
  updatePhotoEdits,
  getEmptyEditorState,
} from "@/features/photobooth/services/photobooth-storage.service";
import {
  getStoredActiveMediaId,
  setStoredActiveMediaId,
} from "@/features/photobooth/utils/photobooth-helpers";
import { createEditorSettings } from "@/features/photobooth/utils/photobooth-presets";

export function usePhotoboothGallery() {
  const [sessionId, setSessionId] = useState("");
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hydrating, setHydrating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadGallery() {
      try {
        const hydratedGallery = await hydrateSessionGallery();
        if (!mounted) return;

        setSessionId(hydratedGallery.sessionId);
        setPhotos(hydratedGallery.photos);
        
        const storedActivePhotoId = getStoredActiveMediaId(window.sessionStorage);
        const defaultActivePhotoId =
          hydratedGallery.photos.find((photo) => photo.id === storedActivePhotoId)?.id ??
          hydratedGallery.photos[0]?.id ??
          null;
        
        setActivePhotoId(defaultActivePhotoId);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Unable to restore session.");
        }
      } finally {
        if (mounted) {
          setHydrating(false);
        }
      }
    }

    void loadGallery();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoredActiveMediaId(window.sessionStorage, activePhotoId);
    }
  }, [activePhotoId]);

  const activePhoto = photos.find((p) => p.id === activePhotoId) ?? null;

  const handleStatusChange = async (photoId: string, status: PhotoStatus) => {
    setBusy(true);
    try {
      const next = await changePhotoStatus({ sessionId, photos, photoId, status });
      setPhotos(next.photos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    setBusy(true);
    try {
      const next = await deletePhoto({ sessionId, photos, photoId });
      setPhotos(next.photos);
      if (activePhotoId === photoId) {
        setActivePhotoId(next.photos[0]?.id ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete photo.");
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (photoId: string) => {
    setBusy(true);
    try {
      const next = await duplicatePhoto({ sessionId, photos, photoId });
      setPhotos(next.photos);
      setActivePhotoId(next.photos[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate photo.");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateEdits = async (
    photoId: string,
    settings: EditorSettings,
    layout: PhotoLayout,
    frame?: PhotoFrameId
  ) => {
    setBusy(true);
    try {
      const next = await updatePhotoEdits({
        sessionId,
        photos,
        photoId,
        settings,
        layout,
        frame,
      });
      setPhotos(next.photos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply edits.");
    } finally {
      setBusy(false);
    }
  };

  return {
    sessionId,
    photos,
    activePhoto,
    activePhotoId,
    setActivePhotoId,
    busy,
    hydrating,
    error,
    setError,
    setPhotos,
    handleStatusChange,
    handleDelete,
    handleDuplicate,
    handleUpdateEdits,
  };
}
