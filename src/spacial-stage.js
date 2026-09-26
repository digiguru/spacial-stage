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
  rotateZ: 0,
  rotateX: 0,
  rotateY: 0,
  translateZ: 0,
  perspective: 1000,
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
    rotateZ: finiteNumber(input.rotateZ, finiteNumber(input.rotation, DEFAULT_SPEC.rotateZ)),
    rotateX: finiteNumber(input.rotateX, DEFAULT_SPEC.rotateX),
    rotateY: finiteNumber(input.rotateY, DEFAULT_SPEC.rotateY),
    translateZ: finiteNumber(input.translateZ, DEFAULT_SPEC.translateZ),
    perspective: Math.max(1, finiteNumber(input.perspective, DEFAULT_SPEC.perspective)),
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
      z: spec.translateZ,
      scale: Math.max(0.05, spec.scale),
      rotateZ: spec.rotateZ + position.rotation,
      rotateX: spec.rotateX,
      rotateY: spec.rotateY,
      perspective: spec.perspective
    }),
    opacity: String(depth.opacity),
    filter: `blur(${depth.blur}px) saturate(${depth.saturation})`,
    clipPath: "inset(0% 0% 0% 0%)",
    transformStyle: "preserve-3d",
    backfaceVisibility: "visible",
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

export function captureRect(element) {
  if (!element?.getBoundingClientRect) return null;

  const rect = element.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom
  };
}

export function rectRelativeTo(rect, container) {
  if (!rect) return null;

  const containerRect = container?.getBoundingClientRect
    ? container.getBoundingClientRect()
    : { left: 0, top: 0 };

  return {
    left: rect.left - containerRect.left,
    top: rect.top - containerRect.top,
    width: rect.width,
    height: rect.height
  };
}

export function flipFrames(
  fromRect,
  toRect,
  {
    fromRotate = 0,
    toRotate = 0,
    origin = "top left"
  } = {}
) {
  if (!fromRect || !toRect) return [];

  const safeWidth = Math.max(0.0001, toRect.width);
  const safeHeight = Math.max(0.0001, toRect.height);
  const scaleX = Math.max(0.0001, fromRect.width / safeWidth);
  const scaleY = Math.max(0.0001, fromRect.height / safeHeight);
  const useCenter = origin === "center";
  const deltaX = fromRect.left - toRect.left
    - (useCenter ? (toRect.width - fromRect.width) / 2 : 0);
  const deltaY = fromRect.top - toRect.top
    - (useCenter ? (toRect.height - fromRect.height) / 2 : 0);
  const transformOrigin = useCenter ? "center center" : "top left";

  const startTransform = [
    `translate3d(${trimNumber(deltaX)}px, ${trimNumber(deltaY)}px, 0)`,
    `scale(${trimNumber(scaleX)}, ${trimNumber(scaleY)})`
  ];
  const endTransform = [
    "translate3d(0px, 0px, 0)",
    "scale(1, 1)"
  ];

  if (fromRotate || toRotate) {
    startTransform.push(`rotate(${trimNumber(fromRotate)}deg)`);
    endTransform.push(`rotate(${trimNumber(toRotate)}deg)`);
  }

  return [
    {
      transformOrigin,
      transform: startTransform.join(" ")
    },
    {
      transformOrigin,
      transform: endTransform.join(" ")
    }
  ];
}

export async function animateFlip(
  element,
  fromRect,
  toRect,
  {
    duration = 700,
    easing = "cubic-bezier(.2,.82,.24,1)",
    reducedMotion = prefersReducedMotion(),
    fromRotate = 0,
    toRotate = 0,
    origin = "top left"
  } = {}
) {
  if (!element || !fromRect || !toRect) return null;

  const frames = flipFrames(fromRect, toRect, {
    fromRotate,
    toRotate,
    origin
  });

  if (
    reducedMotion
    || typeof element.animate !== "function"
    || frames.length < 2
  ) {
    return null;
  }

  const animation = element.animate(frames, {
    duration,
    easing,
    fill: "both"
  });

  try {
    await animation.finished;
  } catch {}

  animation.cancel();
  return animation;
}

