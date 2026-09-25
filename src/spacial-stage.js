export const DIRECTIONS = Object.freeze({
  top: Object.freeze({ x: 0, y: -1 }),
  right: Object.freeze({ x: 1, y: 0 }),
  bottom: Object.freeze({ x: 0, y: 1 }),
  left: Object.freeze({ x: -1, y: 0 })
});

export const DEPTHS = Object.freeze({
  blur: Object.freeze({ blur: 12, opacity: 0.34, saturation: 0.82 }),
  focus: Object.freeze({ blur: 0, opacity: 1, saturation: 1 })
});

export const ANIMATIONS = Object.freeze([
  "slide",
  "fade",
  "reveal",
  "focus",
  "collapse"
]);

export const DEFAULT_SPEC = Object.freeze({
  role: "content",
  animations: Object.freeze(["slide"]),
  transition: "slide",
  layout: "overlay",
  attachment: "free",
  coordination: "none",
  depth: "focus",
  direction: "auto",
  horizontalAnchor: "center",
  verticalAnchor: "center",
  positionMode: "absolute",
  positionX: 0,
  positionY: 0,
  sizeMode: "natural",
  sizeWidth: 0,
  sizeHeight: 0,
  distance: 180,
  duration: 700,
  stagger: 80,
  blur: 0,
  scale: 1,
  opacity: 1,
  zIndex: 10,
  easing: "cubic-bezier(.2,.82,.24,1)",
  customVector: Object.freeze({ x: -1, y: 0 }),
  customCss: ""
});

const AUTO_DIRECTIONS = Object.freeze({
  shared: "right",
  panel: "left",
  content: "bottom",
  collection: "bottom",
  custom: "left"
});

export function normaliseSpec(input = {}) {
  const customVector = {
    ...DEFAULT_SPEC.customVector,
    ...(input.customVector || {})
  };
  const animations = normaliseAnimations(input);

  return {
    ...DEFAULT_SPEC,
    ...input,
    animations,
    transition: animations[0] || "none",
    depth: normaliseDepth(input.depth),
    horizontalAnchor: normaliseHorizontalAnchor(input.horizontalAnchor),
    verticalAnchor: normaliseVerticalAnchor(input.verticalAnchor),
    positionMode: input.positionMode === "percent" ? "percent" : "absolute",
    positionX: finiteNumber(input.positionX, finiteNumber(input.offsetX, DEFAULT_SPEC.positionX)),
    positionY: finiteNumber(input.positionY, finiteNumber(input.offsetY, DEFAULT_SPEC.positionY)),
    sizeMode: normaliseSizeMode(input.sizeMode),
    sizeWidth: finiteNumber(input.sizeWidth, DEFAULT_SPEC.sizeWidth),
    sizeHeight: finiteNumber(input.sizeHeight, DEFAULT_SPEC.sizeHeight),
    distance: finiteNumber(input.distance, DEFAULT_SPEC.distance),
    duration: finiteNumber(input.duration, DEFAULT_SPEC.duration),
    stagger: finiteNumber(input.stagger, DEFAULT_SPEC.stagger),
    blur: finiteNumber(input.blur, DEFAULT_SPEC.blur),
    scale: finiteNumber(input.scale, DEFAULT_SPEC.scale),
    opacity: finiteNumber(input.opacity, DEFAULT_SPEC.opacity),
    zIndex: finiteNumber(input.zIndex, legacyDepthZIndex(input.depth)),
    easing: input.easing || DEFAULT_SPEC.easing,
    customCss: input.customCss || "",
    customVector: {
      x: finiteNumber(customVector.x, -1),
      y: finiteNumber(customVector.y, 0)
    }
  };
}

export function resolveDirection(specInput = {}) {
  const spec = normaliseSpec(specInput);

  if (spec.direction === "custom") {
    return normaliseVector(spec.customVector);
  }

  const named = spec.direction === "auto"
    ? AUTO_DIRECTIONS[spec.role] || "left"
    : spec.direction;

  return DIRECTIONS[named] || DIRECTIONS.left;
}

