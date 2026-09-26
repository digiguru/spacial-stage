import {
  animateBetweenStates,
  applyFrame,
  captureNaturalSize,
  destinationFrame,
  normaliseSpec
} from "../spacial-stage.js";

const demo = document.body.dataset.demo;
const stage = document.querySelector("[data-lab-stage]");
const replay = document.querySelector("[data-replay]");

function nextFrame() {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );
}

function clearAnimations(root = document) {
  root.querySelectorAll("*").forEach((element) => {
    element.getAnimations?.().forEach((animation) => animation.cancel());
  });
}

function runAnimation(element, frames, options = {}) {
  element.getAnimations?.().forEach((animation) => animation.cancel());
  return element.animate(frames, {
    duration: 1200,
    easing: "cubic-bezier(.2,.82,.24,1)",
    fill: "both",
    ...options
  });
}

function activate(button, selector) {
  document.querySelectorAll(selector).forEach((item) =>
    item.classList.toggle("is-active", item === button)
  );
}

function stageObject() {
  return document.querySelector("#labObject");
}

function prepareFrameworkObject(object) {
  if (!object || !stage) return;
  captureNaturalSize(object);
}

if (demo === "easing") {
  const rows = [...document.querySelectorAll("[data-easing]")];

  function run() {
    rows.forEach((row) => {
      const runner = row.querySelector(".lab-runner");
      const track = row.querySelector(".lab-track");
      const distance = Math.max(0, track.clientWidth - 66);
      runAnimation(
        runner,
        [
          { transform: "translateX(0)" },
          { transform: `translateX(${distance}px)` }
        ],
        { duration: 1800, easing: row.dataset.easing }
      );
    });
  }

  replay?.addEventListener("click", run);
  run();
}

if (demo === "speed") {
  const rows = [...document.querySelectorAll("[data-duration]")];

  function run() {
    rows.forEach((row) => {
      const runner = row.querySelector(".lab-runner");
      const track = row.querySelector(".lab-track");
      const distance = Math.max(0, track.clientWidth - 66);
      runAnimation(
        runner,
        [
          { transform: "translateX(0)" },
          { transform: `translateX(${distance}px)` }
        ],
        {
          duration: Number(row.dataset.duration),
          easing: "cubic-bezier(.2,.82,.24,1)"
        }
      );
    });
  }

  replay?.addEventListener("click", run);
  run();
}

if (demo === "blur-focus") {
  const blurred = document.querySelector("#blurredObject");
  const focused = document.querySelector("#focusedObject");

  function run() {
    runAnimation(
      blurred,
      [
        { filter: "blur(0px) saturate(1)", opacity: 1, transform: "scale(1)" },
        { filter: "blur(16px) saturate(.78)", opacity: .32, transform: "scale(.96)" }
      ],
      { duration: 1600 }
    );
    runAnimation(
      focused,
      [
        { filter: "blur(16px) saturate(.78)", opacity: .32, transform: "scale(.96)" },
        { filter: "blur(0px) saturate(1)", opacity: 1, transform: "scale(1)" }
      ],
      { duration: 1600 }
    );
  }

  replay?.addEventListener("click", run);
  run();
}

if (demo === "size") {
  const object = stageObject();
  prepareFrameworkObject(object);

  const small = normaliseSpec({
    animations: ["slide"],
    horizontalAnchor: "center",
    verticalAnchor: "center",
    sizeMode: "absolute",
    sizeWidth: 110,
    sizeHeight: 110,
    duration: 1500
  });
  const large = normaliseSpec({
    ...small,
    sizeWidth: 300,
    sizeHeight: 170
  });

  async function run() {
    applyFrame(object, destinationFrame(object, stage, small));
    await nextFrame();
    await animateBetweenStates(object, stage, small, large);
  }

  replay?.addEventListener("click", () => void run());
  void run();
}

if (demo === "rotation") {
  const object = stageObject();
  prepareFrameworkObject(object);
  const buttons = [...document.querySelectorAll("[data-angle]")];
  let current = 0;

  async function go(angle) {
    const from = normaliseSpec({
      animations: ["slide"],
      horizontalAnchor: "center",
      verticalAnchor: "center",
      rotateZ: current,
      duration: 1400
    });
    const to = normaliseSpec({ ...from, rotateZ: angle });
    current = angle;
    activate(buttons.find((button) => Number(button.dataset.angle) === angle), "[data-angle]");
    await animateBetweenStates(object, stage, from, to);
  }

  buttons.forEach((button) =>
    button.addEventListener("click", () => void go(Number(button.dataset.angle)))
  );
  replay?.addEventListener("click", async () => {
    current = -90;
    applyFrame(
      object,
      destinationFrame(
        object,
        stage,
        normaliseSpec({
          horizontalAnchor: "center",
          verticalAnchor: "center",
          rotateZ: -90
        })
      )
    );
    await nextFrame();
    await go(270);
  });
}

