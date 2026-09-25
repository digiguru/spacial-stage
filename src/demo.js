import "./styles.css";
import {
  animateBetweenStates,
  applyFrame,
  captureNaturalSize,
  cssForElement,
  cssForParent,
  destinationFrame,
  layoutCompanionFrames,
  normaliseSpec,
  positionValuesForCoordinates,
  resolvePosition,
  resolveSize,
  sizeValuesForDimensions
} from "./spacial-stage.js";

const STORAGE_KEY = "spacial-stage-state-authoring-v3";

const stage = document.querySelector("#stage");
const stageContent = document.querySelector("#stageContent");
const form = document.querySelector("#motionForm");
const stateTabs = document.querySelector("#stateTabs");
const objectTabs = document.querySelector("#objectTabs");
const addStateButton = document.querySelector("#addStateButton");
const removeStateButton = document.querySelector("#removeStateButton");
const resetButton = document.querySelector("#resetButton");
const replayButton = document.querySelector("#replayButton");
const stageStateLabel = document.querySelector("#stageStateLabel");
const selectedObjectName = document.querySelector("#selectedObjectName");
const selectedRole = document.querySelector("#selectedRole");
const selectedStateName = document.querySelector("#selectedStateName");
const stateNameInput = document.querySelector("#stateNameInput");
const cssTitle = document.querySelector("#cssTitle");
const elementCss = document.querySelector("#elementCss");
const parentCss = document.querySelector("#parentCss");
const stateDirtyBadge = document.querySelector("#stateDirtyBadge");
const selectionOverlay = document.querySelector("#selectionOverlay");
const selectionOverlayLabel = document.querySelector("#selectionOverlayLabel");
const selectionResizeHandle = document.querySelector("#selectionResizeHandle");
const positionXUnit = document.querySelector("#positionXUnit");
const positionYUnit = document.querySelector("#positionYUnit");
const sizeWidthUnit = document.querySelector("#sizeWidthUnit");
const sizeHeightUnit = document.querySelector("#sizeHeightUnit");
const zIndexWarning = document.querySelector("#zIndexWarning");

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

for (const object of Object.values(OBJECTS)) {
  captureNaturalSize(object.element);
}

const base = (role, overrides = {}) => normaliseSpec({
  role,
  layout: "overlay",
  attachment: "free",
  coordination: "none",
  depth: "focus",
  zIndex: 10,
  rotateZ: 0,
  rotateX: 0,
  rotateY: 0,
  translateZ: 0,
  perspective: 1000,
  direction: "auto",
  horizontalAnchor: "center",
  verticalAnchor: "center",
  positionMode: "absolute",
  positionX: 0,
  positionY: 0,
  distance: 180,
  duration: 700,
  stagger: 80,
  blur: 0,
  scale: 1,
  opacity: 1,
  easing: "cubic-bezier(.2,.82,.24,1)",
  customVector: { x: -1, y: 0 },
  customCss: "",
  ...overrides
});