export function resolvedDirectionName(specInput = {}) {
  const spec = normaliseSpec(specInput);

  if (spec.direction === "custom") {
    const vector = resolveDirection(spec);
    if (Math.abs(vector.x) >= Math.abs(vector.y)) return vector.x >= 0 ? "right" : "left";
    return vector.y >= 0 ? "bottom" : "top";
  }

  return spec.direction === "auto"
    ? AUTO_DIRECTIONS[spec.role] || "left"
    : (DIRECTIONS[spec.direction] ? spec.direction : "left");
}

export function resolveDepth(specInput = {}) {
  const spec = normaliseSpec(specInput);
  const preset = DEPTHS[spec.depth] || DEPTHS.focus;

  return {
    blur: Math.max(0, preset.blur + spec.blur),
    opacity: clamp(preset.opacity * spec.opacity, 0, 1),
    saturation: clamp(preset.saturation, 0, 1)
  };
}

export function captureNaturalSize(element) {
  if (!element) return { width: 0, height: 0 };

  const width = element.offsetWidth || 0;
  const height = element.offsetHeight || 0;

  if (element.dataset) {
    element.dataset.stageNaturalWidth = String(width);
    element.dataset.stageNaturalHeight = String(height);
  }

  return { width, height };
}

export function resolveSize(element, container, specInput = {}) {
  const spec = normaliseSpec(specInput);
  const stageWidth = container?.clientWidth || 0;
  const stageHeight = container?.clientHeight || 0;
  const naturalWidth = finiteNumber(
    element?.dataset?.stageNaturalWidth,
    element?.offsetWidth || 0
  );
  const naturalHeight = finiteNumber(
    element?.dataset?.stageNaturalHeight,
    element?.offsetHeight || 0
  );

  if (spec.sizeMode === "percent") {
    return {
      width: Math.max(1, stageWidth * (spec.sizeWidth / 100)),
      height: Math.max(1, stageHeight * (spec.sizeHeight / 100))
    };
  }

  if (spec.sizeMode === "absolute") {
    return {
      width: Math.max(1, spec.sizeWidth || naturalWidth),
      height: Math.max(1, spec.sizeHeight || naturalHeight)
    };
  }

  return {
    width: Math.max(1, naturalWidth),
    height: Math.max(1, naturalHeight)
  };
}

export function sizeValuesForDimensions(
  element,
  container,
  specInput = {},
  { width = 0, height = 0 } = {}
) {
  const spec = normaliseSpec(specInput);
  const stageWidth = container?.clientWidth || 0;
  const stageHeight = container?.clientHeight || 0;

  if (spec.sizeMode === "percent") {
    return {
      sizeWidth: stageWidth ? (width / stageWidth) * 100 : 0,
      sizeHeight: stageHeight ? (height / stageHeight) * 100 : 0
    };
  }

  return {
    sizeWidth: width,
    sizeHeight: height
  };
}

export function resolvePosition(element, container, specInput = {}) {
  const spec = normaliseSpec(specInput);
  const size = resolveSize(element, container, spec);
  const metrics = {
    ...elementMetrics(element, container),
    elementWidth: size.width,
    elementHeight: size.height
  };
  const offsets = positionOffsets(metrics, spec);
  const base = anchoredTarget(metrics, spec, offsets);

  return {
    x: base.left - metrics.elementLeft,
    y: base.top - metrics.elementTop,
    rotation: spec.attachment === "float" ? -0.6 : 0
  };
}

export function positionValuesForCoordinates(
  element,
  container,
  specInput = {},
  { left = 0, top = 0 } = {}
) {
  const spec = normaliseSpec(specInput);
  const size = resolveSize(element, container, spec);
  const metrics = {
    ...elementMetrics(element, container),
    elementWidth: size.width,
    elementHeight: size.height
  };
  const zeroOffsets = { x: 0, y: 0 };
  const base = anchoredTarget(metrics, spec, zeroOffsets);

  const xPixels = left - base.left;
  const yPixels = top - base.top;

  if (spec.positionMode === "percent") {
    return {
      positionX: metrics.stageWidth ? (xPixels / metrics.stageWidth) * 100 : 0,
      positionY: metrics.stageHeight ? (yPixels / metrics.stageHeight) * 100 : 0
    };
  }

  return {
    positionX: xPixels,
    positionY: yPixels
  };
}