if (demo === "absolute-absolute") {
  const object = stageObject();
  prepareFrameworkObject(object);

  const a = normaliseSpec({
    animations: ["slide"],
    horizontalAnchor: "left",
    verticalAnchor: "top",
    positionX: 28,
    positionY: 28,
    sizeMode: "absolute",
    sizeWidth: 120,
    sizeHeight: 120,
    rotateZ: -12,
    duration: 1800
  });
  const b = normaliseSpec({
    ...a,
    horizontalAnchor: "right",
    verticalAnchor: "bottom",
    positionX: -30,
    positionY: -30,
    sizeWidth: 180,
    sizeHeight: 110,
    rotateZ: 24
  });

  async function forward() {
    applyFrame(object, destinationFrame(object, stage, a));
    await nextFrame();
    await animateBetweenStates(object, stage, a, b);
  }

  async function reverse() {
    applyFrame(object, destinationFrame(object, stage, b));
    await nextFrame();
    await animateBetweenStates(object, stage, b, a);
  }

  document.querySelector("[data-forward]")?.addEventListener("click", () => void forward());
  document.querySelector("[data-reverse]")?.addEventListener("click", () => void reverse());
  replay?.addEventListener("click", () => void forward());
  void forward();
}

if (demo === "alignment") {
  const object = stageObject();
  prepareFrameworkObject(object);
  const buttons = [...document.querySelectorAll("[data-alignment]")];
  const placements = {
    top: { horizontalAnchor: "center", verticalAnchor: "top", positionX: 0, positionY: 28 },
    right: { horizontalAnchor: "right", verticalAnchor: "center", positionX: -28, positionY: 0 },
    bottom: { horizontalAnchor: "center", verticalAnchor: "bottom", positionX: 0, positionY: -28 },
    left: { horizontalAnchor: "left", verticalAnchor: "center", positionX: 28, positionY: 0 }
  };
  let current = "top";

  function spec(name) {
    return normaliseSpec({
      animations: ["slide"],
      sizeMode: "absolute",
      sizeWidth: 104,
      sizeHeight: 104,
      duration: 1200,
      ...placements[name]
    });
  }

  async function go(name) {
    const from = spec(current);
    const to = spec(name);
    current = name;
    activate(buttons.find((button) => button.dataset.alignment === name), "[data-alignment]");
    await animateBetweenStates(object, stage, from, to);
  }

  buttons.forEach((button) =>
    button.addEventListener("click", () => void go(button.dataset.alignment))
  );

  replay?.addEventListener("click", async () => {
    current = "top";
    applyFrame(object, destinationFrame(object, stage, spec("top")));
    await nextFrame();
    for (const name of ["right", "bottom", "left", "top"]) {
      await go(name);
    }
  });

  applyFrame(object, destinationFrame(object, stage, spec("top")));
}

if (demo === "spacing") {
  const paddingBox = document.querySelector("#paddingBox");
  const marginInner = document.querySelector("#marginInner");

  function run() {
    paddingBox.getAnimations?.().forEach((animation) => animation.cancel());
    marginInner.getAnimations?.().forEach((animation) => animation.cancel());

    paddingBox.animate(
      [{ padding: "8px" }, { padding: "56px 28px" }],
      { duration: 1800, easing: "cubic-bezier(.2,.82,.24,1)", fill: "both" }
    );
    marginInner.animate(
      [{ margin: "8px" }, { margin: "56px 28px" }],
      { duration: 1800, easing: "cubic-bezier(.2,.82,.24,1)", fill: "both" }
    );
  }

  replay?.addEventListener("click", run);
  run();
}

if (demo === "cube") {
  const cube = document.querySelector(".cube");

  function run() {
    runAnimation(
      cube,
      [
        { transform: "rotateX(-18deg) rotateY(-25deg) rotateZ(0deg)" },
        { transform: "rotateX(342deg) rotateY(695deg) rotateZ(180deg)" }
      ],
      { duration: 3600, easing: "cubic-bezier(.22,.75,.18,1)" }
    );
  }

  replay?.addEventListener("click", run);
  run();
}

if (demo === "parallax") {
  const scene = document.querySelector(".parallax-scene");
  const layers = [...document.querySelectorAll(".parallax-layer")];
  const depths = [18, 34, 58];

  function position(x, y) {
    layers.forEach((layer, index) => {
      const depth = depths[index];
      layer.style.transform =
        `translate(-50%, -50%) translate3d(${x * depth}px, ${y * depth}px, ${index * 55}px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg)`;
    });
  }

  scene.addEventListener("pointermove", (event) => {
    const rect = scene.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - .5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - .5) * 2;
    position(x, y);
  });
  scene.addEventListener("pointerleave", () => position(0, 0));

  replay?.addEventListener("click", () => {
    layers.forEach((layer, index) => {
      const depth = depths[index];
      runAnimation(
        layer,
        [
          { transform: `translate(-50%, -50%) translate3d(${-depth}px, ${depth * .5}px, ${index * 55}px) rotateX(-6deg) rotateY(-9deg)` },
          { transform: `translate(-50%, -50%) translate3d(${depth}px, ${-depth * .5}px, ${index * 55}px) rotateX(6deg) rotateY(9deg)` },
          { transform: `translate(-50%, -50%) translate3d(0, 0, ${index * 55}px) rotateX(0deg) rotateY(0deg)` }
        ],
        { duration: 2200 }
      );
    });
  });

  position(0, 0);
}