export async function animateFlowSpace(
  slot,
  fromHeight,
  toHeight,
  {
    duration = 700,
    easing = "cubic-bezier(.2,.82,.24,1)",
    reducedMotion = prefersReducedMotion()
  } = {}
) {
  if (!slot) return null;

  const start = Math.max(0, finiteNumber(fromHeight, 0));
  const end = Math.max(0, finiteNumber(toHeight, 0));

  if (
    reducedMotion
    || typeof slot.animate !== "function"
    || start === end
  ) {
    slot.style.height = `${trimNumber(end)}px`;
    return null;
  }

  slot.style.height = `${trimNumber(end)}px`;
  const animation = slot.animate(
    [
      { height: `${trimNumber(start)}px` },
      { height: `${trimNumber(end)}px` }
    ],
    {
      duration,
      easing,
      fill: "both"
    }
  );

  try {
    await animation.finished;
  } catch {}

  animation.cancel();
  slot.style.height = `${trimNumber(end)}px`;
  return animation;
}

export function captureLayoutRect(element) {
  if (!element?.getBoundingClientRect) return null;

  const previousTransform = element.style.transform;
  const previousRotate = element.style.rotate;
  const previousTransformOrigin = element.style.transformOrigin;

  element.style.transform = "none";
  element.style.rotate = "0deg";
  element.style.transformOrigin = "top left";

  const rect = captureRect(element);

  element.style.transform = previousTransform;
  element.style.rotate = previousRotate;
  element.style.transformOrigin = previousTransformOrigin;

  return rect;
}

export function resolveAbsolutePlacementRect(
  containerRect,
  referenceRect,
  {
    scale = 1,
    anchorX = "left",
    anchorY = "top",
    offsetX = 0,
    offsetY = 0
  } = {}
) {
  if (!containerRect || !referenceRect) return null;

  const factor = Math.max(0.0001, finiteNumber(scale, 1));
  const width = Math.max(0.0001, referenceRect.width * factor);
  const height = Math.max(0.0001, referenceRect.height * factor);

  const leftByAnchor = {
    left: containerRect.left,
    center: containerRect.left + (containerRect.width - width) / 2,
    right: containerRect.right - width
  };
  const topByAnchor = {
    top: containerRect.top,
    center: containerRect.top + (containerRect.height - height) / 2,
    bottom: containerRect.bottom - height
  };

  return {
    left: (leftByAnchor[anchorX] ?? leftByAnchor.left)
      + placementOffset(offsetX, width, containerRect.width),
    top: (topByAnchor[anchorY] ?? topByAnchor.top)
      + placementOffset(offsetY, height, containerRect.height),
    width,
    height
  };
}

export function layoutShiftFrames(fromRect, toRect) {
  if (!fromRect || !toRect) return [];

  const deltaX = fromRect.left - toRect.left;
  const deltaY = fromRect.top - toRect.top;

  return [
    {
      translate: `${trimNumber(deltaX)}px ${trimNumber(deltaY)}px`
    },
    {
      translate: "0px 0px"
    }
  ];
}

export function captureLayoutChildren(root, { exclude = [] } = {}) {
  if (!root?.children) return new Map();

  const excluded = new Set(exclude);
  return new Map(
    [...root.children]
      .filter((element) => !excluded.has(element))
      .map((element) => [element, captureLayoutRect(element)])
      .filter(([, rect]) => rect)
  );
}

export async function animateLayoutChanges(
  before,
  after,
  {
    duration = 700,
    easing = "cubic-bezier(.2,.82,.24,1)",
    reducedMotion = prefersReducedMotion()
  } = {}
) {
  if (!(before instanceof Map) || !(after instanceof Map)) return [];

  const animations = [];

  for (const [element, fromRect] of before) {
    const toRect = after.get(element);
    if (!toRect) continue;

    const frames = layoutShiftFrames(fromRect, toRect);
    const deltaX = fromRect.left - toRect.left;
    const deltaY = fromRect.top - toRect.top;

    if (
      reducedMotion
      || typeof element.animate !== "function"
      || (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01)
    ) {
      continue;
    }

    const animation = element.animate(frames, {
      duration,
      easing,
      fill: "both"
    });

    animations.push(animation);
  }

  await Promise.all(
    animations.map(async (animation) => {
      try {
        await animation.finished;
      } catch {}
      animation.cancel();
    })
  );

  return animations;
}

