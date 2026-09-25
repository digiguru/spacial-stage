import "./styles.css";
import {
  animateBetweenStates,
  applyFrame,
  cssForElement,
  cssForParent,
  destinationFrame,
  normaliseSpec,
  pushCompanionFrames
} from "./spacial-stage.js";

const STORAGE_KEY = "spacial-stage-playground-v2";

const stage = document.querySelector("#stage");
const stageContent = document.querySelector("#stageContent");
const form = document.querySelector("#motionForm");
const stateTabs = document.querySelector("#stateTabs");
const objectTabs = document.querySelector("#objectTabs");
const addStateButton = document.querySelector("#addStateButton");
const resetButton = document.querySelector("#resetButton");
const replayButton = document.querySelector("#replayButton");
const stageStateLabel = document.querySelector("#stageStateLabel");
const selectedObjectName = document.querySelector("#selectedObjectName");
const selectedRole = document.querySelector("#selectedRole");
const selectedStateName = document.querySelector("#selectedStateName");
const cssTitle = document.querySelector("#cssTitle");
const elementCss = document.querySelector("#elementCss");
const parentCss = document.querySelector("#parentCss");
const stateDirtyBadge = document.querySelector("#stateDirtyBadge");

const OBJECTS = Object.freeze({
  svg: {
    name: "SVG object",
    role: "shared",
    element: document.querySelector("#svgObject")
  },
  panel: {
    name: "Panel",
    role: "panel",
    element: document.querySelector("#panelObject")
  },
  copy: {
    name: "Title + paragraph",
    role: "content",
    element: document.querySelector("#copyObject")
  },
  cards: {
    name: "Floating cards",
    role: "collection",
    element: document.querySelector("#cardsObject")
  }
});

const base = (role, overrides = {}) => normaliseSpec({
  role,
  transition: "slide",
  attachment: "free",
  coordination: "none",
  depth: "focus",
  direction: "auto",
  offsetX: 0,
  offsetY: 0,
  distance: 180,
  duration: 700,
  stagger: 80,
  blur: 0,
  scale: 1,
  opacity: 1,
  easing: "cubic-bezier(.2,.82,.24,1)",
  customCss: "",
  ...overrides
});

const DEFAULT_STATES = [
  {
    id: "home",
    name: "Home",
    objects: {
      svg: base("shared", {
        transition: "slide",
        depth: "background",
        direction: "right",
        offsetX: 280,
        offsetY: 145,
        distance: 340,
        duration: 840,
        scale: 1.08
      }),
      panel: base("panel", {
        transition: "reveal",
        attachment: "dock",
        depth: "background",
        direction: "left",
        offsetX: -150,
        opacity: 0.45,
        duration: 600
      }),
      copy: base("content", {
        transition: "reveal",
        depth: "focus",
        direction: "left",
        offsetX: -185,
        offsetY: -82,
        distance: 130,
        duration: 620
      }),
      cards: base("collection", {
        transition: "reveal",
        attachment: "float",
        coordination: "stagger",
        depth: "foreground",
        direction: "bottom",
        offsetX: 235,
        offsetY: 135,
        distance: 120,
        duration: 560,
        stagger: 90,
        scale: 0.82,
        opacity: 0.94
      })
    }
  },
  {
    id: "room",
    name: "Room",
    objects: {
      svg: base("shared", {
        transition: "slide",
        depth: "focus",
        direction: "left",
        offsetX: 10,
        offsetY: 38,
        distance: 300,
        duration: 800,
        scale: 0.9
      }),
      panel: base("panel", {
        transition: "push",
        attachment: "dock",
        depth: "foreground",
        direction: "left",
        distance: 260,
        duration: 720,
        scale: 0.98
      }),
      copy: base("content", {
        transition: "reveal",
        depth: "background",
        direction: "top",
        offsetX: 235,
        offsetY: -165,
        distance: 150,
        duration: 560,
        opacity: 0.72,
        scale: 0.88
      }),
      cards: base("collection", {
        transition: "reveal",
        attachment: "float",
        coordination: "stagger",
        depth: "foreground",
        direction: "right",
        offsetX: 250,
        offsetY: -110,
        distance: 150,
        duration: 540,
        stagger: 85,
        scale: 0.76
      })
    }
  },
  {
    id: "cloud",
    name: "Cloud",
    objects: {
      svg: base("shared", {
        transition: "slide",
        depth: "background",
        direction: "left",
        offsetX: -315,
        offsetY: 65,
        distance: 350,
        duration: 860,
        scale: 1.18
      }),
      panel: base("panel", {
        transition: "push",
        attachment: "dock",
        depth: "foreground",
        direction: "left",
        distance: 250,
        duration: 720
      }),
      copy: base("content", {
        transition: "reveal",
        depth: "focus",
        direction: "top",
        offsetX: 175,
        offsetY: -145,
        distance: 170,
        duration: 620,
        scale: 0.92
      }),
      cards: base("collection", {
        transition: "reveal",
        attachment: "float",
        coordination: "follow",
        depth: "foreground",
        direction: "right",
        offsetX: 255,
        offsetY: 135,
        distance: 180,
        duration: 580,
        stagger: 100,
        scale: 0.84
      })
    }
  }
];

