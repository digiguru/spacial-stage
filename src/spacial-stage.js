export const DIRECTIONS = Object.freeze({
  top: Object.freeze({ x: 0, y: -1 }),
  right: Object.freeze({ x: 1, y: 0 }),
  bottom: Object.freeze({ x: 0, y: 1 }),
  left: Object.freeze({ x: -1, y: 0 })
});

export const DEPTHS = Object.freeze({
  background: Object.freeze({ blur: 12, opacity: 0.42, scale: 1.05, z: 0 }),
  focus: Object.freeze({ blur: 0, opacity: 1, scale: 1, z: 10 }),
  foreground: Object.freeze({ blur: 0, opacity: 1, scale: 1.06, z: 20 })
});

export const DEFAULT_SPEC = Object.freeze({
  role: "shared",
  transition: "slide",
  layout: "overlay",
  attachment: "free",
  coordination: "none",
  depth: "focus",
  direction: "auto",
  distance: 180,
  duration: 700,
  stagger: 80,
  blur: 0,
  scale: 1,
  opacity: 1,
  easing: "cubic-bezier(.2,.82,.24,1)",
  customVector: Object.freeze({ x: -1, y: 0 })
});

const AUTO_DIRECTIONS = Object.freeze({
  panel: "left",
  shared: "right",
  content: "bottom",
  collection: "bottom",
  custom: "left"
});

