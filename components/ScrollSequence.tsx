"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollSequence() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<HTMLImageElement[]>([]);

  // Updated to match your 240 frames
  const frameCount = 240;

  // Preload all images to prevent flickering on scroll
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = [];
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      // Matches the format: frame_0001.jpg
      const frameNum = i.toString().padStart(4, "0");
      img.src = `/sequence/frame_${frameNum}.jpg`;
      loadedImages.push(img);
    }
    setImages(loadedImages);
  }, []);

  // Handle the scroll event and draw to canvas
  useEffect(() => {
    if (images.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Draw the first frame as soon as it loads
    if (images[0].complete) {
      context.drawImage(images[0], 0, 0, canvas.width, canvas.height);
    } else {
      images[0].onload = () => {
        context.drawImage(images[0], 0, 0, canvas.width, canvas.height);
      };
    }

    const handleScroll = () => {
      // Calculate scroll progress relative to the entire document
      const html = document.documentElement;
      const scrollTop = html.scrollTop;
      const maxScrollTop = html.scrollHeight - window.innerHeight;

      const scrollFraction = scrollTop / maxScrollTop;

      // Map the scroll fraction (0 to 1) to the frame index (0 to 239)
      const frameIndex = Math.min(
        frameCount - 1,
        Math.floor(scrollFraction * frameCount),
      );

      // requestAnimationFrame ensures buttery smooth rendering without layout thrashing
      requestAnimationFrame(() => {
        if (images[frameIndex]) {
          context.drawImage(
            images[frameIndex],
            0,
            0,
            canvas.width,
            canvas.height,
          );
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [images]);

  return (
    <div className="sticky top-0 h-screen w-full overflow-hidden bg-zinc-950 z-0">
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="h-full w-full object-cover opacity-60"
      />
      {/* Dark gradient overlay to make your Shadcn mauve text readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/40 via-transparent to-zinc-950/90" />
    </div>
  );
}