let model = loadModel();
let activeStateId = model.activeStateId || model.states[0].id;
let previousStateId = model.previousStateId || null;
let selectedObjectId = model.selectedObjectId || "svg";
let isAnimating = false;
let formSyncing = false;

function loadModel() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed?.states?.length) {
      return {
        states: parsed.states.map(normaliseState),
        activeStateId: parsed.activeStateId,
        previousStateId: parsed.previousStateId,
        selectedObjectId: parsed.selectedObjectId
      };
    }
  } catch {}

  return {
    states: structuredClone(DEFAULT_STATES),
    activeStateId: "home",
    previousStateId: null,
    selectedObjectId: "svg"
  };
}

function normaliseState(state) {
  return {
    id: state.id,
    name: state.name,
    objects: Object.fromEntries(
      Object.entries(OBJECTS).map(([objectId, object]) => [
        objectId,
        base(object.role, state.objects?.[objectId] || {})
      ])
    )
  };
}

function saveModel() {
  model.activeStateId = activeStateId;
  model.previousStateId = previousStateId;
  model.selectedObjectId = selectedObjectId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
  flashSaved();
}

function activeState() {
  return model.states.find((state) => state.id === activeStateId) || model.states[0];
}

function stateById(id) {
  return model.states.find((state) => state.id === id) || null;
}

function activeSpec(objectId = selectedObjectId) {
  return activeState().objects[objectId];
}

function renderStateTabs() {
  stateTabs.replaceChildren();

  for (const state of model.states) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "state-tab";
    button.dataset.stateId = state.id;
    button.classList.toggle("is-active", state.id === activeStateId);
    button.innerHTML = `<span>${escapeHtml(state.name)}</span><small>${Object.keys(state.objects).length} objects</small>`;
    button.addEventListener("click", () => switchState(state.id));
    stateTabs.append(button);
  }
}