if (demo === "coverflow") {
  const covers = [...document.querySelectorAll(".cover")];
  let active = 2;

  function layout(index, animate = true) {
    active = (index + covers.length) % covers.length;

    covers.forEach((cover, coverIndex) => {
      const delta = coverIndex - active;
      const abs = Math.abs(delta);
      const x = delta * 118;
      const z = abs === 0 ? 120 : -abs * 75;
      const y = abs * 8;
      const rotateY = delta < 0 ? 58 : delta > 0 ? -58 : 0;
      const opacity = abs > 2 ? .25 : 1;
      const transform =
        `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotateY}deg) scale(${abs === 0 ? 1.08 : .86})`;

      if (!animate) {
        cover.style.transform = transform;
        cover.style.opacity = opacity;
        return;
      }

      runAnimation(
        cover,
        [
          { transform: getComputedStyle(cover).transform === "none" ? cover.style.transform || transform : getComputedStyle(cover).transform, opacity: getComputedStyle(cover).opacity },
          { transform, opacity }
        ],
        { duration: 900 }
      ).finished.then(() => {
        cover.style.transform = transform;
        cover.style.opacity = opacity;
      }).catch(() => {});
    });
  }

  document.querySelector("[data-prev]")?.addEventListener("click", () => layout(active - 1));
  document.querySelector("[data-next]")?.addEventListener("click", () => layout(active + 1));
  replay?.addEventListener("click", async () => {
    layout(0, false);
    await nextFrame();
    for (let index = 1; index < covers.length; index += 1) {
      layout(index);
      await new Promise((resolve) => setTimeout(resolve, 780));
    }
  });
  layout(active, false);
}

if (demo === "stagger") {
  const cards = [...document.querySelectorAll(".stagger-card")];

  function run() {
    cards.forEach((card, index) => {
      runAnimation(
        card,
        [
          { transform: "translateY(70px) rotate(-8deg)", opacity: 0 },
          { transform: "translateY(0) rotate(0deg)", opacity: 1 }
        ],
        { duration: 760, delay: index * 120 }
      );
    });
  }

  replay?.addEventListener("click", run);
  run();
}

if (demo === "reveal-collapse") {
  const revealCard = document.querySelector("#revealCard");
  const collapseCard = document.querySelector("#collapseCard");

  function run() {
    runAnimation(
      revealCard,
      [
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0 0 0)" }
      ],
      { duration: 1500 }
    );
    runAnimation(
      collapseCard,
      [
        { transform: "scaleX(.08)", transformOrigin: "left center" },
        { transform: "scaleX(1)", transformOrigin: "left center" }
      ],
      { duration: 1500 }
    );
  }

  replay?.addEventListener("click", run);
  run();
}

if (demo === "responsive") {
  const frame = document.querySelector(".responsive-frame");
  const object = stageObject();
  prepareFrameworkObject(object);

  function spec(anchor) {
    return normaliseSpec({
      animations: ["slide"],
      horizontalAnchor: anchor === "left" ? "left" : "right",
      verticalAnchor: anchor === "left" ? "top" : "bottom",
      positionMode: "percent",
      positionX: anchor === "left" ? 6 : -6,
      positionY: anchor === "left" ? 8 : -8,
      sizeMode: "percent",
      sizeWidth: 24,
      sizeHeight: 24,
      duration: 1400
    });
  }

  async function run() {
    const a = spec("left");
    const b = spec("right");
    applyFrame(object, destinationFrame(object, frame, a));
    await nextFrame();
    await animateBetweenStates(object, frame, a, b);
  }

  replay?.addEventListener("click", () => void run());
  window.addEventListener("resize", () => void run());
  void run();
}

if (demo === "reduced-motion") {
  const motion = document.querySelector("#motionObject");
  const reduced = document.querySelector("#reducedObject");

  function run() {
    runAnimation(
      motion,
      [
        { transform: "translateX(-110px) rotate(-25deg)", opacity: .2 },
        { transform: "translateX(110px) rotate(25deg)", opacity: 1 }
      ],
      { duration: 1600 }
    );

    reduced.getAnimations?.().forEach((animation) => animation.cancel());
    reduced.style.transform = "translateX(-110px) rotate(0deg)";
    reduced.style.opacity = ".2";
    requestAnimationFrame(() => {
      reduced.style.transform = "translateX(110px) rotate(0deg)";
      reduced.style.opacity = "1";
    });
  }

  replay?.addEventListener("click", run);
  run();
}
