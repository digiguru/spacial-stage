import "./styles.css";
import {
  clearMotion,
  motionMarkup,
  normaliseSpec,
  playMotion
} from "./spacial-stage.js";

const form = document.querySelector("#motionForm");
const stage = document.querySelector("#stage");
const playButton = document.querySelector("#playButton");
const resetButton = document.querySelector("#resetButton");
const motionPhrase = document.querySelector("#motionPhrase");
const codePreview = document.querySelector("#codePreview");
const markupPreview = document.querySelector("#markupPreview");
const statusBadge = document.querySelector("#statusBadge");

const objects = {
  header: document.querySelector("#demoHeader"),
  panel: document.querySelector("#demoPanel"),
  shared: document.querySelector("#sharedObject"),
  content: document.querySelector("#contentObject"),
  collection: document.querySelector("#collectionObject"),
  swap: document.querySelector("#swapObject"),
  followers: document.querySelector("#followers")
};

const allMotionElements = [
  ...Object.values(objects),
  ...objects.collection.querySelectorAll("article"),
  ...objects.followers.querySelectorAll("span")
];

const PRESETS = {
  cloudRail: {
    label: "Cloud rail",
    role: "panel",
    transition: "slide",
    layout: "push",
    attachment: "dock",
    coordination: "none",
    depth: "foreground",
    direction: "left",
    distance: 270,
    duration: 760,
    stagger: 80,
    blur: 0,
    scale: 1,
    opacity: 1
  },
  topHeader: {
    label: "Top header",
    role: "panel",
    transition: "reveal",
    layout: "overlay",
    attachment: "dock",
    coordination: "none",
    depth: "foreground",
    direction: "top",
    distance: 140,
    duration: 620,
    stagger: 70,
    blur: 0,
    scale: 1,
    opacity: 1
  },
  sharedFocus: {
    label: "Shared focus",
    role: "shared",
    transition: "slide",
    layout: "overlay",
    attachment: "free",
    coordination: "none",
    depth: "focus",
    direction: "right",
    distance: 340,
    duration: 820,
    stagger: 80,
    blur: 0,
    scale: 1,
    opacity: 1
  },
  dockCard: {
    label: "Dock card",
    role: "content",
    transition: "slide",
    layout: "reflow",
    attachment: "dock",
    coordination: "none",
    depth: "focus",
    direction: "right",
    distance: 220,
    duration: 720,
    stagger: 70,
    blur: 0,
    scale: 0.88,
    opacity: 1
  },
  staggerCards: {
    label: "Stagger cards",
    role: "collection",
    transition: "reveal",
    layout: "overlay",
    attachment: "free",
    coordination: "stagger",
    depth: "focus",
    direction: "bottom",
    distance: 110,
    duration: 560,
    stagger: 100,
    blur: 0,
    scale: 1,
    opacity: 1
  },
  followBadges: {
    label: "Follow",
    role: "shared",
    transition: "slide",
    layout: "overlay",
    attachment: "float",
    coordination: "follow",
    depth: "foreground",
    direction: "left",
    distance: 260,
    duration: 700,
    stagger: 95,
    blur: 0,
    scale: 0.82,
    opacity: 1
  },
  swapPanels: {
    label: "Swap",
    role: "content",
    transition: "slide",
    layout: "replace",
    attachment: "free",
    coordination: "swap",
    depth: "focus",
    direction: "left",
    distance: 260,
    duration: 620,
    stagger: 110,
    blur: 0,
    scale: 1,
    opacity: 1
  },
  collapseSection: {
    label: "Collapse",
    role: "content",
    transition: "collapse",
    layout: "reflow",
    attachment: "free",
    coordination: "none",
    depth: "focus",
    direction: "top",
    distance: 120,
    duration: 620,
    stagger: 70,
    blur: 0,
    scale: 1,
    opacity: 1
  }
};

const DEFAULT_FORM = {
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
  easing: "cubic-bezier(.2,.82,.24,1)"
};

let playing = false;

function selected(name) {
  return form.elements[name]?.value || DEFAULT_FORM[name];
}