function renderObjectTabs() {
  objectTabs.replaceChildren();

  for (const [objectId, object] of Object.entries(OBJECTS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "object-tab";
    button.dataset.objectId = objectId;
    button.classList.toggle("is-active", objectId === selectedObjectId);
    button.innerHTML = `<span>${escapeHtml(object.name)}</span><small>${titleCase(object.role)}</small>`;
    button.addEventListener("click", () => selectObject(objectId));
    objectTabs.append(button);
  }
}

function selectObject(objectId) {
  if (!OBJECTS[objectId]) return;
  selectedObjectId = objectId;
  saveModel();
  renderObjectTabs();
  syncSelection();
}

function syncSelection() {
  for (const [objectId, object] of Object.entries(OBJECTS)) {
    object.element.classList.toggle("is-selected", objectId === selectedObjectId);
  }

  const state = activeState();
  const object = OBJECTS[selectedObjectId];
  selectedObjectName.textContent = object.name;
  selectedRole.textContent = titleCase(object.role);
  selectedStateName.textContent = state.name;
  stageStateLabel.textContent = state.name;
  cssTitle.textContent = object.name + " · " + state.name;
  setForm(activeSpec());
  updateCssInspector();
}

async function switchState(nextStateId, { force = false } = {}) {
  if (isAnimating || (!force && nextStateId === activeStateId)) return;
  const nextState = stateById(nextStateId);
  if (!nextState) return;

  const fromState = activeState();
  previousStateId = activeStateId;
  activeStateId = nextStateId;

  renderStateTabs();
  stage.dataset.activeState = nextStateId;
  stage.dataset.transitioning = "true";
  isAnimating = true;

  try {
    await animateAllObjects(fromState, nextState);
  } finally {
    delete stage.dataset.transitioning;
    isAnimating = false;
  }

  for (const object of Object.values(OBJECTS)) {
    object.element.dataset.stageState = nextStateId;
  }

  saveModel();
  syncSelection();
}

async function animateAllObjects(fromState, toState) {
  const jobs = [];
  const pushSpecs = [];

  for (const [index, [objectId, object]] of Object.entries(OBJECTS).entries()) {
    const fromSpec = fromState.objects[objectId];
    const toSpec = toState.objects[objectId];
    const delay = coordinationDelay(toSpec, index);

    jobs.push(
      animateBetweenStates(object.element, stage, fromSpec, toSpec, { delay })
    );

    if (toSpec.transition === "push") pushSpecs.push(toSpec);

    if (objectId === "cards" && toSpec.coordination === "stagger") {
      animateCardChildren(toSpec);
    }
  }

  if (pushSpecs.length) {
    const spec = pushSpecs.find((item) => item.role === "panel") || pushSpecs[0];
    jobs.push(animateStagePush(spec));
  }

  await Promise.all(jobs);
}

function coordinationDelay(spec, index) {
  if (spec.coordination === "follow") return index * Math.min(spec.stagger, 140);
  if (spec.coordination === "swap") return index % 2 === 0 ? 0 : Math.round(spec.stagger * 0.55);
  return 0;
}

function animateCardChildren(spec) {
  [...OBJECTS.cards.element.querySelectorAll(".floating-card")].forEach((card, index) => {
    card.animate(
      [
        { transform: "translateY(24px)", opacity: 0 },
        { transform: "translateY(0)", opacity: 1 }
      ],
      {
        duration: Math.max(220, spec.duration * 0.72),
        delay: index * spec.stagger,
        easing: spec.easing,
        fill: "both"
      }
    );
  });
}

async function animateStagePush(spec) {
  if (!stageContent.animate) return;
  const animation = stageContent.animate(pushCompanionFrames(spec), {
    duration: spec.duration,
    easing: spec.easing
  });
  await animation.finished.catch(() => {});
}

function applyStateImmediately(state) {
  for (const [objectId, object] of Object.entries(OBJECTS)) {
    const spec = state.objects[objectId];
    applyFrame(object.element, destinationFrame(object.element, stage, spec));
    object.element.dataset.stageState = state.id;
  }
  stage.dataset.activeState = state.id;
  stageStateLabel.textContent = state.name;
}

async function replayTransition() {
  if (isAnimating) return;
  const targetState = activeState();
  let fromState = stateById(previousStateId);

  if (!fromState || fromState.id === targetState.id) {
    const currentIndex = model.states.findIndex((state) => state.id === targetState.id);
    fromState = model.states[(currentIndex - 1 + model.states.length) % model.states.length];
  }

  if (!fromState || fromState.id === targetState.id) return;

  applyStateImmediately(fromState);
  await nextFrame();
  isAnimating = true;
  stage.dataset.transitioning = "true";

  try {
    await animateAllObjects(fromState, targetState);
  } finally {
    delete stage.dataset.transitioning;
    isAnimating = false;
  }

  applyStateImmediately(targetState);
  syncSelection();
}

function setForm(specInput) {
  const spec = normaliseSpec(specInput);
  formSyncing = true;

  for (const key of ["transition", "attachment", "coordination", "depth", "direction"]) {
    const radio = form.querySelector(`input[name="${key}"][value="${spec[key]}"]`)
      || form.querySelector(`input[name="${key}"][value="custom"]`);
    if (radio) radio.checked = true;
  }

  form.elements.offsetX.value = spec.offsetX;
  form.elements.offsetY.value = spec.offsetY;
  form.elements.distance.value = spec.distance;
  form.elements.duration.value = spec.duration;
  form.elements.stagger.value = spec.stagger;
  form.elements.blur.value = spec.blur;
  form.elements.scale.value = Math.round(spec.scale * 100);
  form.elements.opacity.value = Math.round(spec.opacity * 100);
  form.elements.easing.value = spec.easing;
  form.elements.customCss.value = spec.customCss;

  syncOutputs();
  formSyncing = false;
}

function readForm() {
  const object = OBJECTS[selectedObjectId];
  return base(object.role, {
    transition: form.elements.transition.value,
    attachment: form.elements.attachment.value,
    coordination: form.elements.coordination.value,
    depth: form.elements.depth.value,
    direction: form.elements.direction.value,
    offsetX: Number(form.elements.offsetX.value),
    offsetY: Number(form.elements.offsetY.value),
    distance: Number(form.elements.distance.value),
    duration: Number(form.elements.duration.value),
    stagger: Number(form.elements.stagger.value),
    blur: Number(form.elements.blur.value),
    scale: Number(form.elements.scale.value) / 100,
    opacity: Number(form.elements.opacity.value) / 100,
    easing: form.elements.easing.value.trim(),
    customCss: form.elements.customCss.value
  });
}

async function updateSelectedSpec() {
  if (formSyncing) return;

  const state = activeState();
  const oldSpec = state.objects[selectedObjectId];
  const newSpec = readForm();
  state.objects[selectedObjectId] = newSpec;

  syncOutputs();
  saveModel();
  updateCssInspector();

  const object = OBJECTS[selectedObjectId];
  await animateBetweenStates(object.element, stage, oldSpec, {
    ...newSpec,
    duration: Math.min(newSpec.duration, 300)
  });

  if (selectedObjectId === "cards" && newSpec.coordination === "stagger") {
    animateCardChildren(newSpec);
  }
}

function updateCssInspector() {
  const object = OBJECTS[selectedObjectId];
  const state = activeState();
  const spec = state.objects[selectedObjectId];
  const frame = destinationFrame(object.element, stage, spec);
  const selector = `[data-object="${selectedObjectId}"]`;

  elementCss.textContent = cssForElement({
    selector,
    stateName: state.id,
    spec,
    frame
  });

  parentCss.textContent = cssForParent({
    stageSelector: "[data-stage]",
    objectSelector: selector,
    spec
  });
}

function syncOutputs() {
  const formats = {
    distance: (value) => value + "px",
    duration: (value) => value + "ms",
    stagger: (value) => value + "ms",
    blur: (value) => value + "px",
    scale: (value) => (Number(value) / 100).toFixed(2),
    opacity: (value) => (Number(value) / 100).toFixed(2)
  };

  for (const [name, format] of Object.entries(formats)) {
    const output = document.querySelector(`[data-output="${name}"]`);
    if (output) output.value = format(form.elements[name].value);
  }
}

function addState() {
  const source = activeState();
  const suggested = "State " + (model.states.length + 1);
  const rawName = window.prompt("Name this state", suggested);
  const name = rawName?.replace(/\s+/g, " ").trim();
  if (!name) return;

  const id = uniqueStateId(slugify(name));
  const state = structuredClone(source);
  state.id = id;
  state.name = name;
  model.states.push(state);
  previousStateId = activeStateId;
  activeStateId = id;

  applyStateImmediately(state);
  saveModel();
  renderStateTabs();
  syncSelection();
}

function uniqueStateId(baseId) {
  const root = baseId || "state";
  let candidate = root;
  let index = 2;
  while (model.states.some((state) => state.id === candidate)) {
    candidate = root + "-" + index;
    index += 1;
  }
  return candidate;
}

function resetDemo() {
  if (!window.confirm("Reset the playground back to the example Home, Room and Cloud states?")) return;
  model = {
    states: structuredClone(DEFAULT_STATES),
    activeStateId: "home",
    previousStateId: null,
    selectedObjectId: "svg"
  };
  activeStateId = "home";
  previousStateId = null;
  selectedObjectId = "svg";
  localStorage.removeItem(STORAGE_KEY);
  renderStateTabs();
  renderObjectTabs();
  applyStateImmediately(activeState());
  syncSelection();
  saveModel();
}

function flashSaved() {
  stateDirtyBadge.textContent = "Saved";
  stateDirtyBadge.classList.add("is-flashing");
  clearTimeout(flashSaved.timer);
  flashSaved.timer = setTimeout(() => stateDirtyBadge.classList.remove("is-flashing"), 450);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function titleCase(value) {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

for (const [objectId, object] of Object.entries(OBJECTS)) {
  object.element.addEventListener("click", (event) => {
    event.stopPropagation();
    selectObject(objectId);
  });

  if (objectId === "cards") {
    object.element.querySelectorAll(".floating-card").forEach((card) => {
      card.addEventListener("click", (event) => {
        event.stopPropagation();
        selectObject("cards");
      });
    });
  }
}

form.addEventListener("input", updateSelectedSpec);
form.addEventListener("change", updateSelectedSpec);
addStateButton.addEventListener("click", addState);
resetButton.addEventListener("click", resetDemo);
replayButton.addEventListener("click", replayTransition);

renderStateTabs();
renderObjectTabs();
applyStateImmediately(activeState());
syncSelection();
