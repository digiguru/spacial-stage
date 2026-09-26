import {
  prefersReducedMotion,
  resolveDepthOfField
} from "../spacial-stage.js";

const SLICE_COUNT = 28;
const scene = document.querySelector("#dofScene");
const card = document.querySelector("#dofCard");
const slicesRoot = document.querySelector("#dofSlices");
const replayButton = document.querySelector("#dofReplay");
const stateButtons = [...document.querySelectorAll("[data-dof-state]")];

const controls = {
  focalLength: document.querySelector("#dofFocalLength"),
  focusDepth: document.querySelector("#dofFocusPlane"),
  focusArea: document.querySelector("#dofFocusArea"),
  maxBlur: document.querySelector("#dofBlur"),
  yaw: document.querySelector("#dofYaw")
};

const outputs = {
  focalLength: document.querySelector("#dofFocalLengthValue"),
  focusDepth: document.querySelector("#dofFocusPlaneValue"),
  focusArea: document.querySelector("#dofFocusAreaValue"),
  maxBlur: document.querySelector("#dofBlurValue"),
  yaw: document.querySelector("#dofYawValue")
};

const profileBand = document.querySelector("#dofProfileBand");
const profilePlane = document.querySelector("#dofProfilePlane");

const params = {
  focalLength: 850,
  focusDepth: 0,
  focusArea: 0.24,
  maxBlur: 14,
  yaw: 58
};

const focusPresets = {
  near: 0.56,
  middle: 0,
  far: -0.56
};

let currentState = "middle";
let running = false;
let pendingState = null;
let animationToken = 0;

const surfaceMarkup = `
  <div class="dof-surface">
    <span class="dof-kicker">Spatial typography</span>
    <strong>Depth can be selective.</strong>
    <p>The middle of one 3D surface can remain sharp while its near and far edges fall out of focus.</p>
    <small>Focus is a region in depth, not just a property of the whole object.</small>
  </div>
`;

const slices = Array.from({ length: SLICE_COUNT }, (_, index) => {
  const slice = document.createElement("div");
  const start = (index / SLICE_COUNT) * 100;
  const end = ((index + 1) / SLICE_COUNT) * 100;
  const overlap = 0.08;

  slice.className = "dof-slice";
  slice.style.clipPath =
    `inset(0 ${Math.max(0, 100 - end - overlap)}% 0 ${Math.max(0, start - overlap)}%)`;
  slice.innerHTML = surfaceMarkup;
  slicesRoot.append(slice);
  return slice;
});

function depthToPercent(depth) {
  return ((1 - Math.max(-1, Math.min(1, depth))) / 2) * 100;
}

function syncStateButtons(target = currentState) {
  stateButtons.forEach((button) => {
    const active = button.dataset.dofState === target;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function clearStateButtons() {
  currentState = null;
  stateButtons.forEach((button) => {
    button.classList.remove("is-active");
    button.setAttribute("aria-pressed", "false");
  });
}

function updateProfile() {
  const halfArea = params.focusArea / 2;
  const nearDepth = Math.min(1, params.focusDepth + halfArea);
  const farDepth = Math.max(-1, params.focusDepth - halfArea);
  const start = depthToPercent(nearDepth);
  const end = depthToPercent(farDepth);

  profileBand.style.left = `${start}%`;
  profileBand.style.width = `${Math.max(1, end - start)}%`;
  profilePlane.style.left = `${depthToPercent(params.focusDepth)}%`;
}

function render() {
  scene.style.perspective = `${params.focalLength}px`;
  card.style.transform =
    `rotateX(-11deg) rotateY(${params.yaw}deg) rotateZ(-2deg)`;

  const yawRadians = params.yaw * (Math.PI / 180);
  const depthScale = Math.sin(yawRadians);

  slices.forEach((slice, index) => {
    const x = ((index + 0.5) / SLICE_COUNT) * 2 - 1;
    const depth = -x * depthScale;
    const focus = resolveDepthOfField({
      depth,
      focusDepth: params.focusDepth,
      focusArea: params.focusArea,
      maxBlur: params.maxBlur,
      falloff: 1.45
    });

    slice.style.filter = `blur(${focus.blur.toFixed(2)}px)`;
    slice.style.setProperty("--slice-sharpness", focus.sharpness.toFixed(3));
  });

  outputs.focalLength.value = `${Math.round(params.focalLength)} px`;
  outputs.focusDepth.value = params.focusDepth.toFixed(2);
  outputs.focusArea.value = `${Math.round(params.focusArea * 100)}%`;
  outputs.maxBlur.value = `${params.maxBlur.toFixed(1).replace(".0", "")} px`;
  outputs.yaw.value = `${Math.round(params.yaw)}°`;

  controls.focalLength.value = String(params.focalLength);
  controls.focusDepth.value = String(params.focusDepth);
  controls.focusArea.value = String(params.focusArea);
  controls.maxBlur.value = String(params.maxBlur);
  controls.yaw.value = String(params.yaw);

  updateProfile();
}

function ease(value) {
  return 1 - Math.pow(1 - value, 3);
}

function animateFocusDepth(target, duration = 900) {
  const start = params.focusDepth;
  const token = ++animationToken;

  if (prefersReducedMotion() || duration <= 0) {
    params.focusDepth = target;
    render();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const startedAt = performance.now();

    function frame(now) {
      if (token !== animationToken) {
        resolve();
        return;
      }

      const progress = Math.min(1, (now - startedAt) / duration);
      params.focusDepth = start + (target - start) * ease(progress);
      render();

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        params.focusDepth = target;
        render();
        resolve();
      }
    }

    requestAnimationFrame(frame);
  });
}

async function goToState(name, { immediate = false } = {}) {
  if (!(name in focusPresets)) return;

  if (running) {
    pendingState = name;
    return;
  }

  const target = focusPresets[name];

  if (
    currentState === name
    && Math.abs(params.focusDepth - target) < 0.001
  ) {
    syncStateButtons();
    return;
  }

  running = true;
  syncStateButtons(name);

  try {
    await animateFocusDepth(target, immediate ? 0 : 900);
    currentState = name;
  } finally {
    running = false;
    syncStateButtons();

    if (pendingState && pendingState !== currentState) {
      const queued = pendingState;
      pendingState = null;
      void goToState(queued);
    } else {
      pendingState = null;
    }
  }
}

function bindControl(key, { parse = Number, customFocus = false } = {}) {
  controls[key].addEventListener("input", () => {
    animationToken += 1;
    running = false;
    pendingState = null;
    params[key] = parse(controls[key].value);

    if (customFocus) clearStateButtons();

    render();
  });
}

bindControl("focalLength");
bindControl("focusDepth", { customFocus: true });
bindControl("focusArea");
bindControl("maxBlur");
bindControl("yaw");

stateButtons.forEach((button) =>
  button.addEventListener("click", () =>
    void goToState(button.dataset.dofState)
  )
);

replayButton.addEventListener("click", async () => {
  await goToState("near", { immediate: true });
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
  await goToState("middle");
  await goToState("far");
  await goToState("middle");
});

render();
syncStateButtons();