function customTerm(name) {
  const field = document.querySelector(`[data-custom-for="${name}"].custom-term`);
  return field?.value.trim() || "custom";
}

function displayTerm(name, value) {
  return value === "custom" ? customTerm(name) : value;
}

function buildSpec() {
  return normaliseSpec({
    role: selected("role"),
    transition: selected("transition"),
    layout: selected("layout"),
    attachment: selected("attachment"),
    coordination: selected("coordination"),
    depth: selected("depth"),
    direction: selected("direction"),
    distance: Number(form.elements.distance.value),
    duration: Number(form.elements.duration.value),
    stagger: Number(form.elements.stagger.value),
    blur: Number(form.elements.blur.value),
    scale: Number(form.elements.scale.value) / 100,
    opacity: Number(form.elements.opacity.value) / 100,
    easing: form.elements.easing.value.trim() || DEFAULT_FORM.easing,
    customVector: {
      x: Number(form.elements.customX.value),
      y: Number(form.elements.customY.value)
    }
  });
}

function currentPhrase(spec) {
  return [
    displayTerm("role", spec.role),
    displayTerm("transition", spec.transition),
    displayTerm("layout", spec.layout),
    displayTerm("attachment", spec.attachment),
    displayTerm("coordination", spec.coordination),
    displayTerm("depth", spec.depth),
    displayTerm("direction", spec.direction)
  ].map(titleCase).join(" · ");
}

function updatePreview() {
  const spec = buildSpec();
  motionPhrase.textContent = currentPhrase(spec);

  codePreview.textContent = `playMotion({
  targets,
  container: stage,
  spec: ${JSON.stringify({
    role: spec.role,
    transition: spec.transition,
    layout: spec.layout,
    attachment: spec.attachment,
    coordination: spec.coordination,
    depth: spec.depth,
    direction: spec.direction
  }, null, 2)}
});`;

  markupPreview.textContent = `<div
  ${motionMarkup(spec).replaceAll("\n", "\n  ")}
>
  …
</div>`;

  syncCustomFields();
  syncOutputs();
  prepareScene(spec, { keepAnimations: true });
}

function syncCustomFields() {
  ["role", "transition", "layout", "attachment", "coordination", "depth", "direction"].forEach((name) => {
    const custom = document.querySelector(`[data-custom-for="${name}"]`);
    if (!custom) return;
    custom.hidden = selected(name) !== "custom";
  });
}

function syncOutputs() {
  document.querySelector('[data-output="distance"]').value =
    form.elements.distance.value + "px";
  document.querySelector('[data-output="duration"]').value =
    form.elements.duration.value + "ms";
  document.querySelector('[data-output="stagger"]').value =
    form.elements.stagger.value + "ms";
  document.querySelector('[data-output="blur"]').value =
    form.elements.blur.value + "px";
  document.querySelector('[data-output="scale"]').value =
    (Number(form.elements.scale.value) / 100).toFixed(2);
  document.querySelector('[data-output="opacity"]').value =
    (Number(form.elements.opacity.value) / 100).toFixed(2);
}

function resetMotionState() {
  clearMotion(allMotionElements);
  allMotionElements.forEach((element) => {
    element.classList.remove("is-demo-active");
  });
  objects.swap.classList.remove("is-demo-active");
}

function primaryFor(spec) {
  if (spec.role === "panel") {
    return spec.direction === "top" || spec.direction === "bottom"
      ? objects.header
      : objects.panel;
  }

  if (spec.role === "collection") return objects.collection;
  if (spec.role === "content" || spec.role === "custom") return objects.content;
  return objects.shared;
}

function prepareScene(spec, { keepAnimations = false } = {}) {
  if (!keepAnimations) resetMotionState();

  const primary = primaryFor(spec);

  if (!keepAnimations) primary.classList.add("is-demo-active");

  if (spec.role === "panel") {
    objects.shared.classList.add("is-demo-active");
    if (!keepAnimations) {
      objects.shared.style.opacity = "0.5";
      objects.shared.style.filter = "blur(7px)";
      objects.shared.style.transform = "scale(.78)";
    }
  }

  if (spec.coordination === "swap" && !keepAnimations) {
    objects.swap.classList.add("is-demo-active");
  }

  if (spec.coordination === "follow") {
    objects.followers.classList.add("is-demo-active");
  }

  return primary;
}