export function destinationFrame(element, container, specInput = {}) {
  const spec = normaliseSpec(specInput);
  const depth = resolveDepth(spec);
  const position = resolvePosition(element, container, spec);
  const size = resolveSize(element, container, spec);

  const frame = {
    width: `${trimNumber(size.width)}px`,
    height: `${trimNumber(size.height)}px`,
    minWidth: "0px",
    minHeight: "0px",
    transform: transform({
      x: position.x,
      y: position.y,
      scale: Math.max(0.05, spec.scale),
      rotation: position.rotation
    }),
    opacity: String(depth.opacity),
    filter: `blur(${depth.blur}px) saturate(${depth.saturation})`,
    clipPath: "inset(0% 0% 0% 0%)",
    zIndex: String(spec.zIndex)
  };

  return {
    ...frame,
    ...parseCustomCss(spec.customCss)
  };
}

export function transitionFrames(element, container, fromSpecInput, toSpecInput) {
  const fromSpec = normaliseSpec(fromSpecInput);
  const toSpec = normaliseSpec(toSpecInput);
  const from = destinationFrame(element, container, fromSpec);
  const to = destinationFrame(element, container, toSpec);
  const effects = new Set(toSpec.animations);

  if (!effects.size) {
    return [to];
  }

  const start = { ...to };
  const direction = resolvedDirectionName(toSpec);

  if (effects.has("slide")) {
    start.width = from.width;
    start.height = from.height;
    start.transform = from.transform;
  }

  if (effects.has("fade")) {
    start.opacity = "0";
  }

  if (effects.has("reveal")) {
    start.clipPath = revealClip(direction);
  }

  if (effects.has("focus")) {
    start.filter = `blur(${Math.max(resolveDepth(toSpec).blur + 12, 12)}px) saturate(.82)`;
    start.transform = `${start.transform} scale(.94)`;
  }

  if (effects.has("collapse")) {
    start.transform = collapseTransform(start.transform, direction);
    start.clipPath = revealClip(direction);
  }

  return [start, to];
}

export async function animateBetweenStates(
  element,
  container,
  fromSpec,
  toSpec,
  {
    delay = 0,
    reducedMotion = prefersReducedMotion()
  } = {}
) {
  if (!element) return null;

  const target = destinationFrame(element, container, toSpec);
  const spec = normaliseSpec(toSpec);

  if (
    reducedMotion
    || typeof element.animate !== "function"
    || spec.animations.length === 0
  ) {
    applyFrame(element, target);
    return null;
  }

  const frames = transitionFrames(element, container, fromSpec, toSpec);
  const animation = element.animate(frames, {
    duration: spec.duration,
    delay,
    easing: spec.easing,
    fill: "forwards"
  });

  let completed = false;

  try {
    await animation.finished;
    completed = true;
  } catch {
    completed = false;
  }

  if (completed) {
    animation.cancel();
    applyFrame(element, target);
  }

  return animation;
}

export function layoutCompanionFrames(specInput = {}) {
  const spec = normaliseSpec(specInput);
  const vector = resolveDirection(spec);
  const amount = Math.min(Math.max(spec.distance * 0.34, 44), 150);

  if (spec.layout === "push") {
    return [
      { transform: "translate3d(0px, 0px, 0)", opacity: 1, filter: "blur(0px)" },
      {
        transform: `translate3d(${-vector.x * amount}px, ${-vector.y * amount}px, 0)`,
        opacity: 1,
        filter: "blur(0px)"
      },
      { transform: "translate3d(0px, 0px, 0)", opacity: 1, filter: "blur(0px)" }
    ];
  }

  if (spec.layout === "replace") {
    const shift = Math.min(amount, 72);
    return [
      { transform: "translate3d(0px, 0px, 0) scale(1)", opacity: 1, filter: "blur(0px)" },
      {
        transform: `translate3d(${-vector.x * shift}px, ${-vector.y * shift}px, 0) scale(.97)`,
        opacity: 0.08,
        filter: "blur(8px)"
      },
      { transform: "translate3d(0px, 0px, 0) scale(1)", opacity: 1, filter: "blur(0px)" }
    ];
  }

  if (spec.layout === "reflow") {
    const shift = Math.min(amount, 96);
    return [
      { transform: "translate3d(0px, 0px, 0) scale(1)", opacity: 1 },
      {
        transform: `translate3d(${-vector.x * shift}px, ${-vector.y * shift}px, 0) scale(.92)`,
        opacity: 0.68
      },
      { transform: "translate3d(0px, 0px, 0) scale(1)", opacity: 1 }
    ];
  }

  return null;
}

