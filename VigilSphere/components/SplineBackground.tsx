"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SCENE_URL =
  "https://prod.spline.design/prMqvXvATuupxYv8/scene.splinecode";

/**
 * Loads Spline via the official <spline-viewer> web component from CDN.
 * This completely bypasses webpack/turbopack bundler issues with WASM/DRACO
 * assets while still rendering the exact same production scene.
 */
export function SplineBackground() {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the Spline viewer script from CDN
    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://unpkg.com/@splinetool/viewer@1.9.82/build/spline-viewer.js";

    script.onload = () => {
      // Create the spline-viewer element after the script loads
      if (containerRef.current) {
        const viewer = document.createElement("spline-viewer");
        viewer.setAttribute("url", SCENE_URL);
        viewer.style.width = "100%";
        viewer.style.height = "100%";
        viewer.style.position = "absolute";
        viewer.style.inset = "0";
        containerRef.current.appendChild(viewer);

        // Mark as loaded after a short delay to allow WebGL init
        setTimeout(() => setLoaded(true), 1500);
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0">
      {/* Loading spinner shown while the WebGL canvas mounts */}
      {!loaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-white/40" />
            <span className="text-xs text-white/30 font-mono tracking-wider uppercase">
              Initializing 3D scene…
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
