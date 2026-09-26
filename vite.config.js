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
        transforms3d: resolve(process.cwd(), "demos/3d-transforms.html"),
        easingCurves: resolve(process.cwd(), "demos/easing-curves.html"),
        speed: resolve(process.cwd(), "demos/speed.html"),
        blurFocus: resolve(process.cwd(), "demos/blur-focus.html"),
        size: resolve(process.cwd(), "demos/size.html"),
        rotation: resolve(process.cwd(), "demos/rotation.html"),
        absoluteToAbsolute: resolve(process.cwd(), "demos/absolute-to-absolute.html"),
        alignment: resolve(process.cwd(), "demos/alignment.html"),
        spacing: resolve(process.cwd(), "demos/spacing.html"),
        cubeSpin: resolve(process.cwd(), "demos/cube-spin.html"),
        parallax: resolve(process.cwd(), "demos/parallax.html"),
        coverFlow: resolve(process.cwd(), "demos/cover-flow.html"),
        staggerFollow: resolve(process.cwd(), "demos/stagger-follow.html"),
        revealCollapse: resolve(process.cwd(), "demos/reveal-collapse.html"),
        responsivePlacement: resolve(process.cwd(), "demos/responsive-placement.html"),
        reducedMotion: resolve(process.cwd(), "demos/reduced-motion.html")
      }
    }
  }
});