function playTargets(spec, primary) {
  if (spec.coordination === "stagger") {
    if (spec.role === "collection") {
      return [...objects.collection.querySelectorAll("article")];
    }
    return [primary, ...objects.followers.querySelectorAll("span")];
  }

  return primary;
}

function layoutTargetsFor(spec, primary) {
  if (spec.layout === "overlay") return [];

  if (spec.role === "panel") {
    return [objects.shared];
  }

  if (primary !== objects.content) {
    return [objects.content];
  }

  return [objects.shared];
}

async function play() {
  if (playing) return;
  playing = true;
  setStatus("Playing", true);

  const spec = buildSpec();
  resetMotionState();

  const primary = prepareScene(spec);
  const targets = playTargets(spec, primary);

  (Array.isArray(targets) ? targets : [targets]).forEach((element) => {
    element.classList.add("is-demo-active");
  });

  if (spec.coordination === "swap") {
    objects.swap.classList.add("is-demo-active");
  }

  if (spec.coordination === "follow") {
    objects.followers.classList.add("is-demo-active");
  }

  const layoutTargets = layoutTargetsFor(spec, primary);
  layoutTargets.forEach((element) => element.classList.add("is-demo-active"));

  try {
    await playMotion({
      targets,
      swapTarget: spec.coordination === "swap" ? objects.swap : null,
      followTargets: spec.coordination === "follow"
        ? [...objects.followers.querySelectorAll("span")]
        : [],
      layoutTargets,
      container: stage,
      spec
    });
    setStatus("Settled", false);
  } finally {
    playing = false;
  }
}

function setStatus(text, active) {
  statusBadge.textContent = text;
  statusBadge.classList.toggle("is-playing", active);
}

function setRadio(name, value) {
  const input = form.querySelector(`input[name="${name}"][value="${value}"]`);
  if (input) input.checked = true;
}

function setPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;

  resetMotionState();

  ["role", "transition", "layout", "attachment", "coordination", "depth", "direction"].forEach((key) => {
    setRadio(key, preset[key]);
  });

  form.elements.distance.value = preset.distance;
  form.elements.duration.value = preset.duration;
  form.elements.stagger.value = preset.stagger;
  form.elements.blur.value = preset.blur;
  form.elements.scale.value = Math.round(preset.scale * 100);
  form.elements.opacity.value = Math.round(preset.opacity * 100);

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.preset === name);
  });

  updatePreview();
  play();
}

function resetForm() {
  resetMotionState();

  ["role", "transition", "layout", "attachment", "coordination", "depth", "direction"].forEach((key) => {
    setRadio(key, DEFAULT_FORM[key]);
  });

  form.elements.distance.value = DEFAULT_FORM.distance;
  form.elements.duration.value = DEFAULT_FORM.duration;
  form.elements.stagger.value = DEFAULT_FORM.stagger;
  form.elements.blur.value = DEFAULT_FORM.blur;
  form.elements.scale.value = DEFAULT_FORM.scale * 100;
  form.elements.opacity.value = DEFAULT_FORM.opacity * 100;
  form.elements.easing.value = DEFAULT_FORM.easing;
  form.elements.customX.value = -1;
  form.elements.customY.value = 0;

  form.querySelectorAll(".custom-term").forEach((input) => {
    input.value = "";
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.classList.remove("is-active");
  });

  setStatus("Ready", false);
  updatePreview();
}

function titleCase(value) {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

form.addEventListener("input", () => {
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.classList.remove("is-active");
  });
  updatePreview();
});

form.addEventListener("change", updatePreview);
playButton.addEventListener("click", play);
resetButton.addEventListener("click", resetForm);

document.querySelectorAll("[data-preset]").forEach((button) => {
  button.addEventListener("click", () => setPreset(button.dataset.preset));
});

updatePreview();
play();
