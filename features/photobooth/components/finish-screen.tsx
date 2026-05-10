"use client";

import { Download, Home, Images, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinishScreen({
  canDownload,
  onDownload,
  onViewGallery,
  onTakeAnother,
  onBackToMenu,
}: {
  canDownload: boolean;
  onDownload: () => void;
  onViewGallery: () => void;
  onTakeAnother: () => void;
  onBackToMenu: () => void;
}) {
  return (
    <div className="animate-in zoom-in-95 fade-in duration-500 flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="rounded-3xl bg-[#7c4529] p-8 retro-shadow max-w-md w-full">
        <h2 className="text-4xl font-black text-[#fff1d3] mb-4">DONE!</h2>
        <p className="text-[#f7ebcf] mb-8">
          Your shots are stored locally in this browser session. Download what you
          want, then head back to the menu.
        </p>

        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full rounded-full retro-marquee text-[#fff1d3]"
            onClick={onBackToMenu}
          >
            <Home className="size-5" />
            Main Menu
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full rounded-full border-2 border-[#f7ebcf] bg-white text-[#5c3d2a] hover:bg-[#fffaf0] hover:text-[#7c4529]"
            onClick={onViewGallery}
          >
            <Images className="size-5" />
            View Gallery
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full rounded-full border-2 border-[#f7ebcf] bg-white text-[#5c3d2a] hover:bg-[#fffaf0] hover:text-[#7c4529]"
            onClick={onTakeAnother}
          >
            <RefreshCcw className="size-5" />
            Take Another
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full rounded-full bg-[#fffaf0] text-[#5c3d2a] hover:bg-white"
            onClick={onDownload}
            disabled={!canDownload}
          >
            <Download className="size-5" />
            Download Last
          </Button>
        </div>
      </div>
    </div>
  );
}