export function normaliseSpec(input = {}) {
  const customVector = {
    ...DEFAULT_SPEC.customVector,
    ...(input.customVector || {})
  };

  return {
    ...DEFAULT_SPEC,
    ...input,
    distance: finiteNumber(input.distance, DEFAULT_SPEC.distance),
    duration: finiteNumber(input.duration, DEFAULT_SPEC.duration),
    stagger: finiteNumber(input.stagger, DEFAULT_SPEC.stagger),
    blur: finiteNumber(input.blur, DEFAULT_SPEC.blur),
    scale: finiteNumber(input.scale, DEFAULT_SPEC.scale),
    opacity: finiteNumber(input.opacity, DEFAULT_SPEC.opacity),
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

export function resolveDepth(specInput = {}) {
  const spec = normaliseSpec(specInput);
  const base = DEPTHS[spec.depth] || DEPTHS.focus;

  return {
    blur: Math.max(0, base.blur + spec.blur),
    opacity: clamp(base.opacity * spec.opacity, 0, 1),
    scale: Math.max(0.05, base.scale * spec.scale),
    z: base.z
  };
}

export function buildTransitionFrames(specInput = {}, options = {}) {
  const spec = normaliseSpec(specInput);
  const vector = resolveDirection(spec);
  const depth = resolveDepth(spec);
  const attachment = options.attachment || { x: 0, y: 0, rotation: 0 };
  const direction = effectiveDirection(spec);
  const distance = spec.distance;
  const to = {
    x: attachment.x || 0,
    y: attachment.y || 0,
    rotation: attachment.rotation || 0,
    scale: depth.scale
  };

  const finalFrame = {
    transform: transform(to),
    opacity: depth.opacity,
    filter: `blur(${depth.blur}px) saturate(1)`,
    clipPath: "inset(0% 0% 0% 0%)"
  };

  let firstFrame;

  switch (spec.transition) {
    case "reveal":
      firstFrame = {
        transform: transform({
          ...to,
          x: to.x + vector.x * Math.min(distance * 0.18, 48),
          y: to.y + vector.y * Math.min(distance * 0.18, 48),
          scale: to.scale * 0.985
        }),
        opacity: 0,
        filter: `blur(${Math.max(depth.blur, 5)}px) saturate(.92)`,
        clipPath: revealClip(direction)
      };
      break;

    case "fade":
      firstFrame = {
        transform: transform({ ...to, scale: to.scale * 0.985 }),
        opacity: 0,
        filter: `blur(${Math.max(depth.blur, 7)}px) saturate(.92)`,
        clipPath: "inset(0% 0% 0% 0%)"
      };
      break;

    case "collapse":
      firstFrame = {
        transform: collapseTransform(to, direction),
        transformOrigin: transformOrigin(direction),
        opacity: 0,
        filter: `blur(${Math.max(depth.blur, 3)}px) saturate(.95)`,
        clipPath: revealClip(direction)
      };
      finalFrame.transformOrigin = transformOrigin(direction);
      break;

    case "slide":
    default:
      firstFrame = {
        transform: transform({
          ...to,
          x: to.x + vector.x * distance,
          y: to.y + vector.y * distance
        }),
        opacity: 0,
        filter: `blur(${depth.blur}px) saturate(.96)`,
        clipPath: "inset(0% 0% 0% 0%)"
      };
      break;
  }

  return [firstFrame, finalFrame];
}

export function buildExitFrames(specInput = {}, options = {}) {
  return [...buildTransitionFrames(specInput, options)].reverse();
}

export function buildLayoutFrames(specInput = {}) {
  const spec = normaliseSpec(specInput);
  const vector = resolveDirection(spec);
  const amount = Math.min(Math.max(spec.distance * 0.44, 48), 180);

  if (spec.layout === "replace") {
    return [
      { transform: "translate3d(0px, 0px, 0) scale(1)", opacity: 1, filter: "blur(0px)" },
      {
        transform: `translate3d(${-vector.x * Math.min(amount, 72)}px, ${-vector.y * Math.min(amount, 72)}px, 0) scale(.97)`,
        opacity: 0,
        filter: "blur(8px)"
      }
    ];
  }

  if (spec.layout === "reflow") {
    return [
      { transform: "translate3d(0px, 0px, 0) scale(1)", opacity: 1 },
      {
        transform: `translate3d(${-vector.x * Math.min(amount, 96)}px, ${-vector.y * Math.min(amount, 96)}px, 0) scale(.9)`,
        opacity: 0.62
      }
    ];
  }

  if (spec.layout === "push") {
    return [
      { transform: "translate3d(0px, 0px, 0)" },
      {
        transform: `translate3d(${-vector.x * amount}px, ${-vector.y * amount}px, 0)`
      }
    ];
  }

  return null;
}

export const buildPushFrames = buildLayoutFrames;

export function attachmentFor(element, container, specInput = {}) {
  const spec = normaliseSpec(specInput);

  if (spec.attachment === "float") {
    return { x: 0, y: -12, rotation: -0.8 };
  }

  if (spec.attachment === "pin" || spec.attachment === "free" || !element || !container) {
    return { x: 0, y: 0, rotation: 0 };
  }

  if (spec.attachment !== "dock") {
    return { x: 0, y: 0, rotation: 0 };
  }

  const rect = element.getBoundingClientRect();
  const bounds = container.getBoundingClientRect();
  const direction = effectiveDirection(spec);
  const gutter = 20;

  if (direction === "right") {
    return {
      x: bounds.right - gutter - rect.right,
      y: bounds.top + (bounds.height - rect.height) / 2 - rect.top,
      rotation: 0
    };
  }

  if (direction === "top") {
    return {
      x: bounds.left + (bounds.width - rect.width) / 2 - rect.left,
      y: bounds.top + gutter - rect.top,
      rotation: 0
    };
  }

  if (direction === "bottom") {
    return {
      x: bounds.left + (bounds.width - rect.width) / 2 - rect.left,
      y: bounds.bottom - gutter - rect.bottom,
      rotation: 0
    };
  }

  return {
    x: bounds.left + gutter - rect.left,
    y: bounds.top + (bounds.height - rect.height) / 2 - rect.top,
    rotation: 0
  };
}

export async function playMotion({
  targets,
  swapTarget = null,
  followTargets = [],
  layoutTargets = [],
  pushTargets = [],
  container = null,
  spec: specInput = {}
} = {}) {
  const spec = normaliseSpec(specInput);
  const elements = toElements(targets);

  if (!elements.length) return [];

  const reduced = prefersReducedMotion();
  const animations = [];

  if (spec.coordination === "swap" && swapTarget) {
    const primary = elements[0];
    const primaryAttachment = attachmentFor(primary, container, spec);
    const secondaryAttachment = attachmentFor(swapTarget, container, {
      ...spec,
      direction: oppositeDirection(effectiveDirection(spec))
    });

    setPresentationState(swapTarget, true);

    if (reduced) {
      applyFinalFrame(swapTarget, buildTransitionFrames(spec, { attachment: secondaryAttachment }).at(-1));
      primary.style.opacity = "0";
      return [];
    }

    animations.push(
      animate(primary, buildExitFrames(spec, { attachment: primaryAttachment }), spec, 0),
      animate(
        swapTarget,
        buildTransitionFrames(
          { ...spec, direction: oppositeDirection(effectiveDirection(spec)) },
          { attachment: secondaryAttachment }
        ),
        spec,
        Math.round(spec.stagger * 0.5)
      )
    );

    await settle(animations);
    return animations;
  }

  const motionTargets = spec.coordination === "follow"
    ? [elements[0], ...toElements(followTargets)]
    : elements;

  const limitedTargets = spec.coordination === "none"
    ? motionTargets.slice(0, 1)
    : motionTargets;

  limitedTargets.forEach((element, index) => {
    setPresentationState(element, true);
    const attachment = attachmentFor(element, container, spec);
    const delay = (
      spec.coordination === "stagger" || spec.coordination === "follow"
    ) ? index * spec.stagger : 0;

    if (reduced) {
      applyFinalFrame(element, buildTransitionFrames(spec, { attachment }).at(-1));
      return;
    }

    animations.push(
      animate(element, buildTransitionFrames(spec, { attachment }), spec, delay)
    );
  });

  const layoutFrames = buildLayoutFrames(spec);
  if (layoutFrames) {
    const affected = [...toElements(layoutTargets), ...toElements(pushTargets)];
    [...new Set(affected)].forEach((element) => {
      if (reduced) {
        applyFinalFrame(element, layoutFrames.at(-1));
        return;
      }
      animations.push(animate(element, layoutFrames, {
        ...spec,
        duration: Math.max(220, spec.duration * 0.86)
      }, 0));
    });
  }

  await settle(animations);
  return animations;
}

export function clearMotion(elements) {
  toElements(elements).forEach((element) => {
    element.getAnimations?.().forEach((animation) => animation.cancel());
    element.removeAttribute?.("style");
    element.removeAttribute?.("data-motion-active");
  });
}

export function motionMarkup(specInput = {}) {
  const spec = normaliseSpec(specInput);
  return [
    `data-stage-role="${spec.role}"`,
    `data-stage-transition="${spec.transition}"`,
    `data-stage-layout="${spec.layout}"`,
    `data-stage-attachment="${spec.attachment}"`,
    `data-stage-coordination="${spec.coordination}"`,
    `data-stage-depth="${spec.depth}"`,
    `data-stage-direction="${spec.direction}"`
  ].join("\n");
}

export function prefersReducedMotion(win = globalThis.window) {
  return Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

function animate(element, frames, specInput, delay = 0) {
  const spec = normaliseSpec(specInput);
  return element.animate(frames, {
    duration: spec.duration,
    delay,
    easing: spec.easing,
    fill: "forwards"
  });
}

function setPresentationState(element, active) {
  if (!element) return;
  if (active) element.dataset.motionActive = "true";
  else element.removeAttribute("data-motion-active");
}

function applyFinalFrame(element, frame = {}) {
  Object.assign(element.style, frame);
}

function settle(animations) {
  return Promise.all(
    animations.map((animation) => animation.finished?.catch(() => undefined))
  );
}

function effectiveDirection(spec) {
  if (spec.direction === "auto") {
    return AUTO_DIRECTIONS[spec.role] || "left";
  }
  if (spec.direction === "custom") {
    const vector = resolveDirection(spec);
    if (Math.abs(vector.x) >= Math.abs(vector.y)) return vector.x >= 0 ? "right" : "left";
    return vector.y >= 0 ? "bottom" : "top";
  }
  return DIRECTIONS[spec.direction] ? spec.direction : "left";
}

function oppositeDirection(direction) {
  return {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right"
  }[direction] || "right";
}

function revealClip(direction) {
  return {
    top: "inset(100% 0% 0% 0%)",
    right: "inset(0% 0% 0% 100%)",
    bottom: "inset(0% 0% 100% 0%)",
    left: "inset(0% 100% 0% 0%)"
  }[direction] || "inset(0% 100% 0% 0%)";
}

function transformOrigin(direction) {
  return {
    top: "top center",
    right: "center right",
    bottom: "bottom center",
    left: "center left"
  }[direction] || "center";
}

function collapseTransform(to, direction) {
  const horizontal = direction === "left" || direction === "right";
  return [
    `translate3d(${to.x}px, ${to.y}px, 0)`,
    `rotate(${to.rotation || 0}deg)`,
    horizontal
      ? `scale(${to.scale * 0.9}, ${to.scale})`
      : `scale(${to.scale}, ${to.scale * 0.72})`
  ].join(" ");
}

function transform({ x = 0, y = 0, scale = 1, rotation = 0 } = {}) {
  return `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`;
}

function normaliseVector(vector) {
  const x = finiteNumber(vector?.x, 0);
  const y = finiteNumber(vector?.y, 0);
  const length = Math.hypot(x, y);
  if (!length) return { x: -1, y: 0 };
  return { x: x / length, y: y / length };
}

function toElements(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (
    typeof value !== "string" &&
    typeof value[Symbol.iterator] === "function" &&
    !value.animate
  ) {
    return [...value].filter(Boolean);
  }
  return [value].filter(Boolean);
}

function finiteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
