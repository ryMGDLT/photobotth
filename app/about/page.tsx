import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SectionNav } from "@/features/photobooth/components/section-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AboutPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="glass-panel photobooth-grid retro-shadow overflow-hidden border-[#f0dbb8]">
        <CardContent className="px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <Badge variant="accent" className="retro-marquee w-fit text-[#fff0d0]">
                  About FlashFrame
                </Badge>
                <div className="space-y-2">
                  <h1 className="retro-heading text-4xl font-black tracking-tight text-[color:var(--foreground)] sm:text-5xl">
                    The Local Photobooth
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <SectionNav />
              <ThemeToggle />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex-1 animate-in slide-in-from-bottom-4 fade-in duration-500 max-w-4xl mx-auto w-full pt-12">
        <div className="prose prose-stone dark:prose-invert max-w-none text-lg">
          <h2 className="retro-heading text-3xl font-black">Privacy First</h2>
          <p>
            FlashFrame runs entirely in your browser. When you grant camera access, the video feed never leaves your device.
            All photos, filters, effects, and videos are generated and saved using your computer's local IndexedDB. 
          </p>
          <p>
            When you close the tab or clear your browser data, your session is gone forever. Enjoy the moment!
          </p>
          
          <h2 className="retro-heading text-3xl font-black mt-12">Technology</h2>
          <p>
            FlashFrame is built with modern web technologies:
          </p>
          <ul>
            <li><strong>Next.js & React</strong> for the interface</li>
            <li><strong>MediaPipe</strong> for client-side face tracking and AR effects</li>
            <li><strong>WebGL</strong> for high-performance camera filters</li>
            <li><strong>Tailwind CSS</strong> for styling</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