export const buildLayoutFrames = layoutCompanionFrames;

export function applyFrame(element, frame) {
  if (!element || !frame) return;

  Object.entries(frame).forEach(([property, value]) => {
    if (value === undefined || value === null) return;
    element.style[property] = String(value);
  });
}

export function clearFrame(element) {
  if (!element) return;
  element.removeAttribute("style");
}

export function cssForElement({
  selector = "[data-stage-object]",
  stateName = "state",
  spec: specInput = {},
  frame = null
} = {}) {
  const spec = normaliseSpec(specInput);
  const depth = resolveDepth(spec);
  const positionUnit = spec.positionMode === "percent" ? "%" : "px";
  const sizeUnit = spec.sizeMode === "percent" ? "%" : "px";
  const lines = [
    `${selector}[data-stage-state="${cssEscape(stateName)}"] {`,
    `  --stage-animations: ${spec.animations.length ? spec.animations.join(" ") : "none"};`,
    `  --stage-layout: ${spec.layout};`,
    `  --stage-attachment: ${spec.attachment};`,
    `  --stage-coordination: ${spec.coordination};`,
    `  --stage-depth: ${spec.depth};`,
    `  --stage-direction: ${spec.direction};`,
    `  --stage-anchor-x: ${spec.horizontalAnchor};`,
    `  --stage-anchor-y: ${spec.verticalAnchor};`,
    `  --stage-position-mode: ${spec.positionMode};`,
    `  --stage-position-x: ${trimNumber(spec.positionX)}${positionUnit};`,
    `  --stage-position-y: ${trimNumber(spec.positionY)}${positionUnit};`,
    `  --stage-size-mode: ${spec.sizeMode};`,
    `  --stage-size-width: ${spec.sizeMode === "natural" ? "auto" : trimNumber(spec.sizeWidth) + sizeUnit};`,
    `  --stage-size-height: ${spec.sizeMode === "natural" ? "auto" : trimNumber(spec.sizeHeight) + sizeUnit};`,
    `  --stage-distance: ${spec.distance}px;`,
    `  --stage-duration: ${spec.duration}ms;`,
    `  --stage-stagger: ${spec.stagger}ms;`,
    `  --stage-blur: ${depth.blur}px;`,
    `  --stage-softening: ${trimNumber(depth.saturation)};`,
    `  --stage-scale: ${trimNumber(spec.scale)};`,
    `  --stage-opacity: ${trimNumber(depth.opacity)};`,
    `  --stage-z-index: ${trimNumber(spec.zIndex)};`,
    `  z-index: var(--stage-z-index);`
  ];

  if (frame) {
    lines.push(
      `  width: ${frame.width};`,
      `  height: ${frame.height};`,
      `  transform: ${frame.transform};`,
      `  filter: ${frame.filter};`,
      `  opacity: ${frame.opacity};`
    );
  } else {
    lines.push(
      "  filter: blur(var(--stage-blur)) saturate(var(--stage-softening));",
      "  opacity: var(--stage-opacity);"
    );
  }

  if (spec.customCss.trim()) {
    lines.push("  /* custom CSS */");
    spec.customCss
      .split(";")
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => lines.push(`  ${line};`));
  }

  lines.push("}");
  return lines.join("\n");
}

