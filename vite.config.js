import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        playground: resolve(__dirname, "index.html"),
        demos: resolve(__dirname, "demos/index.html"),
        absoluteToFlow: resolve(__dirname, "demos/absolute-to-flow.html"),
        composedAnimations: resolve(__dirname, "demos/composed-animations.html"),
        geometry: resolve(__dirname, "demos/geometry.html"),
        layoutEffects: resolve(__dirname, "demos/layout-effects.html"),
        depthStacking: resolve(__dirname, "demos/depth-stacking.html"),
        transforms3d: resolve(__dirname, "demos/3d-transforms.html")
      }
    }
  }
});
