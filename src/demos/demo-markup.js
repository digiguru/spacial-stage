const snippets = {
  "absolute-to-flow": {
    note: "Framework-backed. The browser measures the real inline destination; application code only describes placement intent.",
    html: `<section id="stage">
  <article>
    <h2>Title</h2>
    <p>First paragraph…</p>

    <div id="slot"></div>

    <p>Second paragraph…</p>
  </article>

  <div id="visual">
    <svg viewBox="0 0 320 320">…</svg>
  </div>
</section>`,
    js: `import { createPlacementController } from "@digiguru/spacial-stage";

const placement = createPlacementController(
  document.querySelector("#visual"),
  {
    initial: "background",
    duration: 1800,
    placements: {
      background: {
        type: "absolute",
        container: document.querySelector("#stage"),
        sizeFrom: "inline",
        scale: 3,
        anchorX: "left",
        anchorY: "top",
        offsetX: { value: -0.62, relativeTo: "self" },
        rotateZ: -90
      },
      inline: {
        type: "flow",
        slot: document.querySelector("#slot"),
        align: "center",
        collapsedHeight: 24,
        gapBefore: 24,
        gapAfter: 24,
        style: {
          width: "clamp(220px, 62%, 360px)",
          aspectRatio: "1 / 1"
        }
      }
    }
  }
);

await placement.transition("inline");`
  },

  "composed-animations": {
    note: "Framework concept: animations are a set, so Slide/Fade/Reveal/Focus/Collapse can be combined.",
    html: `<div id="stage">
  <div id="card">
    <h3>Readable content</h3>
    <p>The same text arrives through different composed effects.</p>
  </div>
</div>`,
    js: `import {
  animateBetweenStates,
  normaliseSpec
} from "@digiguru/spacial-stage";

const from = normaliseSpec({
  horizontalAnchor: "left",
  positionX: -160,
  depth: "blur"
});

const to = normaliseSpec({
  animations: ["slide", "fade"],
  horizontalAnchor: "center",
  depth: "focus",
  duration: 900
});

await animateBetweenStates(card, stage, from, to);`
  },

  geometry: {
    note: "Framework-backed destination geometry: position, size, scale and rotation live in state.",
    html: `<div id="stage">
  <div id="object">
    <h3>Destination geometry</h3>
    <p>Text stays attached while the card moves and resizes.</p>
  </div>
</div>`,
    js: `import {
  animateBetweenStates,
  normaliseSpec
} from "@digiguru/spacial-stage";

const a = normaliseSpec({
  animations: ["slide"],
  horizontalAnchor: "left",
  verticalAnchor: "top",
  positionX: 24,
  positionY: 24,
  sizeMode: "absolute",
  sizeWidth: 180,
  sizeHeight: 180,
  rotateZ: -12
});

const b = normaliseSpec({
  ...a,
  horizontalAnchor: "right",
  verticalAnchor: "bottom",
  positionX: -24,
  positionY: -24,
  sizeWidth: 300,
  sizeHeight: 180,
  rotateZ: 24
});

await animateBetweenStates(object, stage, a, b);`
  },

  "layout-effects": {
    note: "Layout effect is separate from the object's own animation. This example shows Push.",
    html: `<div id="stage">
  <aside id="panel"></aside>
  <main id="content">Neighbouring content</main>
</div>`,
    js: `import {
  animateBetweenStates,
  layoutCompanionFrames,
  normaliseSpec
} from "@digiguru/spacial-stage";

const panelState = normaliseSpec({
  animations: ["slide", "fade"],
  layout: "push",
  direction: "left",
  distance: 180
});

content.animate(
  layoutCompanionFrames(panelState),
  { duration: panelState.duration, easing: panelState.easing }
);

await animateBetweenStates(panel, stage, {}, panelState);`
  },

  "depth-stacking": {
    note: "Depth controls visual softness; z-index remains an explicit, independent destination property.",
    html: `<div id="stage">
  <div id="back"><p>Lower stack</p></div>
  <div id="front"><p>Higher stack</p></div>
</div>`,
    js: `import {
  destinationFrame,
  normaliseSpec
} from "@digiguru/spacial-stage";

const recessed = normaliseSpec({
  depth: "blur",
  zIndex: 20
});

const sharp = normaliseSpec({
  depth: "focus",
  zIndex: 1
});

Object.assign(back.style, destinationFrame(back, stage, recessed));
Object.assign(front.style, destinationFrame(front, stage, sharp));`
  },

  "3d-transforms": {
    note: "Framework-backed single-plane 3D transforms.",
    html: `<div id="stage">
  <div id="card">
    <h3>Readable in 3D</h3>
    <p>Perspective affects the complete component.</p>
  </div>
</div>`,
    js: `import {
  animateBetweenStates,
  normaliseSpec
} from "@digiguru/spacial-stage";

const front = normaliseSpec({
  animations: ["slide"],
  rotateX: 0,
  rotateY: 0,
  translateZ: 0,
  perspective: 850
});

const tilted = normaliseSpec({
  ...front,
  rotateX: -18,
  rotateY: 32,
  rotateZ: 7,
  translateZ: 110,
  perspective: 650
});

await animateBetweenStates(card, stage, front, tilted);`
  },

  "easing-curves": {
    note: "Browser Web Animations demo. Only easing changes; duration and distance stay constant.",
    html: `<div class="track">
  <div class="runner"></div>
</div>`,
    css: `.track { position: relative; }
.runner { position: absolute; left: 0; }`,
    js: `runner.animate(
  [
    { transform: "translateX(0)" },
    { transform: "translateX(400px)" }
  ],
  {
    duration: 1800,
    easing: "cubic-bezier(.2,.82,.24,1)",
    fill: "both"
  }
);`
  },

  speed: {
    note: "Browser Web Animations demo. Path and easing stay fixed; only duration changes.",
    html: `<div class="track">
  <div class="runner"></div>
</div>`,
    js: `runner.animate(
  [
    { transform: "translateX(0)" },
    { transform: "translateX(400px)" }
  ],
  {
    duration: 500, // try 250 / 500 / 1000 / 2000
    easing: "cubic-bezier(.2,.82,.24,1)",
    fill: "both"
  }
);`
  },

  "blur-focus": {
    note: "Framework-backed depth destinations.",
    html: `<div id="stage">
  <div id="object">
    <h3>Primary idea</h3>
    <p>The text becomes soft or sharp with the card.</p>
  </div>
</div>`,
    js: `import {
  animateBetweenStates,
  normaliseSpec
} from "@digiguru/spacial-stage";

const blurred = normaliseSpec({
  animations: ["focus"],
  depth: "blur"
});

const focused = normaliseSpec({
  ...blurred,
  depth: "focus"
});

await animateBetweenStates(object, stage, blurred, focused);`
  },

  size: {
    note: "Framework-backed real width/height interpolation — not just transform scale.",
    html: `<div id="stage">
  <div id="object">
    <h3>Real geometry</h3>
    <p>Text gains room as width and height grow.</p>
  </div>
</div>`,
    js: `import {
  animateBetweenStates,
  normaliseSpec
} from "@digiguru/spacial-stage";

const small = normaliseSpec({
  animations: ["slide"],
  sizeMode: "absolute",
  sizeWidth: 110,
  sizeHeight: 110
});

const large = normaliseSpec({
  ...small,
  sizeWidth: 300,
  sizeHeight: 170
});

await animateBetweenStates(object, stage, small, large);`
  },

  rotation: {
    note: "Framework-backed Rotate Z destination geometry.",
    html: `<div id="stage">
  <div id="object">
    <strong>TOP ↑</strong>
    <p>The type rotates with its surface.</p>
  </div>
</div>`,
    js: `import {
  animateBetweenStates,
  normaliseSpec
} from "@digiguru/spacial-stage";

const from = normaliseSpec({
  animations: ["slide"],
  rotateZ: -90
});

const to = normaliseSpec({
  ...from,
  rotateZ: 270
});

await animateBetweenStates(object, stage, from, to);`
  },

  "absolute-to-absolute": {
    note: "Framework-backed stage-space transition between two absolute destinations.",
    html: `<div id="stage">
  <div id="object">
    <h3>Persistent card</h3>
    <p>Same content, new absolute destination.</p>
  </div>
</div>`,
    js: `import {
  animateBetweenStates,
  normaliseSpec
} from "@digiguru/spacial-stage";

const a = normaliseSpec({
  animations: ["slide"],
  horizontalAnchor: "left",
  verticalAnchor: "top",
  positionX: 28,
  positionY: 28
});

const b = normaliseSpec({
  ...a,
  horizontalAnchor: "right",
  verticalAnchor: "bottom",
  positionX: -28,
  positionY: -28
});

await animateBetweenStates(object, stage, a, b);`
  },

  alignment: {
    note: "Framework-backed edge anchors. Change the anchor pair rather than calculating pixel coordinates.",
    html: `<div id="stage">
  <div id="object">
    <h3>Anchored</h3>
    <p>Text moves with the aligned card.</p>
  </div>
</div>`,
    js: `import {
  animateBetweenStates,
  normaliseSpec
} from "@digiguru/spacial-stage";

const top = normaliseSpec({
  animations: ["slide"],
  horizontalAnchor: "center",
  verticalAnchor: "top",
  positionY: 28
});

const right = normaliseSpec({
  ...top,
  horizontalAnchor: "right",
  verticalAnchor: "center",
  positionX: -28,
  positionY: 0
});

await animateBetweenStates(object, stage, top, right);

// Repeat with bottom + left destinations.`
  },

  spacing: {
    note: "Browser layout demo. Padding changes internal box geometry; margin changes surrounding space.",
    html: `<div class="box">
  <div id="inner">content</div>
</div>
<div class="sibling">Sibling</div>`,
    js: `// Padding
box.animate(
  [{ padding: "8px" }, { padding: "56px 28px" }],
  { duration: 1800, fill: "both" }
);

// Margin
inner.animate(
  [{ margin: "8px" }, { margin: "56px 28px" }],
  { duration: 1800, fill: "both" }
);`
  },

  "cube-spin": {
    note: "Experimental browser 3D. This is a useful target for a future group/layer abstraction.",
    html: `<div class="scene">
  <div class="cube">
    <div class="face front">front</div>
    <div class="face back">back</div>
    <div class="face right">right</div>
    <div class="face left">left</div>
    <div class="face top">top</div>
    <div class="face bottom">bottom</div>
  </div>
</div>`,
    css: `.scene { perspective: 800px; }
.cube {
  width: 140px;
  height: 140px;
  position: relative;
  transform-style: preserve-3d;
}
.face { position: absolute; inset: 0; }
.front  { transform: translateZ(70px); }
.back   { transform: rotateY(180deg) translateZ(70px); }
.right  { transform: rotateY(90deg) translateZ(70px); }
.left   { transform: rotateY(-90deg) translateZ(70px); }
.top    { transform: rotateX(90deg) translateZ(70px); }
.bottom { transform: rotateX(-90deg) translateZ(70px); }`,
    js: `cube.animate(
  [
    { transform: "rotateX(-18deg) rotateY(-25deg)" },
    { transform: "rotateX(342deg) rotateY(695deg) rotateZ(180deg)" }
  ],
  { duration: 3600, easing: "cubic-bezier(.22,.75,.18,1)" }
);`
  },

  parallax: {
    note: "Experimental browser 3D. Each layer responds by a different depth multiplier.",
    html: `<div id="scene">
  <div class="layer back"></div>
  <div class="layer middle"></div>
  <div class="layer front">FOCUS</div>
</div>`,
    css: `#scene { perspective: 900px; }
.layer {
  position: absolute;
  left: 50%;
  top: 50%;
  transform-style: preserve-3d;
}`,
    js: `scene.addEventListener("pointermove", (event) => {
  const rect = scene.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
  const y = ((event.clientY - rect.top) / rect.height - .5) * 2;

  layers.forEach((layer, index) => {
    const depth = [18, 34, 58][index];

    layer.style.transform =
      \`translate(-50%, -50%)
       translate3d(\${x * depth}px, \${y * depth}px, \${index * 55}px)
       rotateX(\${-y * 8}deg)
       rotateY(\${x * 10}deg)\`;
  });
});`
  },

  "cover-flow": {
    note: "Experimental browser 3D inspired by classic iTunes Cover Flow.",
    html: `<div class="scene">
  <div class="coverflow">
    <div class="cover">One</div>
    <div class="cover">Two</div>
    <div class="cover active">Three</div>
    <div class="cover">Four</div>
    <div class="cover">Five</div>
  </div>
</div>`,
    css: `.scene { perspective: 1000px; }
.coverflow { transform-style: preserve-3d; }
.cover {
  position: absolute;
  left: 50%;
  transform-style: preserve-3d;
}`,
    js: `covers.forEach((cover, index) => {
  const delta = index - activeIndex;
  const distance = Math.abs(delta);

  cover.style.transform =
    \`translate3d(\${delta * 118}px, \${distance * 8}px, \${distance ? -distance * 75 : 120}px)
     rotateY(\${delta < 0 ? 58 : delta > 0 ? -58 : 0}deg)
     scale(\${distance ? .86 : 1.08})\`;
});`
  },

  "stagger-follow": {
    note: "Collection coordination. The same keyframes are reused with an increasing delay.",
    html: `<div id="cards">
  <article class="card"><h3>Discover</h3><p>First idea.</p></article>
  <article class="card"><h3>Shape</h3><p>Second idea.</p></article>
  <article class="card"><h3>Build</h3><p>Third idea.</p></article>
  <article class="card"><h3>Ship</h3><p>Fourth idea.</p></article>
</div>`,
    js: `document.querySelectorAll(".card").forEach((card, index) => {
  card.animate(
    [
      { transform: "translateY(70px)", opacity: 0 },
      { transform: "translateY(0)", opacity: 1 }
    ],
    {
      duration: 760,
      delay: index * 120,
      easing: "cubic-bezier(.2,.82,.24,1)",
      fill: "both"
    }
  );
});`
  },

  "reveal-collapse": {
    note: "Two independent effects: Reveal uses clipping; Collapse uses directional compression.",
    html: `<div id="reveal">
  <h3>Keep the words intact.</h3>
  <p>Reveal clips an unchanged card and its text.</p>
</div>
<div id="collapse">
  <h3>Compress the whole card.</h3>
  <p>Collapse squashes the content with the geometry.</p>
</div>`,
    js: `reveal.animate(
  [
    { clipPath: "inset(0 100% 0 0)" },
    { clipPath: "inset(0 0 0 0)" }
  ],
  { duration: 1500, fill: "both" }
);

collapse.animate(
  [
    { transform: "scaleX(.08)", transformOrigin: "left center" },
    { transform: "scaleX(1)", transformOrigin: "left center" }
  ],
  { duration: 1500, fill: "both" }
);`
  },

  "responsive-placement": {
    note: "Framework-backed responsive geometry: values are percentages of the current containing block.",
    html: `<div id="frame">
  <div id="object">
    <h3>24% card</h3>
    <p>Text stays inside responsive geometry.</p>
  </div>
</div>`,
    js: `import {
  animateBetweenStates,
  normaliseSpec
} from "@digiguru/spacial-stage";

const a = normaliseSpec({
  animations: ["slide"],
  horizontalAnchor: "left",
  verticalAnchor: "top",
  positionMode: "percent",
  positionX: 6,
  positionY: 8,
  sizeMode: "percent",
  sizeWidth: 24,
  sizeHeight: 24
});

const b = normaliseSpec({
  ...a,
  horizontalAnchor: "right",
  verticalAnchor: "bottom",
  positionX: -6,
  positionY: -8
});

await animateBetweenStates(object, frame, a, b);`
  },

  "reduced-motion": {
    note: "Same semantic destination, different presentation outcome.",
    html: `<div id="object">
  <strong>Same destination</strong>
</div>`,
    js: `import {
  animateBetweenStates,
  destinationFrame,
  normaliseSpec,
  prefersReducedMotion
} from "@digiguru/spacial-stage";

const from = normaliseSpec({ positionX: -110 });
const to = normaliseSpec({
  animations: ["slide"],
  positionX: 110
});

if (prefersReducedMotion()) {
  Object.assign(object.style, destinationFrame(object, stage, to));
} else {
  await animateBetweenStates(object, stage, from, to);
}`
  }
};

