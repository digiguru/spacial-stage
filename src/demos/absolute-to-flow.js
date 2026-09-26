import {
  animateFlip,
  animateFlowSpace,
  captureRect
} from "../spacial-stage.js";

const stage = document.querySelector("#flowStage");
const article = document.querySelector("#flowArticle");
const paragraphOne = document.querySelector("#paragraphOne");
const slot = document.querySelector("#flowSlot");
const svgObject = document.querySelector("#flowSvg");
const stateBackground = document.querySelector("#stateBackground");
const stateInline = document.querySelector("#stateInline");
const replayButton = document.querySelector("#replayDemo");

const DURATION = 900;
const EASING = "cubic-bezier(.2,.82,.24,1)";
const COLLAPSED_GAP = 24;
const INLINE_PADDING = 24;

let mode = "background";
let running = false;

function inlineSize() {
  const articleRect = article.getBoundingClientRect();
  return Math.min(360, Math.max(220, articleRect.width * 0.62));
}

function stageRectForBackground() {
  const stageRect = stage.getBoundingClientRect();
  const size = inlineSize() * 3;

  return {
    left: stageRect.left - size * 0.18,
    top: stageRect.top + Math.max(12, stageRect.height * 0.03),
    width: size,
    height: size
  };
}

function inlineMetrics() {
  const articleRect = article.getBoundingClientRect();
  const slotRect = slot.getBoundingClientRect();
  const size = inlineSize();

  return {
    rect: {
      left: articleRect.left + (articleRect.width - size) / 2,
      top: slotRect.top + INLINE_PADDING,
      width: size,
      height: size
    },
    slotHeight: size + INLINE_PADDING * 2
  };
}

function placeAbsoluteAt(rect) {
  const stageRect = stage.getBoundingClientRect();

  if (svgObject.parentElement !== stage) {
    stage.append(svgObject);
  }

  Object.assign(svgObject.style, {
    position: "absolute",
    left: (rect.left - stageRect.left) + "px",
    top: (rect.top - stageRect.top) + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    margin: "0"
  });
}

function settleInline(metrics) {
  slot.append(svgObject);
  Object.assign(svgObject.style, {
    position: "relative",
    left: "auto",
    top: "auto",
    width: metrics.rect.width + "px",
    height: metrics.rect.height + "px",
    margin: INLINE_PADDING + "px 0 0"
  });
}

function updateButtons() {
  stateBackground.classList.toggle("is-active", mode === "background");
  stateInline.classList.toggle("is-active", mode === "inline");
}

function setBackgroundImmediately() {
  mode = "background";
  stage.dataset.mode = mode;
  slot.style.height = COLLAPSED_GAP + "px";
  placeAbsoluteAt(stageRectForBackground());
  updateButtons();
}

function setInlineImmediately() {
  mode = "inline";
  stage.dataset.mode = mode;
  const metrics = inlineMetrics();
  slot.style.height = metrics.slotHeight + "px";
  settleInline(metrics);
  updateButtons();
}

async function toInline() {
  if (running || mode === "inline") return;
  running = true;

  const fromRect = captureRect(svgObject);
  const metrics = inlineMetrics();

  placeAbsoluteAt(metrics.rect);
  mode = "inline";
  stage.dataset.mode = mode;
  updateButtons();

  await Promise.all([
    animateFlip(svgObject, fromRect, metrics.rect, {
      duration: DURATION,
      easing: EASING
    }),
    animateFlowSpace(slot, COLLAPSED_GAP, metrics.slotHeight, {
      duration: DURATION,
      easing: EASING
    })
  ]);

  settleInline(metrics);
  running = false;
}

async function toBackground() {
  if (running || mode === "background") return;
  running = true;

  const fromRect = captureRect(svgObject);
  const currentHeight = slot.getBoundingClientRect().height;
  const targetRect = stageRectForBackground();

  placeAbsoluteAt(targetRect);
  mode = "background";
  stage.dataset.mode = mode;
  updateButtons();

  await Promise.all([
    animateFlip(svgObject, fromRect, targetRect, {
      duration: DURATION,
      easing: EASING
    }),
    animateFlowSpace(slot, currentHeight, COLLAPSED_GAP, {
      duration: DURATION,
      easing: EASING
    })
  ]);

  running = false;
}

async function replay() {
  if (running) return;
  setBackgroundImmediately();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await toInline();
}

stateBackground.addEventListener("click", () => void toBackground());
stateInline.addEventListener("click", () => void toInline());
replayButton.addEventListener("click", () => void replay());

window.addEventListener("resize", () => {
  if (running) return;
  if (mode === "inline") setInlineImmediately();
  else setBackgroundImmediately();
});

setBackgroundImmediately();
