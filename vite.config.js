import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        playground: resolve(process.cwd(), "index.html"),
        demos: resolve(process.cwd(), "demos/index.html"),
        absoluteToFlow: resolve(process.cwd(), "demos/absolute-to-flow.html"),
        composedAnimations: resolve(process.cwd(), "demos/composed-animations.html"),
        geometry: resolve(process.cwd(), "demos/geometry.html"),
        layoutEffects: resolve(process.cwd(), "demos/layout-effects.html"),
        depthStacking: resolve(process.cwd(), "demos/depth-stacking.html"),
        transforms3d: resolve(process.cwd(), "demos/3d-transforms.html")
      }
    }
  }
});