const path = location.pathname.split("/").pop()?.replace(/\.html$/, "") || "";
const snippet = snippets[path];

if (snippet) {
  const main = document.querySelector("main");

  if (main) {
    const section = document.createElement("section");
    section.className = "demo-code-reference";

    const details = document.createElement("details");
    details.className = "demo-code-details";
    details.open = true;

    const summary = document.createElement("summary");
    summary.textContent = "Markup required";
    details.append(summary);

    const intro = document.createElement("p");
    intro.className = "demo-code-note";
    intro.textContent = snippet.note;
    details.append(intro);

    const grid = document.createElement("div");
    grid.className = "demo-code-grid";

    [
      ["HTML", snippet.html],
      ["JavaScript", snippet.js],
      ["CSS", snippet.css]
    ]
      .filter(([, source]) => source)
      .forEach(([label, source]) => {
        const article = document.createElement("article");
        article.className = "demo-code-block";

        const header = document.createElement("div");
        header.className = "demo-code-header";

        const heading = document.createElement("h3");
        heading.textContent = label;

        const copy = document.createElement("button");
        copy.className = "demo-code-copy";
        copy.type = "button";
        copy.textContent = "Copy";

        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.textContent = source.trim();
        pre.append(code);

        copy.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(source.trim());
            copy.textContent = "Copied";
            setTimeout(() => {
              copy.textContent = "Copy";
            }, 1200);
          } catch {
            copy.textContent = "Select code";
          }
        });

        header.append(heading, copy);
        article.append(header, pre);
        grid.append(article);
      });

    details.append(grid);
    section.append(details);
    main.append(section);
  }
}