const DEFAULT_STATES = [
  {
    id: "home",
    name: "Home",
    objects: {
      svg: base("shared", {
        animations: ["slide"],
        layout: "overlay",
        depth: "blur",
        zIndex: 1,
        direction: "right",
        horizontalAnchor: "right",
        verticalAnchor: "bottom",
        positionMode: "percent",
        positionX: -7,
        positionY: -7,
        distance: 340,
        duration: 840,
        scale: 1.08
      }),
      panel: base("panel", {
        animations: ["reveal", "fade"],
        layout: "overlay",
        attachment: "free",
        depth: "blur",
        zIndex: 1,
        direction: "left",
        horizontalAnchor: "left",
        verticalAnchor: "center",
        positionMode: "absolute",
        positionX: -165,
        positionY: 0,
        opacity: 0.45,
        duration: 600
      }),
      copy: base("content", {
        animations: ["reveal"],
        layout: "overlay",
        depth: "focus",
        zIndex: 10,
        direction: "left",
        horizontalAnchor: "left",
        verticalAnchor: "center",
        positionMode: "percent",
        positionX: 8,
        positionY: -12,
        distance: 130,
        duration: 620
      }),
      cards: base("collection", {
        animations: ["reveal"],
        layout: "overlay",
        attachment: "float",
        coordination: "stagger",
        depth: "focus",
        zIndex: 20,
        direction: "bottom",
        horizontalAnchor: "right",
        verticalAnchor: "bottom",
        positionMode: "percent",
        positionX: -5,
        positionY: -8,
        rotateZ: -3,
        rotateX: 4,
        rotateY: -7,
        translateZ: 20,
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
        animations: ["slide", "focus"],
        layout: "overlay",
        depth: "focus",
        zIndex: 10,
        direction: "left",
        horizontalAnchor: "center",
        verticalAnchor: "center",
        positionMode: "percent",
        positionX: 4,
        positionY: 5,
        distance: 300,
        duration: 800,
        scale: 0.9
      }),
      panel: base("panel", {
        animations: ["slide", "fade"],
        layout: "push",
        attachment: "dock",
        depth: "focus",
        zIndex: 20,
        direction: "left",
        horizontalAnchor: "left",
        verticalAnchor: "center",
        positionMode: "absolute",
        positionX: 0,
        positionY: 0,
        distance: 260,
        duration: 720,
        scale: 0.98
      }),
      copy: base("content", {
        animations: ["fade"],
        layout: "overlay",
        depth: "blur",
        zIndex: 1,
        direction: "top",
        horizontalAnchor: "right",
        verticalAnchor: "top",
        positionMode: "percent",
        positionX: -8,
        positionY: 7,
        distance: 150,
        duration: 560,
        opacity: 0.72,
        scale: 0.88
      }),
      cards: base("collection", {
        animations: ["reveal"],
        layout: "overlay",
        attachment: "float",
        coordination: "stagger",
        depth: "focus",
        zIndex: 20,
        direction: "right",
        horizontalAnchor: "right",
        verticalAnchor: "top",
        positionMode: "percent",
        positionX: -6,
        positionY: 10,
        rotateZ: 2,
        rotateX: -5,
        rotateY: 8,
        translateZ: 36,
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
        animations: ["slide"],
        layout: "overlay",
        depth: "blur",
        zIndex: 1,
        direction: "left",
        horizontalAnchor: "left",
        verticalAnchor: "center",
        positionMode: "percent",
        positionX: -18,
        positionY: -8,
        distance: 350,
        duration: 860,
        scale: 1.18
      }),
      panel: base("panel", {
        animations: ["slide"],
        layout: "push",
        attachment: "dock",
        depth: "focus",
        zIndex: 20,
        direction: "left",
        horizontalAnchor: "left",
        verticalAnchor: "center",
        positionMode: "absolute",
        positionX: 0,
        positionY: 0,
        distance: 250,
        duration: 720
      }),
      copy: base("content", {
        animations: ["reveal"],
        layout: "overlay",
        depth: "focus",
        zIndex: 10,
        direction: "top",
        horizontalAnchor: "right",
        verticalAnchor: "top",
        positionMode: "percent",
        positionX: -6,
        positionY: 8,
        distance: 170,
        duration: 620,
        scale: 0.92
      }),
      cards: base("collection", {
        animations: ["reveal"],
        layout: "overlay",
        attachment: "float",
        coordination: "follow",
        depth: "focus",
        zIndex: 20,
        direction: "right",
        horizontalAnchor: "right",
        verticalAnchor: "bottom",
        positionMode: "percent",
        positionX: -5,
        positionY: -7,
        rotateZ: -1,
        rotateX: 3,
        rotateY: -5,
        translateZ: 24,
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
let replayTimer = null;
let replaySequence = 0;
let dragState = null;
let resizeState = null;

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

function replaySourceState() {
  const explicit = stateById(previousStateId);

  if (explicit && explicit.id !== activeStateId) {
    return explicit;
  }

  const currentIndex = model.states.findIndex((state) => state.id === activeStateId);

  if (currentIndex < 0 || model.states.length < 2) {
    return null;
  }

  return model.states[(currentIndex - 1 + model.states.length) % model.states.length];
}

function renderStateTabs() {
  stateTabs.replaceChildren();
  removeStateButton.disabled = model.states.length <= 1;

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
  const state = activeState();
  const object = OBJECTS[selectedObjectId];

  selectedObjectName.textContent = object.name;
  selectedRole.textContent = titleCase(object.role);
  selectedStateName.textContent = state.name;
  stageStateLabel.textContent = state.name;
  stateNameInput.value = state.name;
  cssTitle.textContent = object.name + " · " + state.name;
  selectionOverlayLabel.textContent = object.name;

  setForm(activeSpec());
  updateCssInspector();
  updateZIndexWarning();
  updateSelectionOverlay();
}

function updateSelectionOverlay() {
  const object = OBJECTS[selectedObjectId];

  if (!object?.element) {
    selectionOverlay.hidden = true;
    return;
  }

  const destination = measureDestinationRect(
    object.element,
    activeSpec(selectedObjectId)
  );
  const stageRect = stage.getBoundingClientRect();

  if (!destination || !destination.width || !destination.height) {
    selectionOverlay.hidden = true;
    return;
  }

  selectionOverlay.hidden = false;
  selectionOverlay.style.left = (destination.left - stageRect.left) + "px";
  selectionOverlay.style.top = (destination.top - stageRect.top) + "px";
  selectionOverlay.style.width = destination.width + "px";
  selectionOverlay.style.height = destination.height + "px";
  selectionOverlay.style.borderRadius = destination.borderRadius;
}

function measureDestinationRect(element, spec) {
  const clone = element.cloneNode(true);

  clone.removeAttribute("id");
  clone.removeAttribute("data-object");
  clone.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  clone.querySelectorAll("[data-object]").forEach((node) => node.removeAttribute("data-object"));
  clone.classList.remove("is-dragging");

  Object.assign(clone.style, {
    visibility: "hidden",
    pointerEvents: "none",
    transition: "none",
    animation: "none"
  });

  element.parentElement.append(clone);

  try {
    applyFrame(clone, destinationFrame(clone, stage, spec));

    const rect = clone.getBoundingClientRect();

    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      borderRadius: getComputedStyle(clone).borderRadius || "12px"
    };
  } finally {
    clone.remove();
  }
}

async function switchState(nextStateId, { force = false } = {}) {
  if (isAnimating || (!force && nextStateId === activeStateId)) return;

  const nextState = stateById(nextStateId);
  if (!nextState) return;

  clearTimeout(replayTimer);
  replaySequence += 1;
  cancelObjectAnimations();

  const fromState = activeState();
  previousStateId = activeStateId;
  activeStateId = nextStateId;

  renderStateTabs();
  stage.dataset.activeState = nextStateId;
  updateSelectionOverlay();
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
  const layoutCandidates = [];

  Object.entries(OBJECTS).forEach(([objectId, object], index) => {
    const fromSpec = fromState.objects[objectId];
    const toSpec = toState.objects[objectId];
    const delay = coordinationDelay(toSpec, index);

    jobs.push(
      animateBetweenStates(object.element, stage, fromSpec, toSpec, { delay })
    );

    if (toSpec.layout !== "overlay") {
      layoutCandidates.push({ objectId, spec: toSpec });
    }

    if (objectId === "cards" && toSpec.coordination === "stagger") {
      animateCardChildren(toSpec);
    }
  });

  if (layoutCandidates.length) {
    const chosen =
      layoutCandidates.find((item) => item.spec.role === "panel")
      || layoutCandidates[0];

    jobs.push(animateStageLayout(chosen.spec));
  }

  await Promise.all(jobs);
}

function coordinationDelay(spec, index) {
  if (spec.coordination === "follow") {
    return index * Math.min(spec.stagger, 140);
  }

  if (spec.coordination === "swap") {
    return index % 2 === 0 ? 0 : Math.round(spec.stagger * 0.55);
  }

  return 0;
}

function animateCardChildren(spec) {
  [...OBJECTS.cards.element.querySelectorAll(".floating-card")].forEach((card, index) => {
    card.getAnimations().forEach((animation) => animation.cancel());

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

async function animateStageLayout(spec) {
  const frames = layoutCompanionFrames(spec);

  if (!frames || !stageContent.animate) return null;

  stageContent.getAnimations().forEach((animation) => animation.cancel());

  const animation = stageContent.animate(frames, {
    duration: spec.duration,
    easing: spec.easing
  });

  try {
    await animation.finished;
  } catch {}

  return animation;
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
  const fromState = replaySourceState();

  if (!fromState || fromState.id === targetState.id) return;

  clearTimeout(replayTimer);
  replaySequence += 1;
  cancelObjectAnimations();
  updateSelectionOverlay();

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

  for (const checkbox of form.querySelectorAll('input[name="animations"]')) {
    checkbox.checked = spec.animations.includes(checkbox.value);
  }

  for (const key of [
    "layout",
    "attachment",
    "coordination",
    "depth",
    "direction",
    "horizontalAnchor",
    "verticalAnchor",
    "positionMode",
    "sizeMode"
  ]) {
    const radio =
      form.querySelector(`input[name="${key}"][value="${spec[key]}"]`)
      || form.querySelector(`input[name="${key}"][value="custom"]`);

    if (radio) radio.checked = true;
  }

  const resolvedSize = resolveSize(OBJECTS[selectedObjectId].element, stage, spec);

  form.elements.positionX.value = formatPositionNumber(spec.positionX, spec.positionMode);
  form.elements.positionY.value = formatPositionNumber(spec.positionY, spec.positionMode);
  form.elements.sizeWidth.value = formatSizeNumber(
    spec.sizeMode === "natural" ? resolvedSize.width : spec.sizeWidth,
    spec.sizeMode
  );
  form.elements.sizeHeight.value = formatSizeNumber(
    spec.sizeMode === "natural" ? resolvedSize.height : spec.sizeHeight,
    spec.sizeMode
  );
  form.elements.customX.value = spec.customVector.x;
  form.elements.customY.value = spec.customVector.y;
  form.elements.distance.value = spec.distance;
  form.elements.duration.value = spec.duration;
  form.elements.stagger.value = spec.stagger;
  form.elements.blur.value = spec.blur;
  form.elements.scale.value = Math.round(spec.scale * 100);
  form.elements.opacity.value = Math.round(spec.opacity * 100);
  form.elements.zIndex.value = spec.zIndex;
  form.elements.rotateZ.value = spec.rotateZ;
  form.elements.rotateX.value = spec.rotateX;
  form.elements.rotateY.value = spec.rotateY;
  form.elements.translateZ.value = spec.translateZ;
  form.elements.perspective.value = spec.perspective;
  form.elements.easing.value = spec.easing;
  form.elements.customCss.value = spec.customCss;

  syncOutputs();
  syncPositionUnits(spec.positionMode);
  syncSizeUnits(spec.sizeMode);
  syncSizeInputs(spec.sizeMode);
  refreshParameterHelp();
  formSyncing = false;
}

function readForm() {
  const object = OBJECTS[selectedObjectId];

  return base(object.role, {
    animations: [...form.querySelectorAll('input[name="animations"]:checked')]
      .map((input) => input.value),
    layout: form.elements.layout.value,
    attachment: form.elements.attachment.value,
    coordination: form.elements.coordination.value,
    depth: form.elements.depth.value,
    direction: form.elements.direction.value,
    horizontalAnchor: form.elements.horizontalAnchor.value,
    verticalAnchor: form.elements.verticalAnchor.value,
    positionMode: form.elements.positionMode.value,
    positionX: Number(form.elements.positionX.value),
    positionY: Number(form.elements.positionY.value),
    sizeMode: form.elements.sizeMode.value,
    sizeWidth: Number(form.elements.sizeWidth.value),
    sizeHeight: Number(form.elements.sizeHeight.value),
    customVector: {
      x: Number(form.elements.customX.value),
      y: Number(form.elements.customY.value)
    },
    distance: Number(form.elements.distance.value),
    duration: Number(form.elements.duration.value),
    stagger: Number(form.elements.stagger.value),
    blur: Number(form.elements.blur.value),
    scale: Number(form.elements.scale.value) / 100,
    opacity: Number(form.elements.opacity.value) / 100,
    zIndex: Number(form.elements.zIndex.value),
    rotateZ: Number(form.elements.rotateZ.value),
    rotateX: Number(form.elements.rotateX.value),
    rotateY: Number(form.elements.rotateY.value),
    translateZ: Number(form.elements.translateZ.value),
    perspective: Number(form.elements.perspective.value),
    easing: form.elements.easing.value.trim(),
    customCss: form.elements.customCss.value
  });
}

function updateSelectedSpec(event) {
  if (formSyncing || dragState || resizeState) return;

  const state = activeState();
  const object = OBJECTS[selectedObjectId];
  const oldSpec = state.objects[selectedObjectId];
  let newSpec = readForm();

  if (preservesVisualPosition(event?.target?.name)) {
    const resolved = resolvePosition(object.element, stage, oldSpec);
    const currentLeft = object.element.offsetLeft + resolved.x;
    const currentTop = object.element.offsetTop + resolved.y;
    const converted = positionValuesForCoordinates(
      object.element,
      stage,
      newSpec,
      { left: currentLeft, top: currentTop }
    );

    newSpec = normaliseSpec({
      ...newSpec,
      ...converted
    });

    formSyncing = true;
    form.elements.positionX.value = formatPositionNumber(newSpec.positionX, newSpec.positionMode);
    form.elements.positionY.value = formatPositionNumber(newSpec.positionY, newSpec.positionMode);
    formSyncing = false;
  }

  if (event?.target?.name === "sizeMode" && newSpec.sizeMode !== "natural") {
    const currentSize = resolveSize(object.element, stage, oldSpec);
    const convertedSize = sizeValuesForDimensions(
      object.element,
      stage,
      newSpec,
      currentSize
    );

    newSpec = normaliseSpec({
      ...newSpec,
      ...convertedSize
    });

    formSyncing = true;
    form.elements.sizeWidth.value = formatSizeNumber(newSpec.sizeWidth, newSpec.sizeMode);
    form.elements.sizeHeight.value = formatSizeNumber(newSpec.sizeHeight, newSpec.sizeMode);
    formSyncing = false;
  }

  state.objects[selectedObjectId] = newSpec;

  syncOutputs();
  syncPositionUnits(newSpec.positionMode);
  syncSizeUnits(newSpec.sizeMode);
  syncSizeInputs(newSpec.sizeMode);
  refreshParameterHelp();
  saveModel();
  updateCssInspector();
  updateZIndexWarning();
  updateSelectionOverlay();
  scheduleSelectedReplay();
}

function preservesVisualPosition(fieldName) {
  return fieldName === "horizontalAnchor"
    || fieldName === "verticalAnchor"
    || fieldName === "positionMode";
}

function scheduleSelectedReplay() {
  clearTimeout(replayTimer);

  replayTimer = setTimeout(() => {
    void replaySelectedObjectFromPrevious();
  }, 70);
}

async function replaySelectedObjectFromPrevious() {
  const sourceState = replaySourceState();

  if (!sourceState || sourceState.id === activeStateId) return;

  const object = OBJECTS[selectedObjectId];
  const sourceSpec = sourceState.objects[selectedObjectId];
  const targetSpec = activeSpec();
  const sequence = ++replaySequence;

  updateSelectionOverlay();
  object.element.getAnimations().forEach((animation) => animation.cancel());

  if (selectedObjectId === "cards") {
    object.element.querySelectorAll(".floating-card").forEach((card) => {
      card.getAnimations().forEach((animation) => animation.cancel());
    });
  }

  applyFrame(
    object.element,
    destinationFrame(object.element, stage, sourceSpec)
  );

  await nextFrame();

  if (sequence !== replaySequence) return;

  const jobs = [
    animateBetweenStates(
      object.element,
      stage,
      sourceSpec,
      targetSpec
    )
  ];

  if (targetSpec.layout !== "overlay") {
    jobs.push(animateStageLayout(targetSpec));
  }

  if (selectedObjectId === "cards" && targetSpec.coordination === "stagger") {
    animateCardChildren(targetSpec);
  }

  await Promise.all(jobs);
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
    opacity: (value) => (Number(value) / 100).toFixed(2),
    rotateZ: (value) => value + "°",
    rotateX: (value) => value + "°",
    rotateY: (value) => value + "°"
  };

  for (const [name, format] of Object.entries(formats)) {
    const output = document.querySelector(`[data-output="${name}"]`);

    if (output) {
      output.value = format(form.elements[name].value);
    }
  }
}

function refreshParameterHelp() {
  for (const helpArea of form.querySelectorAll("[data-help-for]")) {
    const name = helpArea.dataset.helpFor;
    const selected = [
      ...form.querySelectorAll(`input[name="${name}"]:checked`)
    ];

    helpArea.replaceChildren();

    if (!selected.length) {
      if (name === "animations") {
        const paragraph = document.createElement("p");
        paragraph.textContent =
          "No animations selected. The object snaps directly to its destination state.";
        helpArea.append(paragraph);
      }
      continue;
    }

    for (const input of selected) {
      const sentence = input.dataset.help?.trim();
      if (!sentence) continue;

      const paragraph = document.createElement("p");
      paragraph.textContent = sentence;
      helpArea.append(paragraph);
    }
  }
}

function syncPositionUnits(positionMode) {
  const unit = positionMode === "percent" ? "%" : "px";
  positionXUnit.textContent = unit;
  positionYUnit.textContent = unit;
}

function syncSizeUnits(sizeMode) {
  const unit = sizeMode === "percent" ? "%" : "px";
  sizeWidthUnit.textContent = unit;
  sizeHeightUnit.textContent = unit;
}

function syncSizeInputs(sizeMode) {
  const disabled = sizeMode === "natural";
  form.elements.sizeWidth.disabled = disabled;
  form.elements.sizeHeight.disabled = disabled;
}

function updateZIndexWarning() {
  const values = model.states.map((state) => ({
    name: state.name,
    zIndex: normaliseSpec(state.objects[selectedObjectId]).zIndex
  }));
  const unique = new Set(values.map((item) => item.zIndex));

  if (unique.size <= 1) {
    zIndexWarning.hidden = true;
    zIndexWarning.textContent = "";
    return;
  }

  zIndexWarning.hidden = false;
  zIndexWarning.textContent =
    "Z-index differs between states: "
    + values.map((item) => item.name + " " + item.zIndex).join(" · ")
    + ". This can change stacking order during transitions.";
}

function addState() {
  const source = activeState();
  const name = "New State";
  const id = uniqueStateId("new-state");
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

  requestAnimationFrame(() => {
    stateNameInput.focus();
    stateNameInput.select();
  });
}

function removeActiveState() {
  if (model.states.length <= 1) return;

  clearTimeout(replayTimer);
  replaySequence += 1;
  cancelObjectAnimations();

  const index = model.states.findIndex((state) => state.id === activeStateId);
  if (index < 0) return;

  const removedId = activeStateId;
  model.states.splice(index, 1);

  const nextState = model.states[Math.min(index, model.states.length - 1)];
  activeStateId = nextState.id;

  if (previousStateId === removedId || !stateById(previousStateId)) {
    previousStateId = null;
  }

  applyStateImmediately(nextState);
  saveModel();
  renderStateTabs();
  syncSelection();
}

function renameActiveState(value) {
  const state = activeState();
  const name = String(value).replace(/\s+/g, " ").slice(0, 60);

  state.name = name || "New State";
  selectedStateName.textContent = state.name;
  stageStateLabel.textContent = state.name;
  cssTitle.textContent = OBJECTS[selectedObjectId].name + " · " + state.name;

  const activeTab = stateTabs.querySelector(`[data-state-id="${state.id}"] span`);
  if (activeTab) activeTab.textContent = state.name;

  updateZIndexWarning();
  saveModel();
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

  clearTimeout(replayTimer);
  replaySequence += 1;
  cancelObjectAnimations();

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

function beginDrag(event, objectId) {
  if (event.button !== undefined && event.button !== 0) return;

  event.preventDefault();
  event.stopPropagation();

  selectObject(objectId);

  const object = OBJECTS[objectId];
  const spec = activeState().objects[objectId];
  const resolved = resolvePosition(object.element, stage, spec);

  object.element.getAnimations().forEach((animation) => animation.cancel());
  clearTimeout(replayTimer);
  replaySequence += 1;

  dragState = {
    objectId,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startLeft: object.element.offsetLeft + resolved.x,
    startTop: object.element.offsetTop + resolved.y,
    moved: false
  };

  stage.classList.add("is-dragging");
  object.element.classList.add("is-dragging");
  selectionOverlayLabel.textContent = "Dragging · " + object.name;

  object.element.setPointerCapture?.(event.pointerId);
}

function moveDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;

  const object = OBJECTS[dragState.objectId];
  const state = activeState();
  const spec = state.objects[dragState.objectId];
  const deltaX = event.clientX - dragState.startClientX;
  const deltaY = event.clientY - dragState.startClientY;

  if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
    dragState.moved = true;
  }

  const values = positionValuesForCoordinates(
    object.element,
    stage,
    spec,
    {
      left: dragState.startLeft + deltaX,
      top: dragState.startTop + deltaY
    }
  );

  const nextSpec = normaliseSpec({
    ...spec,
    positionX: values.positionX,
    positionY: values.positionY
  });

  state.objects[dragState.objectId] = nextSpec;

  applyFrame(
    object.element,
    destinationFrame(object.element, stage, nextSpec)
  );

  if (dragState.objectId === selectedObjectId) {
    formSyncing = true;
    form.elements.positionX.value = formatPositionNumber(nextSpec.positionX, nextSpec.positionMode);
    form.elements.positionY.value = formatPositionNumber(nextSpec.positionY, nextSpec.positionMode);
    formSyncing = false;
    updateCssInspector();
    updateSelectionOverlay();
  }
}

function endDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;

  const object = OBJECTS[dragState.objectId];

  object.element.releasePointerCapture?.(event.pointerId);
  object.element.classList.remove("is-dragging");
  stage.classList.remove("is-dragging");

  selectionOverlayLabel.textContent = object.name;

  dragState = null;
  saveModel();
  setForm(activeSpec());
  updateCssInspector();
}

function beginResize(event) {
  if (event.button !== undefined && event.button !== 0) return;

  event.preventDefault();
  event.stopPropagation();

  const object = OBJECTS[selectedObjectId];
  if (!object) return;

  clearTimeout(replayTimer);
  replaySequence += 1;
  object.element.getAnimations().forEach((animation) => animation.cancel());

  const state = activeState();
  let spec = state.objects[selectedObjectId];
  const startRect = measureDestinationRect(object.element, spec);
  const currentSize = resolveSize(object.element, stage, spec);

  if (spec.sizeMode === "natural") {
    spec = normaliseSpec({
      ...spec,
      sizeMode: "absolute",
      sizeWidth: currentSize.width,
      sizeHeight: currentSize.height
    });
    state.objects[selectedObjectId] = spec;
    setForm(spec);
  }

  resizeState = {
    objectId: selectedObjectId,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startRect,
    startSpec: spec
  };

  stage.classList.add("is-resizing");
  selectionOverlayLabel.textContent = "Resizing · " + object.name;
  selectionResizeHandle.setPointerCapture?.(event.pointerId);
}

function moveResize(event) {
  if (!resizeState || event.pointerId !== resizeState.pointerId) return;

  const object = OBJECTS[resizeState.objectId];
  const state = activeState();
  const spec = resizeState.startSpec;
  const depthScale = Math.max(0.05, spec.scale || 1);
  const deltaX = event.clientX - resizeState.startClientX;
  const deltaY = event.clientY - resizeState.startClientY;

  const visualWidth = Math.max(32, resizeState.startRect.width + deltaX);
  const visualHeight = Math.max(32, resizeState.startRect.height + deltaY);
  const layoutWidth = visualWidth / depthScale;
  const layoutHeight = visualHeight / depthScale;

  const sizeValues = sizeValuesForDimensions(
    object.element,
    stage,
    spec,
    { width: layoutWidth, height: layoutHeight }
  );

  let nextSpec = normaliseSpec({
    ...spec,
    ...sizeValues
  });

  const stageRect = stage.getBoundingClientRect();
  const layoutLeft =
    resizeState.startRect.left - stageRect.left
    + (visualWidth - layoutWidth) / 2;
  const layoutTop =
    resizeState.startRect.top - stageRect.top
    + (visualHeight - layoutHeight) / 2;

  const positionValues = positionValuesForCoordinates(
    object.element,
    stage,
    nextSpec,
    { left: layoutLeft, top: layoutTop }
  );

  nextSpec = normaliseSpec({
    ...nextSpec,
    ...positionValues
  });

  state.objects[resizeState.objectId] = nextSpec;

  applyFrame(
    object.element,
    destinationFrame(object.element, stage, nextSpec)
  );

  formSyncing = true;
  form.elements.sizeWidth.value = formatSizeNumber(nextSpec.sizeWidth, nextSpec.sizeMode);
  form.elements.sizeHeight.value = formatSizeNumber(nextSpec.sizeHeight, nextSpec.sizeMode);
  form.elements.positionX.value = formatPositionNumber(nextSpec.positionX, nextSpec.positionMode);
  form.elements.positionY.value = formatPositionNumber(nextSpec.positionY, nextSpec.positionMode);
  formSyncing = false;

  updateCssInspector();
  updateSelectionOverlay();
}

function endResize(event) {
  if (!resizeState || event.pointerId !== resizeState.pointerId) return;

  const object = OBJECTS[resizeState.objectId];

  selectionResizeHandle.releasePointerCapture?.(event.pointerId);
  stage.classList.remove("is-resizing");
  selectionOverlayLabel.textContent = object.name;

  resizeState = null;
  saveModel();
  setForm(activeSpec());
  updateCssInspector();
  updateSelectionOverlay();
}

function cancelObjectAnimations() {
  for (const object of Object.values(OBJECTS)) {
    object.element.getAnimations().forEach((animation) => animation.cancel());
    object.element.querySelectorAll?.("*").forEach((child) => {
      child.getAnimations?.().forEach((animation) => animation.cancel());
    });
  }

  stageContent.getAnimations().forEach((animation) => animation.cancel());
}

function flashSaved() {
  stateDirtyBadge.textContent = "Saved";
  stateDirtyBadge.classList.add("is-flashing");

  clearTimeout(flashSaved.timer);
  flashSaved.timer = setTimeout(
    () => stateDirtyBadge.classList.remove("is-flashing"),
    450
  );
}

function formatPositionNumber(value, mode) {
  const digits = mode === "percent" ? 2 : 1;
  return String(Number(Number(value).toFixed(digits)));
}

function formatSizeNumber(value, mode) {
  const digits = mode === "percent" ? 2 : 1;
  return String(Number(Number(value).toFixed(digits)));
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
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

for (const [objectId, object] of Object.entries(OBJECTS)) {
  object.element.addEventListener("click", (event) => {
    if (dragState?.moved) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    selectObject(objectId);
  });

  object.element.addEventListener("pointerdown", (event) => {
    beginDrag(event, objectId);
  });
}

selectionResizeHandle.addEventListener("pointerdown", beginResize);

window.addEventListener("pointermove", moveResize);
window.addEventListener("pointerup", endResize);
window.addEventListener("pointercancel", endResize);
window.addEventListener("pointermove", moveDrag);
window.addEventListener("pointerup", endDrag);
window.addEventListener("pointercancel", endDrag);
window.addEventListener("resize", updateSelectionOverlay);

form.addEventListener("input", (event) => {
  updateSelectedSpec(event);
});

form.addEventListener("change", (event) => {
  updateSelectedSpec(event);
});

addStateButton.addEventListener("click", addState);
removeStateButton.addEventListener("click", removeActiveState);
stateNameInput.addEventListener("input", (event) => {
  renameActiveState(event.target.value);
});
stateNameInput.addEventListener("blur", () => {
  if (!stateNameInput.value.trim()) {
    stateNameInput.value = activeState().name;
  }
});
resetButton.addEventListener("click", resetDemo);
replayButton.addEventListener("click", () => {
  void replayTransition();
});

renderStateTabs();
renderObjectTabs();
applyStateImmediately(activeState());
syncSelection();
