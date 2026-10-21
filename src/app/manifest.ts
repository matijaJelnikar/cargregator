import type { MetadataRoute } from "next";

// Static export: build the manifest once.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cargregator",
    short_name: "Cargregator",
    description: "Search every car site at once and see what a car costs on Slovenian plates.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f6f7f9",
    theme_color: "#1f5eff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    // Android: once installed, Cargregator shows up in the share sheet; a shared listing opens the import page.
    share_target: { action: "/share/", method: "GET", params: { url: "u", text: "tx", title: "ti" } },
  };
}
