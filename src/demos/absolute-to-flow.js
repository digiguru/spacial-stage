import { createPlacementController } from "../spacial-stage.js";

const stage = document.querySelector("#flowStage");
const slot = document.querySelector("#flowSlot");
const svgObject = document.querySelector("#flowSvg");
const stateBackground = document.querySelector("#stateBackground");
const stateInline = document.querySelector("#stateInline");
const replayButton = document.querySelector("#replayDemo");
const replayReverseButton = document.querySelector("#replayReverse");

const DURATION = 1800;
const EASING = "cubic-bezier(.2,.82,.24,1)";

const placement = createPlacementController(svgObject, {
  initial: "background",
  duration: DURATION,
  easing: EASING,
  placements: {
    background: {
      type: "absolute",
      container: stage,
      sizeFrom: "inline",
      scale: 3,
      anchorX: "left",
      anchorY: "top",
      offsetX: { value: -0.62, relativeTo: "self" },
      offsetY: { value: 0.03, relativeTo: "container" },
      rotateZ: -90
    },
    inline: {
      type: "flow",
      slot,
      align: "center",
      collapsedHeight: 24,
      gapBefore: 24,
      gapAfter: 24,
      rotateZ: 0,
      style: {
        width: "clamp(220px, 62%, 360px)",
        height: "auto",
        aspectRatio: "1 / 1"
      }
    }
  }
});

function updateButtons() {
  stateBackground.classList.toggle("is-active", placement.current === "background");
  stateInline.classList.toggle("is-active", placement.current === "inline");
}

async function goTo(name, { animate = true } = {}) {
  if (placement.running) return;

  stage.dataset.mode = name === "inline" ? "inline" : "background";

  if (animate) {
    stage.dataset.transitioning = "true";

    try {
      await placement.transition(name);
    } finally {
      delete stage.dataset.transitioning;
    }
  } else {
    placement.apply(name);
  }

  updateButtons();
}

async function replay(from, to) {
  if (placement.running) return;

  await goTo(from, { animate: false });
  await new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
  await goTo(to);
}

stateBackground.addEventListener("click", () => void goTo("background"));
stateInline.addEventListener("click", () => void goTo("inline"));
replayButton.addEventListener("click", () => void replay("background", "inline"));
replayReverseButton.addEventListener("click", () => void replay("inline", "background"));

window.addEventListener("resize", () => {
  if (placement.running) return;
  placement.apply(placement.current || "background");
});

stage.dataset.mode = "background";
updateButtons();