export function createPlacementController(
  element,
  {
    placements = {},
    initial = null,
    duration = 700,
    easing = "cubic-bezier(.2,.82,.24,1)",
    reducedMotion = prefersReducedMotion()
  } = {}
) {
  if (!element) {
    throw new TypeError("createPlacementController requires an element.");
  }

  let currentName = null;
  let running = false;

  function placement(name) {
    const value = placements[name];

    if (!value) {
      throw new Error(`Unknown placement "${name}".`);
    }

    return value;
  }

  function firstAbsoluteContainer() {
    return Object.values(placements)
      .find((value) => value?.type === "absolute" && value.container)
      ?.container || null;
  }

  function prepareSlot(spec) {
    if (!spec?.slot) {
      throw new TypeError("Flow placement requires a slot element.");
    }

    const alignment = {
      left: "flex-start",
      center: "center",
      right: "flex-end",
      stretch: "stretch"
    }[spec.align || "center"] || "center";

    Object.assign(spec.slot.style, {
      display: "flex",
      flexDirection: "column",
      alignItems: alignment,
      overflow: spec.overflow || "visible"
    });
  }

  function flowStyle(spec) {
    const gapBefore = Math.max(0, finiteNumber(spec.gapBefore, 0));
    const gapAfter = Math.max(0, finiteNumber(spec.gapAfter, 0));

    return {
      position: "relative",
      left: "auto",
      top: "auto",
      right: "auto",
      bottom: "auto",
      margin: `${trimNumber(gapBefore)}px 0 ${trimNumber(gapAfter)}px`,
      transform: "none",
      rotate: `${trimNumber(finiteNumber(spec.rotateZ, 0))}deg`,
      transformOrigin: spec.transformOrigin || "center center",
      flex: "0 0 auto",
      ...(spec.style || {})
    };
  }

  function measurementClone(spec) {
    prepareSlot(spec);

    const clone = element.cloneNode(true);
    clone.removeAttribute("id");
    clone.querySelectorAll?.("[id]").forEach((node) => node.removeAttribute("id"));

    Object.assign(clone.style, flowStyle(spec), {
      visibility: "hidden",
      pointerEvents: "none",
      transition: "none",
      animation: "none",
      rotate: "0deg"
    });

    spec.slot.append(clone);
    return clone;
  }

  function measureFlow(name, spec) {
    const clone = measurementClone(spec);

    try {
      const rect = captureLayoutRect(clone);
      const layoutHeight = clone.offsetHeight || rect?.height || 0;
      const gapBefore = Math.max(0, finiteNumber(spec.gapBefore, 0));
      const gapAfter = Math.max(0, finiteNumber(spec.gapAfter, 0));

      return {
        name,
        type: "flow",
        rect,
        slot: spec.slot,
        slotHeight: gapBefore + layoutHeight + gapAfter,
        collapsedHeight: Math.max(0, finiteNumber(spec.collapsedHeight, 0)),
        rotateZ: finiteNumber(spec.rotateZ, 0),
        spec
      };
    } finally {
      clone.remove();
    }
  }

  function measure(name, visited = new Set()) {
    if (visited.has(name)) {
      throw new Error(`Placement "${name}" contains a circular size reference.`);
    }

    visited.add(name);
    const spec = placement(name);

    if (spec.type === "flow") {
      return measureFlow(name, spec);
    }

    if (spec.type !== "absolute") {
      throw new Error(`Unsupported placement type "${spec.type}".`);
    }

    if (!spec.container) {
      throw new TypeError("Absolute placement requires a container element.");
    }

    const referenceName = spec.sizeFrom || Object.keys(placements)
      .find((candidate) => placements[candidate]?.type === "flow");
    const reference = referenceName
      ? measure(referenceName, new Set(visited))
      : {
          rect: captureLayoutRect(element)
        };
    const containerRect = captureRect(spec.container);
    const rect = resolveAbsolutePlacementRect(
      containerRect,
      reference.rect,
      spec
    );

    return {
      name,
      type: "absolute",
      rect,
      container: spec.container,
      rotateZ: finiteNumber(spec.rotateZ, 0),
      spec
    };
  }

  function absoluteOffsets(container, rect) {
    const containerRect = captureRect(container);
    const clientLeft = finiteNumber(container.clientLeft, 0);
    const clientTop = finiteNumber(container.clientTop, 0);
    const scrollLeft = finiteNumber(container.scrollLeft, 0);
    const scrollTop = finiteNumber(container.scrollTop, 0);

    return {
      left: rect.left - containerRect.left - clientLeft + scrollLeft,
      top: rect.top - containerRect.top - clientTop + scrollTop
    };
  }

  function applyAbsolute(measured) {
    const { spec, rect, container } = measured;
    const offsets = absoluteOffsets(container, rect);

    container.append(element);
    Object.assign(element.style, {
      position: "absolute",
      left: `${trimNumber(offsets.left)}px`,
      top: `${trimNumber(offsets.top)}px`,
      right: "auto",
      bottom: "auto",
      width: `${trimNumber(rect.width)}px`,
      height: `${trimNumber(rect.height)}px`,
      margin: "0",
      transform: "none",
      rotate: `${trimNumber(finiteNumber(spec.rotateZ, 0))}deg`,
      transformOrigin: spec.transformOrigin || "center center",
      ...(spec.style || {})
    });
  }

  function applyFlow(measured) {
    const { spec, slot, slotHeight } = measured;
    prepareSlot(spec);
    slot.style.height = `${trimNumber(slotHeight)}px`;
    slot.append(element);
    Object.assign(element.style, flowStyle(spec));
  }

  function collapseOtherFlowSlots(activeName = null) {
    for (const [name, spec] of Object.entries(placements)) {
      if (name === activeName || spec?.type !== "flow" || !spec.slot) continue;
      spec.slot.style.height = `${trimNumber(
        Math.max(0, finiteNumber(spec.collapsedHeight, 0))
      )}px`;
    }
  }

  function apply(name) {
    const measured = measure(name);

    if (measured.type === "flow") {
      applyFlow(measured);
    } else {
      applyAbsolute(measured);
      collapseOtherFlowSlots();
    }

    currentName = name;
    return measured;
  }

  async function transition(name) {
    if (running || name === currentName) return null;

    const target = measure(name);
    const sourceName = currentName;
    const source = sourceName ? measure(sourceName) : null;
    const fromRect = captureLayoutRect(element);
    const fromRotate = source?.rotateZ || 0;
    const toRotate = target.rotateZ || 0;
    const flowSlots = Object.values(placements)
      .filter((value) => value?.type === "flow" && value.slot)
      .map((value) => value.slot);
    const layoutRoots = new Set(
      [source, target]
        .filter((value) => value?.type === "flow")
        .map((value) => value.spec.layoutRoot || value.slot.parentElement)
        .filter(Boolean)
    );
    const beforeLayouts = new Map(
      [...layoutRoots].map((root) => [
        root,
        captureLayoutChildren(root, { exclude: flowSlots })
      ])
    );

    running = true;

    try {
      if (target.type === "flow") {
        const overlayContainer =
          source?.type === "absolute"
            ? source.container
            : firstAbsoluteContainer();

        if (!overlayContainer) {
          throw new Error("A flow transition requires an absolute overlay container.");
        }

        const overlayMeasured = {
          ...target,
          type: "absolute",
          container: overlayContainer,
          spec: {
            ...target.spec,
            container: overlayContainer,
            style: target.spec.overlayStyle || {}
          }
        };

        applyAbsolute(overlayMeasured);
        element.style.rotate = "0deg";
      } else {
        applyAbsolute(target);
        element.style.rotate = "0deg";
      }

      for (const [placementName, spec] of Object.entries(placements)) {
        if (spec?.type !== "flow" || !spec.slot) continue;

        const height = placementName === name && target.type === "flow"
          ? target.slotHeight
          : Math.max(0, finiteNumber(spec.collapsedHeight, 0));

        spec.slot.style.height = `${trimNumber(height)}px`;
      }

      const settledTarget = measure(name);

      if (settledTarget.type === "flow") {
        const overlayContainer =
          source?.type === "absolute"
            ? source.container
            : firstAbsoluteContainer();
        const overlayMeasured = {
          ...settledTarget,
          type: "absolute",
          container: overlayContainer,
          spec: {
            ...settledTarget.spec,
            container: overlayContainer,
            style: settledTarget.spec.overlayStyle || {}
          }
        };

        applyAbsolute(overlayMeasured);
        element.style.rotate = "0deg";
      } else {
        applyAbsolute(settledTarget);
        element.style.rotate = "0deg";
      }

      const layoutJobs = [];

      for (const root of layoutRoots) {
        const after = captureLayoutChildren(root, { exclude: flowSlots });
        layoutJobs.push(
          animateLayoutChanges(beforeLayouts.get(root), after, {
            duration,
            easing,
            reducedMotion
          })
        );
      }

      await Promise.all([
        ...layoutJobs,
        animateFlip(element, fromRect, settledTarget.rect, {
          duration,
          easing,
          reducedMotion,
          fromRotate,
          toRotate: settledTarget.rotateZ || 0,
          origin: "center"
        })
      ]);

      if (settledTarget.type === "flow") {
        applyFlow(settledTarget);
        collapseOtherFlowSlots(name);
      } else {
        applyAbsolute(settledTarget);
        collapseOtherFlowSlots();
      }

      currentName = name;
      return settledTarget;
    } finally {
      running = false;
    }
  }

  const controller = {
    apply,
    transition,
    measure,
    get current() {
      return currentName;
    },
    get running() {
      return running;
    }
  };

  if (initial) {
    apply(initial);
  }

  return controller;
}