export function cssForParent({
  stageSelector = "[data-stage]",
  objectSelector = "[data-stage-object]",
  spec: specInput = {}
} = {}) {
  const spec = normaliseSpec(specInput);
  const lines = [
    `${stageSelector} {`,
    "  position: relative;",
    "  overflow: hidden;",
    "  isolation: isolate;",
    "}"
  ];

  lines.push(
    "",
    "/* Anchored position is resolved against the stage containing block. */",
    `${stageSelector} ${objectSelector} {`,
    "  position: absolute;",
    "}"
  );

  if (spec.attachment === "dock") {
    lines.push(
      "",
      `/* Dock additionally snaps one axis to the ${resolvedDirectionName(spec)} edge. */`
    );
  }

  if (spec.layout !== "overlay") {
    const vector = resolveDirection(spec);
    const amount = Math.min(Math.max(spec.distance * 0.34, 44), 150);

    lines.push("", `/* Layout effect: ${spec.layout}. */`);

    if (spec.layout === "push") {
      lines.push(
        `${stageSelector}[data-transitioning] > [data-stage-content] {`,
        `  --stage-layout-x: ${trimNumber(-vector.x * amount)}px;`,
        `  --stage-layout-y: ${trimNumber(-vector.y * amount)}px;`,
        "  transform: translate3d(var(--stage-layout-x), var(--stage-layout-y), 0);",
        "}"
      );
    } else if (spec.layout === "replace") {
      lines.push(
        `${stageSelector}[data-transitioning] > [data-stage-content] {`,
        "  opacity: 0;",
        "  filter: blur(8px);",
        "}"
      );
    } else if (spec.layout === "reflow") {
      lines.push(
        `${stageSelector}[data-transitioning] > [data-stage-content] {`,
        "  transform: scale(.92);",
        "  opacity: .68;",
        "}"
      );
    } else {
      lines.push("/* Custom layout effect: provide parent/container rules here. */");
    }
  }

  if (spec.coordination === "stagger") {
    lines.push(
      "",
      "/* Children opt into an index so one state can stagger a collection. */",
      `${objectSelector} > * {`,
      `  transition-delay: calc(var(--stage-index, 0) * ${spec.stagger}ms);`,
      "}"
    );
  }

  if (spec.coordination === "follow") {
    lines.push(
      "",
      "/* Followers reuse the leader's destination with a delayed hand-off. */",
      "[data-stage-follow] {",
      `  transition-delay: calc(var(--stage-follow-index, 1) * ${spec.stagger}ms);`,
      "}"
    );
  }

  if (spec.coordination === "swap") {
    lines.push(
      "",
      "/* Swap needs both participants to share a containing block. */",
      "[data-stage-swap-group] {",
      "  position: relative;",
      "}"
    );
  }

  return lines.join("\n");
}

export function motionMarkup(specInput = {}) {
  const spec = normaliseSpec(specInput);

  return [
    `data-stage-animations="${spec.animations.join(" ")}"`,
    `data-stage-layout="${spec.layout}"`,
    `data-stage-attachment="${spec.attachment}"`,
    `data-stage-coordination="${spec.coordination}"`,
    `data-stage-depth="${spec.depth}"`,
    `data-stage-z-index="${spec.zIndex}"`,
    `data-stage-direction="${spec.direction}"`,
    `data-stage-anchor-x="${spec.horizontalAnchor}"`,
    `data-stage-anchor-y="${spec.verticalAnchor}"`,
    `data-stage-position-mode="${spec.positionMode}"`,
    `data-stage-size-mode="${spec.sizeMode}"`
  ].join("\n");
}