function placementOffset(value, selfSize, containerSize) {
  if (value && typeof value === "object") {
    const amount = finiteNumber(value.value, 0);

    if (value.relativeTo === "self") return selfSize * amount;
    if (value.relativeTo === "container") return containerSize * amount;
    return amount;
  }

  return finiteNumber(value, 0);
}

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
    `  --stage-rotate-z: ${trimNumber(spec.rotateZ)}deg;`,
    `  --stage-rotate-x: ${trimNumber(spec.rotateX)}deg;`,
    `  --stage-rotate-y: ${trimNumber(spec.rotateY)}deg;`,
    `  --stage-translate-z: ${trimNumber(spec.translateZ)}px;`,
    `  --stage-perspective: ${trimNumber(spec.perspective)}px;`,
    `  z-index: var(--stage-z-index);`
  ];

  if (frame) {
    lines.push(
      `  width: ${frame.width};`,
      `  height: ${frame.height};`,
      `  transform: ${frame.transform};`,
      `  filter: ${frame.filter};`,
      `  opacity: ${frame.opacity};`,
      `  transform-style: ${frame.transformStyle};`,
      `  backface-visibility: ${frame.backfaceVisibility};`
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
    `data-stage-rotate-z="${spec.rotateZ}"`,
    `data-stage-rotate-x="${spec.rotateX}"`,
    `data-stage-rotate-y="${spec.rotateY}"`,
    `data-stage-translate-z="${spec.translateZ}"`,
    `data-stage-perspective="${spec.perspective}"`,
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

function transform({
  x = 0,
  y = 0,
  z = 0,
  scale = 1,
  rotateZ = 0,
  rotateX = 0,
  rotateY = 0,
  perspective = 1000
} = {}) {
  return [
    `perspective(${trimNumber(perspective)}px)`,
    `translate3d(${trimNumber(x)}px, ${trimNumber(y)}px, ${trimNumber(z)}px)`,
    `rotateX(${trimNumber(rotateX)}deg)`,
    `rotateY(${trimNumber(rotateY)}deg)`,
    `rotateZ(${trimNumber(rotateZ)}deg)`,
    `scale(${trimNumber(scale)})`
  ].join(" ");
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