export function prefersReducedMotion(win = globalThis.window) {
  return Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

function elementMetrics(element, container) {
  return {
    stageWidth: container?.clientWidth || 0,
    stageHeight: container?.clientHeight || 0,
    elementWidth: element?.offsetWidth || 0,
    elementHeight: element?.offsetHeight || 0,
    elementLeft: element?.offsetLeft || 0,
    elementTop: element?.offsetTop || 0
  };
}

function positionOffsets(metrics, spec) {
  if (spec.positionMode === "percent") {
    return {
      x: metrics.stageWidth * (spec.positionX / 100),
      y: metrics.stageHeight * (spec.positionY / 100)
    };
  }

  return {
    x: spec.positionX,
    y: spec.positionY
  };
}

function anchoredTarget(metrics, spec, offsets) {
  let left = horizontalAnchorLeft(metrics, spec.horizontalAnchor) + offsets.x;
  let top = verticalAnchorTop(metrics, spec.verticalAnchor) + offsets.y;

  if (spec.attachment === "dock") {
    const gutter = 22;
    const direction = resolvedDirectionName(spec);

    if (direction === "left") left = gutter + offsets.x;
    if (direction === "right") {
      left = metrics.stageWidth - gutter - metrics.elementWidth + offsets.x;
    }
    if (direction === "top") top = gutter + offsets.y;
    if (direction === "bottom") {
      top = metrics.stageHeight - gutter - metrics.elementHeight + offsets.y;
    }
  }

  if (spec.attachment === "float") {
    top -= 18;
  }

  return { left, top };
}

function horizontalAnchorLeft(metrics, anchor) {
  if (anchor === "left") return 0;
  if (anchor === "right") return metrics.stageWidth - metrics.elementWidth;
  return metrics.stageWidth / 2 - metrics.elementWidth / 2;
}

function verticalAnchorTop(metrics, anchor) {
  if (anchor === "top") return 0;
  if (anchor === "bottom") return metrics.stageHeight - metrics.elementHeight;
  return metrics.stageHeight / 2 - metrics.elementHeight / 2;
}

function normaliseAnimations(input = {}) {
  if (Array.isArray(input.animations)) {
    return [...new Set(
      input.animations
        .map((value) => String(value).toLowerCase())
        .filter((value) => ANIMATIONS.includes(value))
    )];
  }

  const legacy = String(input.transition || "").toLowerCase();

  if (ANIMATIONS.includes(legacy)) {
    return [legacy];
  }

  return [...DEFAULT_SPEC.animations];
}

function normaliseDepth(value) {
  if (value === "background" || value === "blur") return "blur";
  if (
    value === "base"
    || value === "foreground"
    || value === "custom"
    || value === "focus"
  ) {
    return "focus";
  }
  return DEFAULT_SPEC.depth;
}

function legacyDepthZIndex(value) {
  if (value === "background" || value === "blur") return 1;
  if (value === "foreground") return 20;
  return DEFAULT_SPEC.zIndex;
}

function normaliseHorizontalAnchor(value) {
  return value === "left" || value === "right" ? value : "center";
}

function normaliseVerticalAnchor(value) {
  return value === "top" || value === "bottom" ? value : "center";
}

function normaliseSizeMode(value) {
  if (value === "absolute" || value === "percent") return value;
  return "natural";
}

function parseCustomCss(cssText) {
  if (!cssText?.trim() || typeof document === "undefined") return {};

  const style = document.createElement("div").style;
  style.cssText = cssText;
  const result = {};

  for (const property of style) {
    const camel = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camel] = style.getPropertyValue(property).trim();
  }

  return result;
}

function revealClip(direction) {
  return {
    top: "inset(100% 0% 0% 0%)",
    right: "inset(0% 0% 0% 100%)",
    bottom: "inset(0% 0% 100% 0%)",
    left: "inset(0% 100% 0% 0%)"
  }[direction] || "inset(0% 100% 0% 0%)";
}

function collapseTransform(transformValue, direction) {
  const horizontal = direction === "left" || direction === "right";
  return transformValue + (horizontal ? " scaleX(.2)" : " scaleY(.2)");
}

function addTranslation(transformValue, x, y) {
  return `translate3d(${trimNumber(x)}px, ${trimNumber(y)}px, 0) ${transformValue}`;
}

function transform({ x = 0, y = 0, scale = 1, rotation = 0 } = {}) {
  return `translate3d(${trimNumber(x)}px, ${trimNumber(y)}px, 0) rotate(${trimNumber(rotation)}deg) scale(${trimNumber(scale)})`;
}

function normaliseVector(vector) {
  const x = finiteNumber(vector?.x, 0);
  const y = finiteNumber(vector?.y, 0);
  const length = Math.hypot(x, y);

  if (!length) return { x: -1, y: 0 };

  return {
    x: x / length,
    y: y / length
  };
}

function finiteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function trimNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return String(Number(number.toFixed(3)));
}

function cssEscape(value) {
  return String(value).replace(/["\\]/g, "\\$&");
}
